/**
 * Products page functionality for Order Management System
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Get DOM elements
    const productsContainer = document.getElementById('products-container');
    const loadingContainer = document.getElementById('loading-container');
    const noProductsMessage = document.getElementById('no-products-message');
    const errorMessage = document.getElementById('error-message');
    
    // Store products data globally in this script
    let productsData = [];

    // Set up logout button handler
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Fetch products from API
    fetchProducts();

    /**
     * Fetches products from the API
     */
    async function fetchProducts() {
        try {
            const response = await fetch('https://distribo-api.azurewebsites.net/v1/products', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('Products API response:', response);
            console.log('Products data:', data);

            // Hide loading spinner
            loadingContainer.classList.add('d-none');

            if (!response.ok) {
                throw new Error(data.message || `Error: ${response.status}`);
            }            if (data.data && data.data.length > 0) {
                // Store products data globally
                productsData = data.data;
                
                // Display products
                displayProducts(data.data);
                productsContainer.classList.remove('d-none');
            } else {
                // No products available
                noProductsMessage.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            errorMessage.textContent = `Failed to load products: ${error.message}`;
            errorMessage.classList.remove('d-none');
            loadingContainer.classList.add('d-none');
        }
    }

    /**
     * Displays products in the UI
     * @param {Array} products - Array of product objects
     */
    function displayProducts(products) {
        productsContainer.innerHTML = '';

        products.forEach(product => {
            const productCol = document.createElement('div');
            productCol.className = 'col-md-6 col-lg-4 col-xl-3 mb-4';
            
            // Create a product card HTML
            const productCard = createProductCard(product);
            productCol.innerHTML = productCard;
            
            productsContainer.appendChild(productCol);
            
            // Set up image navigation for this product
            setupImageNavigation(product.id, product.images);
            
            // Set up click handler to navigate to product detail page
            setupProductClickHandler(product.id);
        });
    }

    /**
     * Creates HTML for a product card
     * @param {Object} product - Product data object
     * @returns {string} HTML for the product card
     */
    function createProductCard(product) {
        // Format price to 2 decimal places
        const formattedPrice = parseFloat(product.price).toFixed(2);
        
        // Create stock display if stock information exists
        let stockDisplay = '';
        if (product.stock && product.stock.value) {
            // Determine unit display (for now we only support KG)
            const unitDisplay = 'KG';
            stockDisplay = `<div class="product-stock">In Stock: ${product.stock.value} ${unitDisplay}</div>`;
        }
        
        // Create image carousel dots if multiple images
        let imageDots = '';
        if (product.images && product.images.length > 0) {
            imageDots = '<div class="image-nav">';
            product.images.forEach((image, index) => {
                imageDots += `<div class="image-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`;
            });
            imageDots += '</div>';
        }
        
        // Create arrows for image navigation if multiple images
        let imageArrows = '';
        if (product.images && product.images.length > 1) {
            imageArrows = `
                <div class="image-arrow left-arrow" data-direction="prev"><i class="fas fa-chevron-left"></i></div>
                <div class="image-arrow right-arrow" data-direction="next"><i class="fas fa-chevron-right"></i></div>
            `;
        }
        
        // Get first image URL or use a placeholder
        const firstImageUrl = product.images && product.images.length > 0 && product.images[0].url
            ? product.images[0].url
            : 'https://via.placeholder.com/300x200?text=No+Image';
        
        return `
            <div class="card product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${firstImageUrl}" alt="${product.name}" class="product-image" data-current-index="0">
                    ${imageArrows}
                    ${imageDots}
                </div>
                <div class="card-body">
                    <h5 class="card-title text-light">${product.name}</h5>
                    <p class="product-description">${product.description}</p>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="product-price">$${formattedPrice}</div>
                        ${stockDisplay}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Sets up image navigation for a product
     * @param {string} productId - ID of the product
     * @param {Array} images - Array of image objects for the product
     */
    function setupImageNavigation(productId, images) {
        if (!images || images.length <= 1) return;
        
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        const productImage = productCard.querySelector('.product-image');
        const dots = productCard.querySelectorAll('.image-dot');
        const arrows = productCard.querySelectorAll('.image-arrow');
        
        // Set up dot click listeners
        dots.forEach(dot => {
            dot.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click when clicking on dot
                const index = parseInt(this.getAttribute('data-index'));
                changeImage(productId, index);
            });
        });
        
        // Set up arrow click listeners
        arrows.forEach(arrow => {
            arrow.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click when clicking on arrow
                const direction = this.getAttribute('data-direction');
                const currentIndex = parseInt(productImage.getAttribute('data-current-index'));
                let newIndex;
                
                if (direction === 'prev') {
                    newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
                } else {
                    newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
                }
                
                changeImage(productId, newIndex);
            });
        });
    }
    
    /**
     * Changes the displayed image for a product
     * @param {string} productId - ID of the product
     * @param {number} newIndex - Index of the new image to display
     */    function changeImage(productId, newIndex) {
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        const productImage = productCard.querySelector('.product-image');
        const dots = productCard.querySelectorAll('.image-dot');
        
        // Find the product in our global data
        const product = productsData.find(p => p.id === productId);
        
        if (!product || !product.images || newIndex >= product.images.length) return;
        
        // Update image source
        productImage.src = product.images[newIndex].url;
        productImage.setAttribute('data-current-index', newIndex);
        
        // Update active dot
        dots.forEach((dot, index) => {
            if (index === newIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    /**
     * Sets up click handler for product card to navigate to detail page
     * @param {string} productId - ID of the product
     */
    function setupProductClickHandler(productId) {
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        productCard.addEventListener('click', function() {
            window.location.href = `product-detail.html?id=${productId}`;
        });
    }
});
