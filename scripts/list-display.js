const listDisplay = {
    init() {
        this.shopList = document.querySelector('.shop-list')
        this.allProducts = []
    },
    
    async populateList() {
        try {
            const inventoryData = await inventory.loadInventory()
            this.allProducts = Object.entries(inventoryData)
            
            // Initialize pagination
            pagination.updatePagination(this.allProducts.length)
            this.displayCurrentPage()
            
        } catch (error) {
            this.showErrorMessage('Error loading products')
        }
    },
    
    displayCurrentPage() {
        const currentPageItems = pagination.getCurrentPageItems(this.allProducts)
        this.createProductArticles(currentPageItems)
        
        // Initialize carousels after creating articles
        carousel.initializeCarousels()
    },
    
    createProductArticles(productsArray) {
        this.shopList.innerHTML = ''
        
        productsArray.forEach(([productId, product]) => {
            const article = this.createProductArticle(productId, product)
            this.shopList.appendChild(article)
        })
    },
    
    createProductArticle(productId, productData) {
        const li = document.createElement('li')
        li.setAttribute('data-product-id', productId)
        
        const formattedPrice = `$${productData.price.toLocaleString('es-AR')}`
        
        // Check if ANY variant of this product is in cart
        const isInCart = cart.isProductInCart(productData.name)
        const hasOptions = productData.colors.length > 0 || productData.sizes.length > 0
        const cartBtnClass = isInCart ? 'in-cart' : 'add'
        
        li.innerHTML = `
            <div class="image-carousel">
                <div class="carousel-images">
                    ${productData.images.map(img => 
                        `<img src="${img}" alt="${productData.name}">`
                    ).join('')}
                </div>
                <button class="carousel-btn prev">‹</button>
                <button class="carousel-btn next">›</button>
                <div class="carousel-indicators">
                    ${productData.images.map((_, index) => 
                        `<button class="indicator ${index === 0 ? 'active' : ''}"></button>`
                    ).join('')}
                </div>
            </div>
            <section>
                <div class="text-container">
                    <h2>${productData.name}</h2>
                    <h4>${formattedPrice}</h4>
                </div>
                <button class="cart-btn ${cartBtnClass}" 
                        data-product-id="${productId}"
                        data-has-options="${hasOptions}"></button>
            </section>
        `
        
        return li
    },
    
    showErrorMessage(message) {
        this.shopList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--secondary-color-gray);">
                <p>${message}</p>
            </div>
        `
    },
    
    clearList() {
        this.shopList.innerHTML = ''
    }
}