async function initApp() {
    try {
        // Initialize modules
        listDisplay.init()
        carousel.init()
        pagination.init()
        overlayManager.init()
        uiEvents.init()
        filterSearch.init()
        articlePage.init()
        cart.init()
        urlState.init()
        cartCrypto.init() 
        
        // Populate product list
        await listDisplay.populateList()
        
        // Listen for page changes
        document.addEventListener('pageChanged', (e) => {
            listDisplay.displayCurrentPage()
        })
        
        console.log('App initialized successfully')
    } catch (error) {
        console.error('Failed to initialize app:', error)
    }
}

initApp()