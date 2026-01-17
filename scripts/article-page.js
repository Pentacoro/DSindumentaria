const articlePage = {
    currentTouchHandlers: null,
    
    init() {
        this.currentProduct = null
        this.selectedColor = null
        this.selectedSize = null
        this.currentImageIndex = 0
        
        this.setupEventListeners()
    },
    
    setupEventListeners() {
        // Color selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.article-page .colors li')) {
                this.handleColorSelect(e.target.closest('li'))
            }
        })
        
        // Size selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.article-page .sizes li')) {
                this.handleSizeSelect(e.target.closest('li'))
            }
        })
        
        // Thumbnail selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.article-page .list li')) {
                this.handleThumbnailSelect(e.target.closest('li'))
            }
        })
        
        // Add to cart button
        document.addEventListener('click', (e) => {
            if (e.target.closest('.article-page .body > button')) {
                this.handleAddToCart()
            }
        })
    },
    
    openArticle(productId) {
        const product = inventory.getProductById(productId)
        if (!product) return
        
        this.currentProduct = product
        this.selectedColor = product.colors.length > 0 ? product.colors[0] : null
        this.selectedSize = product.sizes.length > 0 ? product.sizes[0] : null
        this.currentImageIndex = 0
        
        this.populateArticleData()
        this.setupImageGallery()
        this.updateAddToCartButton()
        overlayManager.openArticlePage()
        
        // Update URL with history
        if (urlState) {
            urlState.setArticle(product.name)
        }
    },

    openArticleWithoutHistory(productId) {
        const product = inventory.getProductById(productId)
        if (!product) return
        
        this.currentProduct = product
        this.selectedColor = product.colors.length > 0 ? product.colors[0] : null
        this.selectedSize = product.sizes.length > 0 ? product.sizes[0] : null
        this.currentImageIndex = 0
        
        this.populateArticleData()
        this.setupImageGallery()
        this.updateAddToCartButton()
        overlayManager.openArticlePageWithoutHistory()
    },

    closeArticle() {
        // Remove any touch event listeners
        const imagesContainer = document.querySelector('.article-page .images');
        if (imagesContainer && this.currentTouchHandlers) {
            this.removeCarouselTouchEvents(imagesContainer);
        }
        
        this.currentProduct = null;
        this.selectedColor = null;
        this.selectedSize = null;
        this.currentImageIndex = 0;
        
        // Clear article from URL
        if (urlState) {
            urlState.clearArticle();
        }
        
        overlayManager.closeArticlePage();
    },
    
    populateArticleData() {
        const articleElement = document.querySelector('.article-page')
        
        // Basic info
        articleElement.querySelector('.body h1').textContent = this.currentProduct.name
        articleElement.querySelector('.body h2').textContent = `$${this.currentProduct.price.toLocaleString('es-AR')}`
        
        // Tags
        const tagsContainer = articleElement.querySelector('.body .tags')
        tagsContainer.innerHTML = this.currentProduct.tags.map(tag => 
            `<li>${tag}</li>`
        ).join('')
        
        // Colors
        const colorsContainer = articleElement.querySelector('.body .colors')
        if (this.currentProduct.colors.length > 0) {
            colorsContainer.innerHTML = this.currentProduct.colors.map((color, index) => 
                `<li class="${index === 0 ? 'selected' : ''}" 
                      style="background-color: ${color.hex}"
                      data-color-index="${index}"
                      data-color-name="${color.name}"></li>`
            ).join('')
            colorsContainer.style.display = 'flex'
        } else {
            colorsContainer.style.display = 'none'
        }
        
        // Initial sizes (based on first color or all sizes if no colors)
        this.updateSizesForSelectedColor()
    },
    
    updateSizesForSelectedColor() {
        const sizesContainer = document.querySelector('.body .sizes')
        
        if (!this.selectedColor && this.currentProduct.sizes.length > 0) {
            // No colors but has sizes
            sizesContainer.innerHTML = this.currentProduct.sizes.map((size, index) => 
                `<li class="${index === 0 ? 'selected' : ''}" 
                      data-size="${size}">${size}</li>`
            ).join('')
            sizesContainer.style.display = 'flex'
            this.selectedSize = this.currentProduct.sizes[0]
        } else if (this.selectedColor && this.selectedColor.availableSizes && this.selectedColor.availableSizes.length > 0) {
            // Color with specific sizes
            sizesContainer.innerHTML = this.selectedColor.availableSizes.map((size, index) => 
                `<li class="${index === 0 ? 'selected' : ''}" 
                      data-size="${size}">${size}</li>`
            ).join('')
            sizesContainer.style.display = 'flex'
            this.selectedSize = this.selectedColor.availableSizes[0]
        } else if (this.currentProduct.sizes.length > 0) {
            // Fallback to all sizes
            sizesContainer.innerHTML = this.currentProduct.sizes.map((size, index) => 
                `<li class="${index === 0 ? 'selected' : ''}" 
                      data-size="${size}">${size}</li>`
            ).join('')
            sizesContainer.style.display = 'flex'
            this.selectedSize = this.currentProduct.sizes[0]
        } else {
            sizesContainer.style.display = 'none'
            this.selectedSize = null
        }
        
        this.updateAddToCartButton()
    },
    
    setupImageGallery() {
        const imagesContainer = document.querySelector('.article-page .images')
        const imagesWrapper = document.querySelector('.article-page .images-container') // New wrapper
        const listContainer = document.querySelector('.article-page .list')
        
        // Clear existing
        imagesContainer.innerHTML = ''
        listContainer.innerHTML = ''
        
        // Remove any color background
        imagesWrapper.style.backgroundImage = ''
        imagesWrapper.style.backgroundSize = ''
        imagesWrapper.style.backgroundPosition = ''
        imagesWrapper.style.backgroundRepeat = ''
        
        // Always start with product images
        this.currentProduct.images.forEach((image, index) => {
            const imgElement = document.createElement('li')
            imgElement.style.backgroundImage = `url("${image}")`
            imagesContainer.appendChild(imgElement)

            imagesContainer.style.opacity = '1'
        })
        
        // Create thumbnails
        this.currentProduct.images.forEach((image, index) => {
            const thumbElement = document.createElement('li')
            thumbElement.style.backgroundImage = `url("${image}")`
            thumbElement.classList.toggle('active', index === 0)
            thumbElement.dataset.imageIndex = index
            listContainer.appendChild(thumbElement)
        })
        
        this.currentImageIndex = 0
        this.updateCarouselPosition()
        
        // Setup touch events for carousel
        this.setupCarouselTouchEvents(imagesContainer)
        
        // Setup scroll for thumbnails
        this.setupThumbnailScroll(listContainer)
    },
    
    setupCarouselTouchEvents(imagesContainer) {
        // Remove any existing event listeners first
        if (this.currentTouchHandlers) {
            this.removeCarouselTouchEvents(imagesContainer);
        }
        
        let startX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let isDragging = false;
        const totalImages = () => this.getTotalImages();
        
        const startDrag = (clientX) => {
            isDragging = true;
            startX = clientX;
            prevTranslate = this.currentImageIndex * -100;
            currentTranslate = prevTranslate;
            imagesContainer.style.transition = 'none';
        };
        
        const duringDrag = (clientX) => {
            if (!isDragging) return;
            
            const diff = clientX - startX;
            currentTranslate = prevTranslate + (diff / imagesContainer.offsetWidth) * 100;
            
            // Calculate boundaries
            const maxTranslate = (totalImages() - 1) * -100;
            const minTranslate = 0;
            
            // Apply boundaries with resistance
            if (currentTranslate > minTranslate) {
                const overshoot = currentTranslate - minTranslate;
                currentTranslate = minTranslate + overshoot * 0.3;
            } else if (currentTranslate < maxTranslate) {
                const overshoot = currentTranslate - maxTranslate;
                currentTranslate = maxTranslate + overshoot * 0.3;
            }
            
            imagesContainer.style.transform = `translateX(${currentTranslate}%)`;
        };
        
        const endDrag = () => {
            if (!isDragging) return;
            
            isDragging = false;
            imagesContainer.style.transition = 'transform 0.3s ease';
            
            const movedBy = currentTranslate - prevTranslate;
            const threshold = 20;
            
            let newIndex = this.currentImageIndex;
            
            // Calculate boundaries for snapping
            const maxTranslate = (totalImages() - 1) * -100;
            const minTranslate = 0;
            
            // If drag is beyond boundaries, snap back to edge
            if (currentTranslate > minTranslate) {
                newIndex = 0;
            } else if (currentTranslate < maxTranslate) {
                newIndex = totalImages() - 1;
            } else if (Math.abs(movedBy) > threshold) {
                // Normal swipe within boundaries
                if (movedBy > 0) {
                    newIndex = Math.max(0, this.currentImageIndex - 1);
                } else {
                    newIndex = Math.min(totalImages() - 1, this.currentImageIndex + 1);
                }
            } else {
                // Small drag - snap to nearest image
                const dragPosition = Math.abs(currentTranslate % 100);
                if (dragPosition > 50) {
                    if (movedBy > 0 && this.currentImageIndex > 0) {
                        newIndex = this.currentImageIndex - 1;
                    } else if (movedBy < 0 && this.currentImageIndex < totalImages() - 1) {
                        newIndex = this.currentImageIndex + 1;
                    }
                }
            }
            
            newIndex = Math.max(0, Math.min(totalImages() - 1, newIndex));
            this.currentImageIndex = newIndex;
            this.updateCarouselPosition();
        };
        
        // Store the bound functions for later removal
        const handleTouchStart = (e) => startDrag(e.touches[0].clientX);
        const handleTouchMove = (e) => duringDrag(e.touches[0].clientX);
        const handleTouchEnd = endDrag;
        const handleMouseDown = (e) => startDrag(e.clientX);
        const handleMouseMove = (e) => duringDrag(e.clientX);
        const handleMouseUp = endDrag;
        const handleMouseLeave = endDrag;
        
        // Add event listeners
        imagesContainer.addEventListener('touchstart', handleTouchStart);
        imagesContainer.addEventListener('touchmove', handleTouchMove);
        imagesContainer.addEventListener('touchend', handleTouchEnd);
        imagesContainer.addEventListener('mousedown', handleMouseDown);
        imagesContainer.addEventListener('mousemove', handleMouseMove);
        imagesContainer.addEventListener('mouseup', handleMouseUp);
        imagesContainer.addEventListener('mouseleave', handleMouseLeave);
        
        // Store handlers for cleanup
        this.currentTouchHandlers = {
            imagesContainer: imagesContainer,
            touchStart: handleTouchStart,
            touchMove: handleTouchMove,
            touchEnd: handleTouchEnd,
            mouseDown: handleMouseDown,
            mouseMove: handleMouseMove,
            mouseUp: handleMouseUp,
            mouseLeave: handleMouseLeave
        };
    },

    removeCarouselTouchEvents(imagesContainer) {
        if (!this.currentTouchHandlers || 
            this.currentTouchHandlers.imagesContainer !== imagesContainer) {
            return;
        }
        
        const handlers = this.currentTouchHandlers;
        
        imagesContainer.removeEventListener('touchstart', handlers.touchStart);
        imagesContainer.removeEventListener('touchmove', handlers.touchMove);
        imagesContainer.removeEventListener('touchend', handlers.touchEnd);
        imagesContainer.removeEventListener('mousedown', handlers.mouseDown);
        imagesContainer.removeEventListener('mousemove', handlers.mouseMove);
        imagesContainer.removeEventListener('mouseup', handlers.mouseUp);
        imagesContainer.removeEventListener('mouseleave', handlers.mouseLeave);
        
        this.currentTouchHandlers = null;
    },
    
    setupThumbnailScroll(listContainer) {
        let isScrolling = false
        let startX = 0
        let startY = 0
        let scrollLeft = 0
        let scrollTop = 0
        
        const isMobile = window.matchMedia('(max-width: 1000px)').matches
        
        const startScroll = (clientX, clientY) => {
            isScrolling = true
            
            if (isMobile) {
                // Vertical scroll for mobile
                startY = clientY - listContainer.offsetTop
                scrollTop = listContainer.scrollTop
            } else {
                // Horizontal scroll for desktop
                startX = clientX - listContainer.offsetLeft
                scrollLeft = listContainer.scrollLeft
            }
            
            listContainer.style.cursor = 'grabbing'
            listContainer.style.userSelect = 'none'
        }
        
        const duringScroll = (clientX, clientY) => {
            if (!isScrolling) return
            
            if (isMobile) {
                // Vertical scroll
                const y = clientY - listContainer.offsetTop
                const walk = (y - startY) * 2
                listContainer.scrollTop = scrollTop - walk
            } else {
                // Horizontal scroll
                const x = clientX - listContainer.offsetLeft
                const walk = (x - startX) * 2
                listContainer.scrollLeft = scrollLeft - walk
            }
        }
        
        const endScroll = () => {
            isScrolling = false
            listContainer.style.cursor = 'grab'
            listContainer.style.userSelect = 'auto'
        }
        
        // Touch events
        listContainer.addEventListener('touchstart', (e) => {
            startScroll(e.touches[0].clientX, e.touches[0].clientY)
        })
        
        listContainer.addEventListener('touchmove', (e) => {
            duringScroll(e.touches[0].clientX, e.touches[0].clientY)
        })
        
        listContainer.addEventListener('touchend', endScroll)
        
        // Mouse events
        listContainer.addEventListener('mousedown', (e) => {
            startScroll(e.clientX, e.clientY)
        })
        
        listContainer.addEventListener('mousemove', (e) => {
            duringScroll(e.clientX, e.clientY)
        })
        
        listContainer.addEventListener('mouseup', endScroll)
        listContainer.addEventListener('mouseleave', endScroll)
        
        // Set initial cursor
        listContainer.style.cursor = 'grab'
        
        // Update scroll direction on resize
        window.addEventListener('resize', () => {
            // Cursor will update on next interaction
        })
    },
    
    getTotalImages() {
        // Always return the number of product images (not counting color background)
        return this.currentProduct.images.length
    },
    
    updateImagesWithColor() {
        const imagesContainer = document.querySelector('.article-page .images')
        
        // Clear existing
        imagesContainer.innerHTML = ''
        
        // Add color image first, then product images
        const displayImages = [
            this.selectedColor.image,
            ...this.currentProduct.images
        ]
        
        // Create main carousel images
        displayImages.forEach((image, index) => {
            const imgElement = document.createElement('li')
            imgElement.style.backgroundImage = `url("${image}")`
            imagesContainer.appendChild(imgElement)
        })
        
        // Reset to first image (color image)
        this.currentImageIndex = 0
        this.updateCarouselPosition()
        
        // Re-setup touch events for new images
        this.setupCarouselTouchEvents(imagesContainer)
    },
    
    updateCarouselPosition() {
        const imagesContainer = document.querySelector('.article-page .images')
        imagesContainer.style.transform = `translateX(-${this.currentImageIndex * 100}%)`
        this.updateThumbnailActiveState()
    },
    
    updateThumbnailActiveState() {
        const thumbs = document.querySelectorAll('.article-page .list li')
        
        // Clear all active states first
        thumbs.forEach(thumb => {
            thumb.classList.remove('active')
        })
        
        // If color image is shown (background is set), no thumbnail should be active
        const imagesWrapper = document.querySelector('.article-page .images-container')
        if (imagesWrapper.style.backgroundImage && imagesWrapper.style.backgroundImage !== 'none') {
            return // No active thumbnail when color image is shown
        }
        
        // Set active thumbnail based on current image index
        if (thumbs[this.currentImageIndex]) {
            thumbs[this.currentImageIndex].classList.add('active')
        }
    },
    
    handleThumbnailSelect(thumbElement) {
        const thumbIndex = parseInt(thumbElement.dataset.imageIndex)
        
        // Remove color background if any
        const imagesWrapper = document.querySelector('.article-page .images-container')
        imagesWrapper.style.backgroundImage = ''
        imagesWrapper.style.backgroundSize = ''
        imagesWrapper.style.backgroundPosition = ''
        imagesWrapper.style.backgroundRepeat = ''
        
        // Show the carousel images
        const imagesContainer = document.querySelector('.article-page .images')
        imagesContainer.style.opacity = '1'
        
        // Clear color selection
        this.selectedColor = null
        document.querySelectorAll('.article-page .colors li').forEach(li => {
            li.classList.remove('selected')
        })
        if (this.currentProduct.colors.length > 0) {
            document.querySelector('.article-page .colors li:first-child').classList.add('selected')
            this.selectedColor = this.currentProduct.colors[0]
        }
        
        // Update sizes based on selected color (or all sizes)
        this.updateSizesForSelectedColor()
        
        // Go to selected thumbnail
        this.currentImageIndex = thumbIndex
        this.updateCarouselPosition()
    },

    handleColorSelect(colorElement) {
        document.querySelectorAll('.article-page .colors li').forEach(li => {
            li.classList.remove('selected')
        })
        colorElement.classList.add('selected')
        
        const colorIndex = parseInt(colorElement.dataset.colorIndex)
        this.selectedColor = this.currentProduct.colors[colorIndex]
        
        // Only set background image if the color has an image
        const imagesWrapper = document.querySelector('.article-page .images-container')
        if (this.selectedColor.image) {
            imagesWrapper.style.backgroundImage = `url("${this.selectedColor.image}")`
            imagesWrapper.style.backgroundSize = 'contain'
            imagesWrapper.style.backgroundPosition = 'center'
            imagesWrapper.style.backgroundRepeat = 'no-repeat'
            
            // Hide the carousel images
            const imagesContainer = document.querySelector('.article-page .images')
            imagesContainer.style.opacity = '0'
        } else {
            // No color image - show normal carousel
            imagesWrapper.style.backgroundImage = ''
            const imagesContainer = document.querySelector('.article-page .images')
            imagesContainer.style.opacity = '1'
        }
        
        // Update available sizes for this color
        this.updateSizesForSelectedColor()
        
        // No active thumbnails when color image is shown
        this.updateThumbnailActiveState()
        this.updateAddToCartButton()
    },
    
    handleSizeSelect(sizeElement) {
        document.querySelectorAll('.article-page .sizes li').forEach(li => {
            li.classList.remove('selected')
        })
        sizeElement.classList.add('selected')
        
        this.selectedSize = sizeElement.dataset.size
        this.updateAddToCartButton()
    },
    
    getVariantId() {
        const colorName = this.selectedColor ? this.selectedColor.name : 'default'
        const size = this.selectedSize || 'default'
        return `${this.currentProduct.name}_${colorName}_${size}`
    },
    
    updateAddToCartButton() {
        const button = document.querySelector('.article-page .body > button')
        
        if (!this.currentProduct) return
        
        const variantId = this.getVariantId()
        const existingItem = cart.getItemByVariant(variantId)
        
        if (existingItem) {
            button.textContent = `Cantidad: ${existingItem.quantity}`
            button.style.backgroundColor = '#007bff'
        } else {
            button.textContent = 'Añadir al Carrito'
            button.style.backgroundColor = ''
        }
    },
    
    handleAddToCart() {
        if (!this.currentProduct) return
        
        const variantId = this.getVariantId()
        const displayName = this.getDisplayName()
        
        const existingItem = cart.getItemByVariant(variantId)
        
        if (existingItem) {
            overlayManager.toggleCartMenu()
        } else {
            cart.addItem({
                id: variantId,
                name: displayName,
                price: this.currentProduct.price,
                quantity: 1,
                color: this.selectedColor ? this.selectedColor.name : null,
                size: this.selectedSize
            })
        }
        
        this.updateAddToCartButton()
    },
    
    getDisplayName() {
        let name = this.currentProduct.name
        if (this.selectedColor) {
            name += ` (${this.selectedColor.name})`
        }
        if (this.selectedSize) {
            name += ` (${this.selectedSize})`
        }
        return name
    },
}