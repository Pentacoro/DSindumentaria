const cartCrypto = {
    // Secret key - change this in production!
    secret: 'MOONSHOP_SECRET_' + new Date().getFullYear(),
    
    // Character set for Base62 encoding
    base62Chars: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    
    // Mappings storage
    productMap: {},      // productId -> product object
    colorMaps: {},       // productId -> {colorName: index}
    sizeMaps: {},        // productId -> {size: index}
    
    // Initialize (called from init.js)
    async init() {
        await this.buildMappings();
        console.log('Cart crypto initialized with mappings');
    },
    
    // Build product, color, and size mappings
    async buildMappings() {
        try {
            const inventoryData = await inventory.loadInventory();
            
            this.productMap = {};
            this.colorMaps = {};
            this.sizeMaps = {};
            
            // Build mappings for each product
            Object.values(inventoryData).forEach(product => {
                // Use product.id if exists, otherwise use inventory key
                const productId = product.id || this.getInventoryKey(product.name, inventoryData);
                
                if (!productId) return;
                
                // Store product reference
                this.productMap[productId] = product;
                
                // Build color index map (0-based)
                this.colorMaps[productId] = {};
                if (product.colors && product.colors.length > 0) {
                    product.colors.forEach((color, index) => {
                        this.colorMaps[productId][color.name] = index;
                    });
                }
                
                // Build size index map (0-based)
                this.sizeMaps[productId] = {};
                if (product.sizes && product.sizes.length > 0) {
                    product.sizes.forEach((size, index) => {
                        this.sizeMaps[productId][size] = index;
                    });
                }
            });
            
        } catch (error) {
            console.error('Failed to build mappings:', error);
        }
    },
    
    // Get inventory key for a product name
    getInventoryKey(productName, inventoryData) {
        const entry = Object.entries(inventoryData).find(([key, product]) => 
            product.name === productName
        );
        return entry ? entry[0] : null;
    },
    
    // Generate a cart token from cart items
    async generateToken(cartItems) {
        try {
            // 1. Convert cart items to ultra-compact format
            const itemsString = this.itemsToString(cartItems);
            
            // 2. Add timestamp (minutes since epoch)
            const timestamp = Math.floor(Date.now() / 60000);
            
            // 3. Combine data
            const data = `${itemsString}|${timestamp}`;
            
            // 4. Compress using Base62
            const compressed = await this.compressString(data);
            
            // 5. Add verification hash (8 characters)
            const hash = await this.generateHash(compressed);
            const token = compressed + '-' + hash.substring(0, 8);
            
            return token;
            
        } catch (error) {
            console.error('Error generating token:', error);
            return null;
        }
    },
    
    // Convert cart items to compact string format
    itemsToString(cartItems) {
        const inventoryData = inventory.getAllProducts();
        
        return cartItems.map(item => {
            return this.encodeItem(item, inventoryData);
        }).join(',');
    },
    
    // Encode single item to ultra-compact format
    encodeItem(item, inventoryData) {
        // Get product ID for this variant
        const productId = this.getProductIdFromVariant(item.id, inventoryData);
        
        if (!productId) {
            // Fallback: use full variant ID
            return `${item.id}:${item.quantity}`;
        }
        
        // Extract color and size from variant ID
        const parts = item.id.split('_');
        const colorName = parts.length > 1 ? parts[1] : 'default';
        const size = parts.length > 2 ? parts[2] : 'default';
        
        // Get color and size indices (hex encoded: 0-9,a-f for 0-15)
        const colorIndex = this.colorMaps[productId]?.[colorName] ?? 0;
        const sizeIndex = this.sizeMaps[productId]?.[size] ?? 0;
        
        const colorCode = colorIndex.toString(16); // Convert to hex (0-f)
        const sizeCode = sizeIndex.toString(16);   // Convert to hex (0-f)
        
        // Format: "S0001[colorCode][sizeCode]:[quantity]"
        return `${productId}${colorCode}${sizeCode}:${item.quantity}`;
    },
    
    // Get product ID from variant ID
    getProductIdFromVariant(variantId, inventoryData) {
        // Find product by matching the beginning of variantId
        for (const [key, product] of Object.entries(inventoryData)) {
            if (variantId.startsWith(product.name + '_') || variantId === product.name) {
                return product.id || key;
            }
        }
        return null;
    },
    
    // Parse items string back to decoded items
    parseItemsString(itemsString) {
        if (!itemsString) return [];
        
        const inventoryData = inventory.getAllProducts();
        
        return itemsString.split(',').map(itemStr => {
            return this.decodeItem(itemStr, inventoryData);
        });
    },
    
    // Decode compact format back to item info
    decodeItem(encoded, inventoryData) {
        // Try to parse as compact format: "S0001[colorHex][sizeHex]:[quantity]"
        // Example: "S000100:1" (product S0001, color 0, size 0, quantity 1)
        
        // Better regex that handles product IDs like S0001, T0001, etc.
        const compactMatch = encoded.match(/^([A-Z]\d{3,})([0-9a-f])([0-9a-f]):(\d+)$/);
        
        if (compactMatch) {
            const [, productId, colorCode, sizeCode, quantityStr] = compactMatch;
            const product = this.productMap[productId] || 
                        Object.values(inventoryData).find(p => p.id === productId);
            
            if (product) {
                const colorIndex = parseInt(colorCode, 16);
                const sizeIndex = parseInt(sizeCode, 16);
                const quantity = parseInt(quantityStr);
                
                // Get color name from index
                let colorName = 'default';
                if (product.colors && product.colors[colorIndex]) {
                    colorName = product.colors[colorIndex].name;
                }
                
                // Get size from index
                let size = 'default';
                if (product.sizes && product.sizes[sizeIndex]) {
                    size = product.sizes[sizeIndex];
                }
                
                return {
                    variantId: `${product.name}_${colorName}_${size}`,
                    productId: productId,
                    colorName: colorName,
                    size: size,
                    quantity: quantity
                };
            }
        }
        
        // Fallback: parse as old format "variantId:quantity"
        const lastColon = encoded.lastIndexOf(':');
        const quantity = parseInt(encoded.substring(lastColon + 1));
        const variantId = encoded.substring(0, lastColon);
        
        return {
            variantId: variantId,
            quantity: quantity,
            productId: null,
            colorName: 'default',
            size: 'default'
        };
    },
    
    // Compress string using Base62 encoding
    async compressString(str) {
        // Convert string to byte array
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        
        // Convert to BigInt
        let bigInt = 0n;
        for (let i = 0; i < data.length; i++) {
            bigInt = (bigInt << 8n) | BigInt(data[i]);
        }
        
        // Convert to Base62
        return this.toBase62(bigInt);
    },
    
    // Convert BigInt to Base62 string
    toBase62(num) {
        if (num === 0n) return '0';
        
        let result = '';
        const base = 62n;
        
        while (num > 0n) {
            const remainder = num % base;
            result = this.base62Chars[Number(remainder)] + result;
            num = num / base;
        }
        
        return result;
    },
    
    // Convert Base62 string back to BigInt
    fromBase62(str) {
        let result = 0n;
        const base = 62n;
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const value = BigInt(this.base62Chars.indexOf(char));
            result = result * base + value;
        }
        
        return result;
    },
    
    // Decompress Base62 string back to original string
    async decompressString(compressedStr) {
        try {
            // Convert from Base62 to BigInt
            const bigInt = this.fromBase62(compressedStr);
            
            // Convert BigInt to byte array
            const bytes = [];
            let temp = bigInt;
            
            while (temp > 0n) {
                bytes.unshift(Number(temp & 0xFFn));
                temp = temp >> 8n;
            }
            
            // Convert bytes to string
            const decoder = new TextDecoder();
            return decoder.decode(new Uint8Array(bytes));
            
        } catch (error) {
            console.error('Error decompressing string:', error);
            return null;
        }
    },
    
    // Generate short hash for verification
    async generateHash(data) {
        const encoder = new TextEncoder();
        const secretData = encoder.encode(data + this.secret);
        
        // Use SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', secretData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        
        // Convert to Base62 for shorter output
        let hashInt = 0n;
        hashArray.forEach(byte => {
            hashInt = (hashInt << 8n) | BigInt(byte);
        });
        
        return this.toBase62(hashInt);
    },
    
    // Restore cart from token
    async restoreCart(token) {
        try {
            // Split token and hash
            const parts = token.split('-');
            if (parts.length !== 2) {
                throw new Error('Invalid token format');
            }
            
            const [compressedData, hash] = parts;
            
            // Verify hash
            const expectedHash = await this.generateHash(compressedData);
            if (!expectedHash.startsWith(hash)) {
                throw new Error('Invalid token hash');
            }
            
            // Decompress data
            const data = await this.decompressString(compressedData);
            if (!data) {
                throw new Error('Failed to decompress token');
            }
            
            // Parse data: "itemsString|timestamp"
            const [itemsString, timestampStr] = data.split('|');
            const timestamp = parseInt(timestampStr);
            
            // Optional: Check if token is expired (7 days)
            const currentMinutes = Math.floor(Date.now() / 60000);
            if (currentMinutes - timestamp > 7 * 24 * 60) {
                console.warn('Token is expired but will still process');
            }
            
            // Parse items string
            const parsedItems = this.parseItemsString(itemsString);
            
            return parsedItems;
            
        } catch (error) {
            console.error('Error restoring cart from token:', error);
            return null;
        }
    },
    
    // Convert parsed items to actual cart items with variant info
    async convertToCartItems(parsedItems) {
        const cartItems = [];
        const inventoryData = inventory.getAllProducts();
        
        for (const parsedItem of parsedItems) {
            // Find product by ID or name
            let product;
            
            if (parsedItem.productId) {
                product = this.productMap[parsedItem.productId];
            }
            
            if (!product) {
                // Try to find by name from variantId
                const productName = parsedItem.variantId.split('_')[0];
                product = Object.values(inventoryData).find(p => p.name === productName);
            }
            
            if (product) {
                // Find color object
                const colorObj = product.colors?.find(c => c.name === parsedItem.colorName) || 
                               (parsedItem.colorName === 'default' ? null : null);
                
                // Create display name
                let displayName = product.name;
                if (parsedItem.colorName && parsedItem.colorName !== 'default') {
                    displayName += ` (${parsedItem.colorName})`;
                }
                if (parsedItem.size && parsedItem.size !== 'default') {
                    displayName += ` (${parsedItem.size})`;
                }
                
                console.log(parsedItem)
                cartItems.push({
                    id: parsedItem.variantId,
                    name: displayName,
                    price: product.price,
                    quantity: parsedItem.quantity,
                    color: colorObj,
                    size: parsedItem.size !== 'default' ? parsedItem.size : null
                });
            }
        }
        
        return cartItems;
    },

    // Debug method to see token contents
    async debugToken(token) {
        console.log('=== Token Debug ===');
        console.log('Full token:', token);
        
        const parts = token.split('-');
        if (parts.length !== 2) {
            console.error('Invalid token format');
            return;
        }
        
        const [compressedData, hash] = parts;
        console.log('Compressed data:', compressedData);
        console.log('Hash:', hash);
        
        // Decompress and show raw data
        const data = await this.decompressString(compressedData);
        console.log('Decompressed data:', data);
        
        if (data) {
            const [itemsString, timestamp] = data.split('|');
            console.log('Items string:', itemsString);
            console.log('Timestamp:', timestamp);
            
            // Parse each item
            const items = itemsString.split(',');
            console.log('Parsed items:');
            items.forEach((item, i) => {
                console.log(`  Item ${i}: "${item}"`);
                
                // Try to decode
                const decoded = this.decodeItem(item, inventory.getAllProducts());
                console.log(`  Decoded:`, decoded);
            });
        }
    }
};

// Make it globally accessible
window.cartCrypto = cartCrypto;