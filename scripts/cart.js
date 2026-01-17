const cart = {
    init() {
        this.items = JSON.parse(localStorage.getItem('cart')) || []
        this.setupEventListeners()
        this.updateCartDisplay()
    },
    
    setupEventListeners() {
        // Event delegation for cart item actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-btn') || e.target.closest('.quantity-btn')) {
                this.handleQuantityChange(e)
                articlePage.updateAddToCartButton()
            } else if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
                this.handleRemoveItem(e)
                articlePage.updateAddToCartButton()
            } else if (e.target.classList.contains('checkout-btn')) {
                this.handleCheckout()
            }
        })
    },
    
    addItem(itemData) {
        const existingItem = this.items.find(item => item.id === itemData.id)
        
        if (existingItem) {
            existingItem.quantity += 1
        } else {
            this.items.push({
                id: itemData.id,
                name: itemData.name,
                price: itemData.price,
                quantity: itemData.quantity || 1,
                color: itemData.color,
                size: itemData.size
            })
        }
        
        this.saveToStorage()
        this.updateCartDisplay()
        this.updateAllProductButtons()
    },
    
    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId)
        this.saveToStorage()
        this.updateCartDisplay()
        this.updateAllProductButtons()
    },
    
    updateQuantity(itemId, newQuantity) {
        const item = this.items.find(item => item.id === itemId)
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(itemId)
            } else {
                item.quantity = newQuantity
                this.saveToStorage()
                this.updateCartDisplay()
                this.updateAllProductButtons()
            }
        }
    },
    
    handleQuantityChange(e) {
        const button = e.target.classList.contains('quantity-btn') ? e.target : e.target.closest('.quantity-btn')
        const cartItem = button.closest('.cart-item')
        const itemId = cartItem.dataset.itemId
        
        const quantityElement = cartItem.querySelector('.cart-item-quantity span')
        let currentQuantity = parseInt(quantityElement.textContent)
        
        if (button.textContent === '+' || button.querySelector('span')?.textContent === '+') {
            this.updateQuantity(itemId, currentQuantity + 1)
        } else if (button.textContent === '-' || button.querySelector('span')?.textContent === '-') {
            this.updateQuantity(itemId, currentQuantity - 1)
        }
    },
    
    handleRemoveItem(e) {
        const button = e.target.classList.contains('remove-item') ? e.target : e.target.closest('.remove-item')
        const cartItem = button.closest('.cart-item')
        const itemId = cartItem.dataset.itemId
        
        this.removeItem(itemId)
    },
    
    getItemByVariant(variantId) {
        return this.items.find(item => item.id === variantId)
    },

    isProductInCart(productName) {
        return this.items.some(item => {
            // Check if item ID starts with the product name (any variant)
            return item.id.startsWith(productName + '_')
        })
    },
    
    getProductVariants(productName) {
        return this.items.filter(item => item.id.startsWith(productName + '_'))
    },
    
    saveToStorage() {
        localStorage.setItem('cart', JSON.stringify(this.items))
    },

    updateAllProductButtons() {
        document.querySelectorAll('.cart-btn').forEach(button => {
            const productId = button.dataset.productId
            const product = inventory.getProductById(productId)
            
            if (product) {
                const isInCart = this.isProductInCart(product.name)
                const hasOptions = product.colors.length > 0 || product.sizes.length > 0
                
                // Update button state
                if (isInCart) {
                    button.classList.remove('add')
                    button.classList.add('in-cart')
                } else {
                    button.classList.remove('in-cart')
                    button.classList.add('add')
                }
                
                // Update data attribute if needed
                button.dataset.hasOptions = hasOptions
            }
        })
    },
    
    updateCartDisplay() {
        const cartContent = document.getElementById('cartContent')
        const cartTotal = document.getElementById('cartTotal')
        
        if (this.items.length === 0) {
            cartContent.innerHTML = '<div class="empty-cart">Tu carrito está vacío</div>'
            cartTotal.textContent = '$0'
            return
        }
        
        let total = 0
        let itemsHTML = ''
        
        this.items.forEach(item => {
            const itemTotal = item.price * item.quantity
            total += itemTotal
            
            itemsHTML += `
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toLocaleString('es-AR')}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn">+</button>
                        </div>
                    </div>
                    <div>
                        <div>$${itemTotal.toLocaleString('es-AR')}</div>
                        <button class="remove-item">Eliminar</button>
                    </div>
                </div>
            `
        })
        
        cartContent.innerHTML = itemsHTML
        cartTotal.textContent = `$${total.toLocaleString('es-AR')}`
    },
    
    updateCartButtonStates() {
        // Update product article buttons based on cart state
        if (articlePage && articlePage.currentProduct) {
            articlePage.updateAddToCartButton()
        }
        
        // Update product list buttons
        document.querySelectorAll('.cart-btn').forEach(button => {
            const productId = button.dataset.productId
            const product = inventory.getProductById(productId)
            
            if (product) {
                const baseVariantId = `${product.name}_default_default`
                const existingItem = this.getItemByVariant(baseVariantId)
                
                if (existingItem) {
                    button.classList.remove('add')
                    button.classList.add('remove')
                } else {
                    button.classList.remove('remove')
                    button.classList.add('add')
                }
            }
        })
    },
    
    handleCheckout() {
        if (this.items.length === 0) return
        
        this.generateCheckoutLink().then(url => {
            const message = this.generateWhatsAppMessage(url)
            const encodedMessage = encodeURIComponent(message)
            const whatsappUrl = `https://wa.me/5491125077899?text=${encodedMessage}`
            
            window.open(whatsappUrl, '_blank')
        })
    },

    async generateCheckoutLink() {
        const token = await cartCrypto.generateToken(this.items)
        const url = new URL(window.location.origin + window.location.pathname)
        url.searchParams.set('cart', token)
        return url.toString()
    },
    
    generateWhatsAppMessage(verificationUrl) {
        let message = "¡Buenas! Estoy interesado en comprar:\n\n"
        
        this.items.forEach(item => {
            message += `• ${item.name} - Cantidad: ${item.quantity} - $${(item.price * item.quantity).toLocaleString('es-AR')}\n`
        })
        
        const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        message += `\nTotal: $${total.toLocaleString('es-AR')}`
        message += `\n\n${verificationUrl}`
        
        return message
    },
    
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0)
    },
    
    clearCart() {
        this.items = []
        this.saveToStorage()
        this.updateCartDisplay()
        this.updateAllProductButtons()
    }
}

// Make cart globally accessible
window.cart = cart