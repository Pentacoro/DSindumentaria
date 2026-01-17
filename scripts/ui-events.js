const uiEvents = {
    init() {
        this.setupCartButton()
        this.setupFilterButton()
        this.setupArticleClicks()
        this.setupHamburgerMenu()
        this.setupProductCartButtons()
    },

    setupProductCartButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-btn')) {
                this.handleProductCartButton(e.target)
            }
        })
    },
    
    handleProductCartButton(button) {
        const productId = button.dataset.productId
        const product = inventory.getProductById(productId)
        const hasOptions = button.dataset.hasOptions === 'true'
        
        if (!product) return
        
        const baseVariantId = `${product.name}_default_default`
        const isInCart = cart.isProductInCart(product.name)
        
        if (isInCart) {
            // Blue cart icon state - open cart menu
            overlayManager.openCartMenu()
        } else {
            // Green plus icon state
            if (hasOptions) {
                // Has color/size options - open article page
                this.openArticlePage(productId)
            } else {
                // No options - add directly to cart
                cart.addItem({
                    id: baseVariantId,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    color: null,
                    size: null
                })
                // Update button to blue cart icon
                button.classList.remove('add')
                button.classList.add('in-cart')
            }
        }
    },
    
    setupCartButton() {
        const cartButton = document.getElementById('cart')
        if (cartButton) {
            cartButton.addEventListener('click', () => {
                overlayManager.toggleCartMenu()
            })
        }
    }   ,
    
    setupFilterButton() {
        const filterSystem = document.querySelector('.filter-system')
        if (filterSystem) {
            // Get the second button in filter-system (after search button)
            const filterButton = filterSystem.querySelectorAll('button')[1]
            if (filterButton) {
                filterButton.addEventListener('click', () => {
                    overlayManager.openFilterModal()
                })
            }
        }
    },
    
    setupArticleClicks() {
        // Touch events for article clicks
        document.addEventListener('touchstart', (e) => {
            this.handleArticleTouchStart(e)
        })
        
        document.addEventListener('touchend', (e) => {
            this.handleArticleTouchEnd(e)
        })
        
        // Mouse events for article clicks
        document.addEventListener('click', (e) => {
            this.handleArticleClick(e)
        })
    },
    
    handleArticleTouchStart(e) {
        const article = e.target.closest('main .shop-list > li')
        if (!article) return
        
        // Store touch start position and time
        article._touchStartX = e.touches[0].clientX
        article._touchStartY = e.touches[0].clientY
        article._touchStartTime = Date.now()
    },
    
    handleArticleTouchEnd(e) {
        const article = e.target.closest('main .shop-list > li')
        if (!article || !article._touchStartX) return
        
        const touchEndX = e.changedTouches[0].clientX
        const touchEndY = e.changedTouches[0].clientY
        const touchDuration = Date.now() - article._touchStartTime
        
        // Calculate movement distance
        const deltaX = Math.abs(touchEndX - article._touchStartX)
        const deltaY = Math.abs(touchEndY - article._touchStartY)
        const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        
        // Check if it was a tap (minimal movement and short duration)
        const isTap = totalMovement < 10 && touchDuration < 300
        
        // Don't open article page if it was a drag or interactive element
        if (isTap && !this.isInteractiveElement(e.target)) {
            e.preventDefault()
            e.stopPropagation()
            
            const productId = article.dataset.productId
            this.openArticlePage(productId)
        }
        
        // Clean up
        delete article._touchStartX
        delete article._touchStartY
        delete article._touchStartTime
    },
    
    handleArticleClick(e) {
        const article = e.target.closest('main .shop-list > li')
        if (!article) return
        
        // Don't open article page if clicking on interactive elements
        if (this.isInteractiveElement(e.target)) {
            return
        }
        
        e.preventDefault()
        e.stopPropagation()
        
        const productId = article.dataset.productId
        this.openArticlePage(productId)
    },
    
    isInteractiveElement(element) {
        return element.closest('.cart-btn, .carousel-btn, .indicator') !== null
    },
    
    wasDrag(touchEvent) {
        // Simple check for drag vs tap
        // In a real implementation, you'd track touch movement
        return false // Placeholder - would need touch start/move tracking
    },
    
    openArticlePage(productId) {
        articlePage.openArticle(productId)
    },
    
    setupHamburgerMenu() {
        const hamburgerMenu = document.querySelector('.hamburger-menu')
        const mobileDropdown = document.querySelector('.mobile-dropdown')
        
        if (hamburgerMenu && mobileDropdown) {
            hamburgerMenu.addEventListener('click', (e) => {
                e.stopPropagation()
                mobileDropdown.classList.toggle('active')
                
                // Animate hamburger icon
                const spans = document.querySelectorAll('.hamburger-icon span')
                if (mobileDropdown.classList.contains('active')) {
                    spans[0].style.transform = 'rotate(45deg) translate(9px, 9px)'
                    spans[1].style.opacity = '0'
                    spans[2].style.transform = 'rotate(-45deg) translate(9px, -9px)'
                } else {
                    spans[0].style.transform = 'none'
                    spans[1].style.opacity = '1'
                    spans[2].style.transform = 'none'
                }
            })
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.hamburger-menu') && !e.target.closest('.mobile-dropdown')) {
                    mobileDropdown.classList.remove('active')
                    
                    // Reset hamburger icon
                    const spans = document.querySelectorAll('.hamburger-icon span')
                    spans[0].style.transform = 'none'
                    spans[1].style.opacity = '1'
                    spans[2].style.transform = 'none'
                }
            })
            
            // Close dropdown when a menu item is clicked
            const mobileButtons = mobileDropdown.querySelectorAll('button')
            mobileButtons.forEach(button => {
                button.addEventListener('click', () => {
                    mobileDropdown.classList.remove('active')
                    
                    // Reset hamburger icon
                    const spans = document.querySelectorAll('.hamburger-icon span')
                    spans[0].style.transform = 'none'
                    spans[1].style.opacity = '1'
                    spans[2].style.transform = 'none'
                })
            })
        }
    }
}