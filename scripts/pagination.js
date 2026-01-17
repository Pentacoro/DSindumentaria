const pagination = {
    init() {
        this.controls = document.querySelector('.pagination-controls')
        this.pagesContainer = document.querySelector('.pagination-pages')
        this.prevBtn = document.querySelector('.pagination-prev')
        this.nextBtn = document.querySelector('.pagination-next')
        this.currentPage = 1
        this.itemsPerPage = 12
        this.totalPages = 1
        
        this.setupEventListeners()
    },
    
    setupEventListeners() {
        this.prevBtn.addEventListener('click', () => this.previousPage())
        this.nextBtn.addEventListener('click', () => this.nextPage())
        
        // Event delegation for page buttons
        this.pagesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-page')) {
                const page = parseInt(e.target.dataset.page)
                this.goToPage(page)
            }
        })
    },
    
    updatePagination(totalItems) {
        this.totalPages = Math.ceil(totalItems / this.itemsPerPage)
        this.renderPageButtons()
        this.updateButtonStates()
    },
    
    renderPageButtons() {
        // Keep the first page button, remove others
        const firstPageBtn = this.pagesContainer.querySelector('[data-page="1"]')
        this.pagesContainer.innerHTML = ''
        this.pagesContainer.appendChild(firstPageBtn)
        
        // Add page buttons with ellipsis logic
        if (this.totalPages <= 7) {
            // Show all pages
            for (let i = 2; i <= this.totalPages; i++) {
                this.pagesContainer.appendChild(this.createPageButton(i))
            }
        } else {
            // Complex pagination with ellipsis
            if (this.currentPage <= 4) {
                // Show first 5 pages, ellipsis, last page
                for (let i = 2; i <= 5; i++) {
                    this.pagesContainer.appendChild(this.createPageButton(i))
                }
                this.pagesContainer.appendChild(this.createEllipsis())
                this.pagesContainer.appendChild(this.createPageButton(this.totalPages))
            } else if (this.currentPage >= this.totalPages - 3) {
                // Show first page, ellipsis, last 5 pages
                this.pagesContainer.appendChild(this.createPageButton(2))
                this.pagesContainer.appendChild(this.createEllipsis())
                for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
                    this.pagesContainer.appendChild(this.createPageButton(i))
                }
            } else {
                // Show first page, ellipsis, current-1, current, current+1, ellipsis, last page
                this.pagesContainer.appendChild(this.createPageButton(2))
                this.pagesContainer.appendChild(this.createEllipsis())
                for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
                    this.pagesContainer.appendChild(this.createPageButton(i))
                }
                this.pagesContainer.appendChild(this.createEllipsis())
                this.pagesContainer.appendChild(this.createPageButton(this.totalPages))
            }
        }
        
        this.updateActivePage()
    },
    
    createPageButton(pageNumber) {
        const button = document.createElement('button')
        button.className = 'pagination-page'
        button.textContent = pageNumber
        button.dataset.page = pageNumber
        return button
    },
    
    createEllipsis() {
        const span = document.createElement('span')
        span.textContent = '...'
        span.style.padding = '0 8px'
        span.style.color = 'var(--secondary-color-gray)'
        return span
    },
    
    updateActivePage() {
        const pageButtons = this.pagesContainer.querySelectorAll('.pagination-page')
        pageButtons.forEach(button => {
            button.classList.toggle('active', parseInt(button.dataset.page) === this.currentPage)
        })
    },
    
    updateButtonStates() {
        this.prevBtn.disabled = this.currentPage === 1
        this.nextBtn.disabled = this.currentPage === this.totalPages
    },
    
    previousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1)
        }
    },
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.goToPage(this.currentPage + 1)
        }
    },
    
    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return
        
        this.currentPage = page
        this.updateActivePage()
        this.updateButtonStates()
        
        // Update URL with history
        if (urlState) {
            urlState.setPage(page)
        }
        
        // Dispatch custom event for other modules to listen to
        document.dispatchEvent(new CustomEvent('pageChanged', {
            detail: { page: this.currentPage }
        }))
    },
    
    goToPageWithoutHistory(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return
        
        this.currentPage = page
        this.updateActivePage()
        this.updateButtonStates()
        
        // Dispatch event without updating URL (used when URL changes from browser navigation)
        document.dispatchEvent(new CustomEvent('pageChanged', {
            detail: { page: this.currentPage }
        }))
    },
    
    getCurrentPageItems(allItems) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage
        const endIndex = startIndex + this.itemsPerPage
        return allItems.slice(startIndex, endIndex)
    },
    
    resetToFirstPage() {
        this.currentPage = 1
        this.updateActivePage()
        this.updateButtonStates()
        
        // Clear page from URL
        if (urlState) {
            urlState.clearPage()
        }
    },

        resetToFirstPageWithoutHistory() {
        this.currentPage = 1
        this.updateActivePage()
        this.updateButtonStates()
        
        // Just update UI without touching URL
        document.dispatchEvent(new CustomEvent('pageChanged', {
            detail: { page: this.currentPage }
        }))
    }
}