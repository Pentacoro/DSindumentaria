const overlayManager = {
    init() {
        this.overlay = document.getElementById('overlay')
        this.cartMenu = document.getElementById('cartMenu')
        this.filterModal = document.querySelector('.filter-modal')
        this.articlePage = document.querySelector('.article-page')
        
        this.isCartOpen = false
        this.nonCartMenu = null
        
        this.setupEventListeners()
    },
    
    setupEventListeners() {
        // Close menu buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-menu')) {
                this.handleCloseButton(e.target)
            }
        })
        
        // Overlay click - close all menus
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeAllMenus()
            }
        })
        
        // Escape key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey()
            }
        })
    },
    
    handleCloseButton(closeButton) {
        const menu = closeButton.closest('.cart-menu, .filter-modal, .article-page')
        
        if (menu.classList.contains('cart-menu')) {
            this.closeCartMenu()
        } else if (menu.classList.contains('filter-modal')) {
            this.closeFilterModal()
        } else if (menu.classList.contains('article-page')) {
            this.closeArticlePage()
        }
    },
    
    handleEscapeKey() {
        if (this.isCartOpen) {
            this.closeCartMenu()
        } else if (this.nonCartMenu) {
            this.closeNonCartMenu()
        }
    },
    
    updateOverlay() {
        const shouldShowOverlay = this.isCartOpen || this.nonCartMenu
        if (shouldShowOverlay) {
            this.overlay.classList.add('active')
        } else {
            this.overlay.classList.remove('active')
        }
    },
    
    // Cart Menu Methods
    openCartMenu() {
        this.isCartOpen = true
        this.cartMenu.classList.add('active')
        this.updateOverlay()
    },
    
    closeCartMenu() {
        this.isCartOpen = false
        this.cartMenu.classList.remove('active')
        this.updateOverlay()
    },
    
    toggleCartMenu() {
        if (this.isCartOpen) {
            this.closeCartMenu()
        } else {
            this.openCartMenu()
        }
    },
    
    // Non-Cart Menu Methods
    openFilterModal() {
        this.closeNonCartMenu()
        this.nonCartMenu = 'filter'
        this.filterModal.classList.remove('hidden')
        this.updateOverlay()
    },
    
    openArticlePage() {
        this.closeNonCartMenu()
        this.nonCartMenu = 'article'
        this.articlePage.classList.remove('hidden')
        this.updateOverlay()
    },

    openArticlePageWithoutHistory() {
        // Open article page without triggering URL changes
        this.closeNonCartMenu()
        this.nonCartMenu = 'article'
        this.articlePage.classList.remove('hidden')
        this.updateOverlay()
    },
    
    closeNonCartMenu() {
        if (this.nonCartMenu === 'filter') {
            this.filterModal.classList.add('hidden')
        } else if (this.nonCartMenu === 'article') {
            this.articlePage.classList.add('hidden')
        }
        this.nonCartMenu = null
        this.updateOverlay()
    },
    
    closeFilterModal() {
        if (this.nonCartMenu === 'filter') {
            this.closeNonCartMenu()
        }
    },
    
    closeArticlePage() {
        if (this.nonCartMenu === 'article') {
            this.closeNonCartMenu()
            // Clear article from URL (this will add to history)
            if (articlePage && urlState) {
                articlePage.closeArticle()
                urlState.clearArticle()
            }
        }
    },

    closeArticlePageWithoutHistory() {
        // Just close without updating URL
        if (this.nonCartMenu === 'article') {
            this.closeNonCartMenu()
            if (articlePage) {
                articlePage.closeArticle()
            }
        }
    },
    
    closeAllMenus() {
        this.closeCartMenu()
        this.closeNonCartMenu()
    },

    handleEscapeKey() {
        if (this.isCartOpen) {
            this.closeCartMenu()
        } else if (this.nonCartMenu) {
            if (this.nonCartMenu === 'article') {
                this.closeArticlePage()
            } else {
                this.closeNonCartMenu()
            }
        }
    }
}