const inventory = {
    items: {},
    
    async loadInventory() {
        try {
            const response = await fetch('./src/inventory.json')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            this.items = await response.json()
            return this.items
        } catch (error) {
            console.error('Error loading inventory:', error)
            throw error
        }
    },
    
    getAllProducts() {
        return this.items
    },
    
    getProductById(productId) {
        return this.items[productId]
    },
    
    getProductsByType(type) {
        return Object.values(this.items).filter(product => product.type === type)
    },
    
    searchProducts(searchTerm) {
        const term = searchTerm.toLowerCase()
        return Object.entries(this.items).filter(([id, product]) => {
            const searchableText = `
                ${product.name} 
                ${product.type} 
                ${product.tags.join(' ')}
            `.toLowerCase()
            return searchableText.includes(term)
        })
    }
}