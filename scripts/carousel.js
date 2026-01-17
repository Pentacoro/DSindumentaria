const carousel = {
    init() {
        this.carousels = new Map()
        this.setupEventDelegation()
    },
    
    setupEventDelegation() {
        // Only handle button clicks via delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('carousel-btn')) {
                this.handleCarouselButtonClick(e.target)
            } else if (e.target.classList.contains('indicator')) {
                this.handleIndicatorClick(e.target)
            }
        })
    },
    
    initializeCarousels() {
        const carouselElements = document.querySelectorAll('.image-carousel')
        
        carouselElements.forEach((carouselElement, index) => {
            const carouselId = `carousel-${index}`
            const carouselData = {
                id: carouselId,
                currentIndex: 0,
                totalSlides: carouselElement.querySelectorAll('.carousel-images img').length,
                isDragging: false,
                startX: 0,
                currentTranslate: 0,
                prevTranslate: 0,
                moveHandler: null,
                endHandler: null
            }
            
            this.carousels.set(carouselElement, carouselData)
            
            // Bind touch/mouse events directly to this carousel
            this.bindDragEvents(carouselElement)
            
            this.updateCarousel(carouselElement)
        })
    },
    
    bindDragEvents(carouselElement) {
        const carouselData = this.carousels.get(carouselElement)
        if (!carouselData) return
        
        // Create bound handlers for this specific carousel
        const startHandler = (e) => this.handleDragStart(e, carouselElement)
        carouselData.startHandler = startHandler
        
        // Add event listeners directly to the carousel element
        carouselElement.addEventListener('touchstart', startHandler, { passive: false })
        carouselElement.addEventListener('mousedown', startHandler)
    },
    
    handleCarouselButtonClick(button) {
        const carouselElement = button.closest('.image-carousel')
        const carouselData = this.carousels.get(carouselElement)
        
        if (!carouselData) return
        
        if (button.classList.contains('prev')) {
            carouselData.currentIndex = carouselData.currentIndex > 0 
                ? carouselData.currentIndex - 1 
                : carouselData.totalSlides - 1
        } else if (button.classList.contains('next')) {
            carouselData.currentIndex = carouselData.currentIndex < carouselData.totalSlides - 1 
                ? carouselData.currentIndex + 1 
                : 0
        }
        
        this.updateCarousel(carouselElement)
    },
    
    handleIndicatorClick(indicator) {
        const carouselElement = indicator.closest('.image-carousel')
        const carouselData = this.carousels.get(carouselElement)
        const indicators = carouselElement.querySelectorAll('.indicator')
        const index = Array.from(indicators).indexOf(indicator)
        
        if (carouselData && index !== -1) {
            carouselData.currentIndex = index
            this.updateCarousel(carouselElement)
        }
    },
    
    updateCarousel(carouselElement) {
        const carouselData = this.carousels.get(carouselElement)
        if (!carouselData) return
        
        const imagesContainer = carouselElement.querySelector('.carousel-images')
        const indicators = carouselElement.querySelectorAll('.indicator')
        
        // Update slide position
        imagesContainer.style.transform = `translateX(-${carouselData.currentIndex * 100}%)`
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === carouselData.currentIndex)
        })
        
        // Update carousel data
        carouselData.currentTranslate = -carouselData.currentIndex * 100
        carouselData.prevTranslate = carouselData.currentTranslate
    },
    
    handleDragStart(e, carouselElement) {
        e.stopPropagation()
        
        const carouselData = this.carousels.get(carouselElement)
        if (!carouselData || carouselData.totalSlides <= 1) return
        
        // Store starting position to detect scroll direction
        carouselData.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
        carouselData.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
        carouselData.isDragging = false
        carouselData.prevTranslate = carouselData.currentTranslate
        
        // Don't preventDefault here - allows initial touch
        
        // Create move handler that checks direction
        const moveHandler = (e) => {
            if (!carouselData.isDragging) {
                // Check direction on first move
                const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
                const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
                const diffX = Math.abs(currentX - carouselData.startX)
                const diffY = Math.abs(currentY - carouselData.startY)
                
                // If vertical scroll, don't prevent default
                if (diffY > diffX) {
                    // Vertical - remove listeners and allow scroll
                    document.removeEventListener('touchmove', moveHandler)
                    document.removeEventListener('mousemove', moveHandler)
                    return
                }
                
                // Horizontal - now we can prevent default
                e.preventDefault()
                carouselData.isDragging = true
                
                const imagesContainer = carouselElement.querySelector('.carousel-images')
                imagesContainer.style.transition = 'none'
            }
            
            // Rest of drag logic...
            if (carouselData.isDragging) {
                e.preventDefault()
                const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
                const diffX = currentX - carouselData.startX
                carouselData.currentTranslate = carouselData.prevTranslate + (diffX / carouselElement.offsetWidth) * 100
                
                const imagesContainer = carouselElement.querySelector('.carousel-images')
                imagesContainer.style.transform = `translateX(${carouselData.currentTranslate}%)`
            }
        }
        
        const endHandler = () => {
            // Clean up logic...
            document.removeEventListener('touchmove', moveHandler)
            document.removeEventListener('mousemove', moveHandler)
            document.removeEventListener('touchend', endHandler)
            document.removeEventListener('mouseup', endHandler)
            
            if (carouselData.isDragging) {
                // Finish drag logic...
                carouselData.isDragging = false
                const imagesContainer = carouselElement.querySelector('.carousel-images')
                imagesContainer.style.transition = 'transform 0.3s ease'
                
                const movedBy = carouselData.currentTranslate - carouselData.prevTranslate
                if (Math.abs(movedBy) > 20) {
                    if (movedBy > 0 && carouselData.currentIndex > 0) {
                        carouselData.currentIndex--
                    } else if (movedBy < 0 && carouselData.currentIndex < carouselData.totalSlides - 1) {
                        carouselData.currentIndex++
                    }
                }
                this.updateCarousel(carouselElement)
            }
        }
        
        // Store handlers
        carouselData.moveHandler = moveHandler
        carouselData.endHandler = endHandler
        
        // Add listeners
        document.addEventListener('touchmove', moveHandler, { passive: false })
        document.addEventListener('touchend', endHandler)
        document.addEventListener('mouseup', endHandler)
        
        if (e.type === 'mousedown') {
            document.addEventListener('mousemove', moveHandler)
        }
    },
    
    handleDragMove(e) {
        if (!this.activeCarousel || !this.activeCarouselData) return
        
        const carouselElement = this.activeCarousel
        const carouselData = this.activeCarouselData
        
        e.preventDefault()
        const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
        const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
        
        const diffX = currentX - carouselData.startX
        const diffY = currentY - carouselData.startY
        
        // If we haven't determined direction yet
        if (!carouselData.isDragging) {
            // Check if it's primarily vertical (allow scroll)
            if (Math.abs(diffY) > Math.abs(diffX)) {
                // Vertical movement - cancel drag and allow scroll
                this.cancelDrag()
                return
            }
            
            // Horizontal movement - start carousel drag
            carouselData.isDragging = true
            
            // Now we can set transition to none since we're dragging horizontally
            const imagesContainer = carouselElement.querySelector('.carousel-images')
            imagesContainer.style.transition = 'none'
        }
        
        // Only process if we're confirmed to be dragging horizontally
        if (carouselData.isDragging) {
            carouselData.currentTranslate = carouselData.prevTranslate + (diffX / carouselElement.offsetWidth) * 100
            
            const imagesContainer = carouselElement.querySelector('.carousel-images')
            imagesContainer.style.transform = `translateX(${carouselData.currentTranslate}%)`
        }
    },
    
    handleDragEnd() {
        if (!this.activeCarousel || !this.activeCarouselData) return
        
        const carouselElement = this.activeCarousel
        const carouselData = this.activeCarouselData
        
        if (!carouselData.isDragging) {
            // Wasn't dragging, just cleanup
            this.cancelDrag()
            return
        }
        
        carouselData.isDragging = false
        
        const imagesContainer = carouselElement.querySelector('.carousel-images')
        imagesContainer.style.transition = 'transform 0.3s ease'
        
        const movedBy = carouselData.currentTranslate - carouselData.prevTranslate
        const threshold = 20
        
        if (Math.abs(movedBy) > threshold) {
            if (movedBy > 0 && carouselData.currentIndex > 0) {
                carouselData.currentIndex--
            } else if (movedBy < 0 && carouselData.currentIndex < carouselData.totalSlides - 1) {
                carouselData.currentIndex++
            }
        }
        
        this.updateCarousel(carouselElement)
        this.cleanupDragEvents()
        
        this.activeCarousel = null
        this.activeCarouselData = null
    },
    
    cancelDrag() {
        if (!this.activeCarousel || !this.activeCarouselData) return
        
        const carouselData = this.activeCarouselData
        
        carouselData.isDragging = false
        this.cleanupDragEvents()
        
        this.activeCarousel = null
        this.activeCarouselData = null
    },
    
    cleanupDragEvents(carouselElement) {
        const carouselData = this.carousels.get(carouselElement)
        if (!carouselData) return
        
        // Remove the specific handlers we added during drag
        if (carouselData.moveHandler) {
            carouselElement.removeEventListener('touchmove', carouselData.moveHandler)
            carouselElement.removeEventListener('mousemove', carouselData.moveHandler)
        }
        
        if (carouselData.endHandler) {
            carouselElement.removeEventListener('touchend', carouselData.endHandler)
            carouselElement.removeEventListener('mouseup', carouselData.endHandler)
            carouselElement.removeEventListener('mouseleave', carouselData.endHandler)
        }
        
        // Clear handler references
        carouselData.moveHandler = null
        carouselData.endHandler = null
    },
    
    refreshCarousels() {
        // Clean up all existing carousel events
        this.carousels.forEach((carouselData, carouselElement) => {
            if (carouselData.startHandler) {
                carouselElement.removeEventListener('touchstart', carouselData.startHandler)
                carouselElement.removeEventListener('mousedown', carouselData.startHandler)
            }
            this.cleanupDragEvents(carouselElement)
        })
        
        // Reinitialize
        this.carousels.clear()
        this.initializeCarousels()
    }
}