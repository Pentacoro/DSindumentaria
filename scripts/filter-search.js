const filterSearch = {
    init() {
        this.activeFilters = {
            types: [],
            tags: [],
            sizes: [],
            colors: [],
            priceRange: { min: null, max: null },
            searchTerm: ''
        }
        
        this.clearButton = document.getElementById('Clear')
        this.clearButton.style.display = 'none'
        
        this.setupFilterModal()
        this.setupSearch()
        this.setupClearFilters()
    },
    
    setupFilterModal() {
        const filterButton = document.getElementById('Filter')
        filterButton.addEventListener('click', () => {
            this.populateFilterModal()
        })
        
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFiltersFromModal()
        })
        
        document.getElementById('closeFilterModal').addEventListener('click', () => {
            overlayManager.closeFilterModal()
        })
    },
    
    setupSearch() {
        const searchInput = document.getElementById('Bar')
        const searchButton = document.getElementById('Search')
        
        searchButton.addEventListener('click', () => {
            this.performSearch(searchInput.value)
        })
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value)
            }
        })
    },
    
    setupClearFilters() {
        this.clearButton.addEventListener('click', () => {
            this.clearFilters()
        })
    },
    
    populateDropdown(selectId, options) {
        const select = document.getElementById(selectId)
        if (!select) return
        
        // Clear existing options except first
        while (select.children.length > 1) {
            select.removeChild(select.lastChild)
        }
        
        options.forEach(option => {
            const optionElement = document.createElement('option')
            optionElement.value = option
            optionElement.textContent = option
            select.appendChild(optionElement)
        })
    },
    
    async populateFilterModal() {
        try {
            const letInventory = await inventory.loadInventory()
            const products = Object.values(letInventory)
            
            this.populateDropdown('filterType', [...new Set(products.map(p => p.type))])
            this.populateDropdown('filterTag', [...new Set(products.flatMap(p => p.tags))])
            this.populateDropdown('filterSize', [...new Set(products.flatMap(p => p.sizes))])
            this.populateDropdown('filterColor', [...new Set(products.flatMap(p => p.colors.map(c => c.name)))])
            
            this.setupPriceSlider(products)
            this.setCurrentFilterValues() // Set current filter values in modal
            
        } catch (error) {
            console.error('Error populating filter modal:', error)
        }
    },
    
    setCurrentFilterValues() {
        // Set dropdown values to current active filters
        if (this.activeFilters.types.length > 0) {
            document.getElementById('filterType').value = this.activeFilters.types[0]
        } else {
            document.getElementById('filterType').value = ''
        }
        
        if (this.activeFilters.tags.length > 0) {
            document.getElementById('filterTag').value = this.activeFilters.tags[0]
        } else {
            document.getElementById('filterTag').value = ''
        }
        
        if (this.activeFilters.sizes.length > 0) {
            document.getElementById('filterSize').value = this.activeFilters.sizes[0]
        } else {
            document.getElementById('filterSize').value = ''
        }
        
        if (this.activeFilters.colors.length > 0) {
            document.getElementById('filterColor').value = this.activeFilters.colors[0]
        } else {
            document.getElementById('filterColor').value = ''
        }
        
        // Set price inputs
        const minInput = document.getElementById('minPrice')
        const maxInput = document.getElementById('maxPrice')
        const minSlider = document.getElementById('minPriceSlider')
        const maxSlider = document.getElementById('maxPriceSlider')
        
        minInput.value = this.activeFilters.priceRange.min || ''
        maxInput.value = this.activeFilters.priceRange.max || ''
        
        if (minSlider && maxSlider) {
            minSlider.value = this.activeFilters.priceRange.min || minSlider.min
            maxSlider.value = this.activeFilters.priceRange.max || maxSlider.max
        }
    },
    
    setupPriceSlider(products) {
        const prices = products.map(p => p.price)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        
        const minSlider = document.getElementById('minPriceSlider')
        const maxSlider = document.getElementById('maxPriceSlider')
        const minInput = document.getElementById('minPrice')
        const maxInput = document.getElementById('maxPrice')
        const sliderRange = document.querySelector('.slider-range')
        
        minSlider.min = minPrice
        minSlider.max = maxPrice
        maxSlider.min = minPrice
        maxSlider.max = maxPrice
        
        // Use current filter values or defaults
        const currentMin = this.activeFilters.priceRange.min || minPrice
        const currentMax = this.activeFilters.priceRange.max || maxPrice
        
        minSlider.value = currentMin
        maxSlider.value = currentMax
        minInput.value = this.activeFilters.priceRange.min || ''
        maxInput.value = this.activeFilters.priceRange.max || ''
        
        this.updateSliderRange(minSlider, maxSlider, sliderRange, minPrice, maxPrice)
        
        minSlider.addEventListener('input', () => {
            if (parseInt(minSlider.value) > parseInt(maxSlider.value)) {
                minSlider.value = maxSlider.value
            }
            minInput.value = minSlider.value
            this.updateSliderRange(minSlider, maxSlider, sliderRange, minPrice, maxPrice)
        })
        
        maxSlider.addEventListener('input', () => {
            if (parseInt(maxSlider.value) < parseInt(minSlider.value)) {
                maxSlider.value = minSlider.value
            }
            maxInput.value = maxSlider.value
            this.updateSliderRange(minSlider, maxSlider, sliderRange, minPrice, maxPrice)
        })
        
        minInput.addEventListener('input', () => {
            minSlider.value = minInput.value || minPrice
            this.updateSliderRange(minSlider, maxSlider, sliderRange, minPrice, maxPrice)
        })
        
        maxInput.addEventListener('input', () => {
            maxSlider.value = maxInput.value || maxPrice
            this.updateSliderRange(minSlider, maxSlider, sliderRange, minPrice, maxPrice)
        })
    },

    updateSliderRange(minSlider, maxSlider, sliderRange, minPrice, maxPrice) {
        const minVal = parseInt(minSlider.value)
        const maxVal = parseInt(maxSlider.value)
        const percent1 = ((minVal - minPrice) / (maxPrice - minPrice)) * 100
        const percent2 = ((maxVal - minPrice) / (maxPrice - minPrice)) * 100
        sliderRange.style.left = `${percent1}%`
        sliderRange.style.width = `${percent2 - percent1}%`
    },
    
    applyFiltersFromModal() {
        const typeFilter = document.getElementById('filterType').value
        const tagFilter = document.getElementById('filterTag').value
        const sizeFilter = document.getElementById('filterSize').value
        const colorFilter = document.getElementById('filterColor').value
        const minPrice = document.getElementById('minPrice').value
        const maxPrice = document.getElementById('maxPrice').value
        
        // Update active filters (replace, not add)
        this.activeFilters.types = typeFilter ? [typeFilter] : []
        this.activeFilters.tags = tagFilter ? [tagFilter] : []
        this.activeFilters.sizes = sizeFilter ? [sizeFilter] : []
        this.activeFilters.colors = colorFilter ? [colorFilter] : []
        
        this.activeFilters.priceRange = {
            min: minPrice ? parseInt(minPrice) : null,
            max: maxPrice ? parseInt(maxPrice) : null
        }
        
        this.applyFilters()
        overlayManager.closeFilterModal()
    },
    
    async performSearch(searchTerm) {
        this.activeFilters.searchTerm = searchTerm.trim()
        
        try {
            const inventoryData = await inventory.loadInventory()
            let filteredProducts = inventoryData
            
            // Apply search filter
            if (this.activeFilters.searchTerm) {
                filteredProducts = this.searchProducts(inventoryData, this.activeFilters.searchTerm)
            }
            
            // Apply other active filters to search results
            filteredProducts = this.filterProducts(filteredProducts)
            
            listDisplay.allProducts = Object.entries(filteredProducts)
            pagination.updatePagination(listDisplay.allProducts.length)
            listDisplay.displayCurrentPage()
            
            this.updateClearButtonVisibility()
            
        } catch (error) {
            console.error('Error performing search:', error)
        }
    },
    
    searchProducts(inventoryData, searchTerm) {
        const term = searchTerm.toLowerCase()
        return Object.fromEntries(
            Object.entries(inventoryData).filter(([id, product]) => {
                const searchableText = `
                    ${product.name} 
                    ${product.type} 
                    ${product.tags.join(' ')}
                `.toLowerCase()
                return searchableText.includes(term)
            })
        )
    },
    
    filterProducts(inventoryData) {
        return Object.fromEntries(
            Object.entries(inventoryData).filter(([id, product]) => {
                // Type filter
                if (this.activeFilters.types.length > 0 && !this.activeFilters.types.includes(product.type)) {
                    return false
                }
                
                // Tag filter
                if (this.activeFilters.tags.length > 0 && !this.activeFilters.tags.some(tag => product.tags.includes(tag))) {
                    return false
                }
                
                // Size filter
                if (this.activeFilters.sizes.length > 0 && !this.activeFilters.sizes.some(size => product.sizes.includes(size))) {
                    return false
                }
                
                // Color filter
                if (this.activeFilters.colors.length > 0 && !this.activeFilters.colors.some(color => 
                    product.colors.some(c => c.name === color))) {
                    return false
                }
                
                // Price filter
                if (this.activeFilters.priceRange.min !== null && product.price < this.activeFilters.priceRange.min) {
                    return false
                }
                if (this.activeFilters.priceRange.max !== null && product.price > this.activeFilters.priceRange.max) {
                    return false
                }
                
                return true
            })
        )
    },
    
    async applyFilters() {
        try {
            const inventoryData = await inventory.loadInventory()
            let filteredProducts = inventoryData
            
            // Apply search if exists
            if (this.activeFilters.searchTerm) {
                filteredProducts = this.searchProducts(inventoryData, this.activeFilters.searchTerm)
            }
            
            // Apply other filters
            filteredProducts = this.filterProducts(filteredProducts)
            
            listDisplay.allProducts = Object.entries(filteredProducts)
            pagination.updatePagination(listDisplay.allProducts.length)
            listDisplay.displayCurrentPage()
            
            this.updateClearButtonVisibility()
            
        } catch (error) {
            console.error('Error applying filters:', error)
        }
    },
    
    updateClearButtonVisibility() {
        const hasActiveFilters = 
            this.activeFilters.types.length > 0 ||
            this.activeFilters.tags.length > 0 ||
            this.activeFilters.sizes.length > 0 ||
            this.activeFilters.colors.length > 0 ||
            this.activeFilters.priceRange.min !== null ||
            this.activeFilters.priceRange.max !== null ||
            this.activeFilters.searchTerm !== ''
        
        this.clearButton.style.display = hasActiveFilters ? 'block' : 'none'
    },
    
    clearFilters() {
        this.activeFilters = {
            types: [],
            tags: [],
            sizes: [],
            colors: [],
            priceRange: { min: null, max: null },
            searchTerm: ''
        }
        
        // Clear search input but keep it visible
        const searchInput = document.querySelector('.filter-system div input[type="text"]')
        searchInput.value = ''
        
        this.applyFilters()
    }
}