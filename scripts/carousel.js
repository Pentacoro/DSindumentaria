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
        e.stopPropagation() // Prevent event from bubbling to other carousels
        e.preventDefault()
        
        const carouselData = this.carousels.get(carouselElement)
        if (!carouselData || carouselData.totalSlides <= 1) return
        
        carouselData.isDragging = true
        carouselData.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
        carouselData.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
        carouselData.prevTranslate = carouselData.currentTranslate
        
        const imagesContainer = carouselElement.querySelector('.carousel-images')
        imagesContainer.style.transition = 'none'
        
        // Create unique handlers for this drag session
        const moveHandler = (e) => this.handleDragMove(e, carouselElement)
        const endHandler = () => this.handleDragEnd(carouselElement)
        
        // Store handlers for cleanup
        carouselData.moveHandler = moveHandler
        carouselData.endHandler = endHandler
        
        // Add event listeners to the specific carousel element
        carouselElement.addEventListener('touchmove', moveHandler, { passive: false })
        carouselElement.addEventListener('mousemove', moveHandler)
        carouselElement.addEventListener('touchend', endHandler)
        carouselElement.addEventListener('mouseup', endHandler)
        carouselElement.addEventListener('mouseleave', endHandler)
    },
    
    handleDragMove(e, carouselElement) {
        const carouselData = this.carousels.get(carouselElement)
        if (!carouselData || !carouselData.isDragging) return
        
        e.preventDefault()
        const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
        const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
        
        const diffX = currentX - carouselData.startX
        const diffY = currentY - carouselData.startY
        
        // Check if it's a vertical scroll (allow page scrolling)
        if (Math.abs(diffY) > Math.abs(diffX)) {
            this.cancelDrag(carouselElement)
            return
        }
        
        carouselData.currentTranslate = carouselData.prevTranslate + (diffX / carouselElement.offsetWidth) * 100
        
        const imagesContainer = carouselElement.querySelector('.carousel-images')
        imagesContainer.style.transform = `translateX(${carouselData.currentTranslate}%)`
    },
    
    handleDragEnd(carouselElement) {
        const carouselData = this.carousels.get(carouselElement)
        if (!carouselData || !carouselData.isDragging) return
        
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
        this.cleanupDragEvents(carouselElement)
    },
    
    cancelDrag(carouselElement) {
        const carouselData = this.carousels.get(carouselElement)
        if (!carouselData) return
        
        carouselData.isDragging = false
        
        const imagesContainer = carouselElement.querySelector('.carousel-images')
        imagesContainer.style.transition = 'transform 0.3s ease'
        this.updateCarousel(carouselElement)
        this.cleanupDragEvents(carouselElement)
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