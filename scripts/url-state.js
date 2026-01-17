const urlState = {
    init() {
        this.handleInitialState()
        this.setupPopStateListener()
    },
    
    setupPopStateListener() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            this.handlePopState()
        })
    },
    
    handlePopState() {
        const params = this.getURLParams()
        
        // Handle page changes
        if (params.pagina) {
            const page = parseInt(params.pagina)
            if (!isNaN(page) && page > 0) {
                pagination.goToPageWithoutHistory(page)
            }
        } else {
            // If no page parameter, go to page 1
            pagination.resetToFirstPageWithoutHistory()
        }
        
        // Handle article changes
        if (params.articulo) {
            this.openArticleFromURL(params.articulo)
        } else {
            // Close article if no article parameter
            if (overlayManager.nonCartMenu === 'article') {
                overlayManager.closeArticlePageWithoutHistory()
            }
        }
    },
    
    async openArticleFromURL(articleName) {
        try {
            const inventoryData = await inventory.loadInventory()
            const productEntry = Object.entries(inventoryData).find(([id, product]) => 
                product.name === articleName
            )
            
            if (productEntry) {
                const [productId, product] = productEntry
                articlePage.openArticleWithoutHistory(productId)
            }
        } catch (error) {
            console.error('Error loading article from URL:', error)
        }
    },
    
    updateURL(params = {}) {
        const url = new URL(window.location)
        
        // Clear all existing params
        url.search = ''
        
        // Add non-empty params
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== '' && params[key] !== undefined) {
                url.searchParams.set(key, encodeURIComponent(params[key]))
            }
        })
        
        // Add to history
        window.history.pushState({}, '', url)
    },
    
    getURLParams() {
        const params = new URLSearchParams(window.location.search)
        const result = {}
        
        for (const [key, value] of params) {
            result[key] = decodeURIComponent(value)
        }
        
        return result
    },
    
    handleInitialState() {
        const params = this.getURLParams()

        // Handle cart token
        if (params.cart) {
            setTimeout(async () => {
                const items = await cartCrypto.restoreCart(params.cart)
                if (items) {
                    const cartItems = await cartCrypto.convertToCartItems(items)
                    // Clear and restore cart
                    cart.clearCart()
                    cartItems.forEach(item => cart.addItem(item))
                    overlayManager.openCartMenu()
                }
            }, 300)
        }
        
        // Handle page parameter
        if (params.pagina) {
            const page = parseInt(params.pagina)
            if (!isNaN(page) && page > 0) {
                // Wait for pagination to be initialized
                setTimeout(() => {
                    pagination.goToPageWithoutHistory(page)
                }, 100)
            }
        }
        
        // Handle article parameter
        if (params.articulo) {
            // Wait for inventory to load
            setTimeout(() => {
                this.openArticleFromURL(params.articulo)
            }, 200)
        }
    },
    
    setPage(page) {
        const params = this.getURLParams()
        params.pagina = page.toString()
        this.updateURL(params)
    },
    
    setArticle(productName) {
        const params = this.getURLParams()
        params.articulo = productName
        this.updateURL(params)
    },
    
    clearArticle() {
        const params = this.getURLParams()
        delete params.articulo
        
        // If we have page parameter, keep it
        if (params.pagina) {
            this.updateURL({ pagina: params.pagina })
        } else {
            // No params left, go to clean URL
            this.updateURL({})
        }
    },
    
    clearPage() {
        const params = this.getURLParams()
        delete params.pagina
        
        // If we have article parameter, keep it
        if (params.articulo) {
            this.updateURL({ articulo: params.articulo })
        } else {
            // No params left, go to clean URL
            this.updateURL({})
        }
    }
}