/**
 * Product detail page functionality for Order Management System
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Get query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        // If no product ID provided, redirect to products page
        window.location.href = 'products.html';
        return;
    }

    // Get DOM elements
    const productDetails = document.getElementById('product-details');
    const loadingContainer = document.getElementById('loading-container');
    const errorMessage = document.getElementById('error-message');
    const mainProductImage = document.getElementById('main-product-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    const productTitle = document.getElementById('product-title');
    const productPrice = document.getElementById('product-price');
    const productDescription = document.getElementById('product-description');
    const stockText = document.getElementById('stock-text');
    const stockInfo = document.getElementById('stock-info');
    const adminOptions = document.getElementById('admin-options');
    const deleteProductBtn = document.getElementById('delete-product-btn');

    // Set up logout button handler
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Check user role and show admin options if user is an administrator
    checkUserRole();
    
    // Set up delete product button handler
    deleteProductBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            deleteProduct(productId);
        }
    });
    
    // Set up edit product button handler
    const editProductBtn = document.getElementById('edit-product-btn');
    editProductBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = `update-product.html?id=${productId}`;
    });

    // Fetch product details
    fetchProductDetails(productId);

    /**
     * Fetches product details from the API
     * @param {string} productId - The ID of the product to fetch
     */
    async function fetchProductDetails(productId) {
        try {
            const response = await fetch(`https://distribo-api.azurewebsites.net/v1/products/${productId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('Product details API response:', response);
            console.log('Product details data:', data);

            // Hide loading spinner
            loadingContainer.classList.add('d-none');

            if (!response.ok) {
                throw new Error(data.message || `Error: ${response.status}`);
            }            if (data.data) {
                // Display product details
                displayProductDetails(data.data);
                productDetails.classList.remove('d-none');
            } else {
                throw new Error('Product data not found');
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            errorMessage.textContent = `Failed to load product details: ${error.message}`;
            errorMessage.classList.remove('d-none');
            loadingContainer.classList.add('d-none');
        }
    }
    
    /**
     * Displays product details in the UI
     * @param {Object} product - The product data object
     */
    function displayProductDetails(product) {
        // Set product title
        document.title = `${product.name} - Order Management System`;
        productTitle.textContent = product.name;
        
        // Set product price
        productPrice.textContent = `$${parseFloat(product.price).toFixed(2)}`;
        
        // Set product description
        productDescription.textContent = product.description;
        
        // Set stock information
        if (product.stock && product.stock.value) {
            const unitDisplay = 'KG'; // Currently only supporting KG as the unit
            stockText.textContent = `In Stock: ${product.stock.value} ${unitDisplay}`;
        } else {
            stockInfo.classList.add('d-none');
        }
        
        // Set up images
        setupProductImages(product.images);
    }

    /**
     * Checks the current user's role and shows admin options if the user is an administrator
     */
    async function checkUserRole() {
        try {
            const response = await fetch('https://distribo-api.azurewebsites.net/v1/users/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('User profile API response:', response);
            console.log('User profile API response data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || `Error: ${response.status}`);
            }
            
            // Check if the user has the Admin role
            const userRole = data.data.role && data.data.role.name ? data.data.role.name : 'User';
            
            if (userRole === 'Admin') {
                // Show admin options if user is an administrator
                adminOptions.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error checking user role:', error);
            // Don't show error to user, just don't display admin options
        }
    }
    
    /**
     * Deletes a product
     * @param {string} productId - The ID of the product to delete
     */
    async function deleteProduct(productId) {
        try {
            // Show loading state
            loadingContainer.classList.remove('d-none');
            productDetails.classList.add('d-none');
            
            // Clear previous error messages
            errorMessage.classList.add('d-none');
            
            const response = await fetch(`https://distribo-api.azurewebsites.net/v1/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Try to parse response as JSON
            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = { message: null };
            }
            
            console.log('Delete product API response:', response);
            console.log('Delete product API response data:', data);
            
            if (response.status === 200) {
                // Product deleted successfully, redirect to products page with success message
                alert('Product deleted successfully');
                window.location.href = 'products.html';
            } else if (response.status === 404) {
                // Product not found
                const message = data.message || 'Product not found. It may have been deleted already.';
                alert(message);
                window.location.href = 'products.html';
            } else {
                // Other error
                throw new Error(data.message || `Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            errorMessage.textContent = `Failed to delete product: ${error.message}`;
            errorMessage.classList.remove('d-none');
            loadingContainer.classList.add('d-none');
            productDetails.classList.remove('d-none');
        }
    }
    
    /**
     * Sets up product images in the UI
     * @param {Array} images - Array of image objects
     */
    function setupProductImages(images) {
        if (!images || images.length === 0) {
            // If no images, use a placeholder
            mainProductImage.src = 'https://via.placeholder.com/600x400?text=No+Image+Available';
            mainProductImage.alt = 'No image available';
            return;
        }
        
        // Set main image to first image
        mainProductImage.src = images[0].url;
        mainProductImage.alt = 'Product Image';
        
        // Create thumbnails if there are multiple images
        if (images.length > 1) {
            thumbnailContainer.innerHTML = '';
            
            images.forEach((image, index) => {
                const thumbnail = document.createElement('img');
                thumbnail.src = image.url;
                thumbnail.alt = `Product thumbnail ${index + 1}`;
                thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
                thumbnail.setAttribute('data-index', index);
                
                thumbnail.addEventListener('click', function() {
                    // Update main image
                    mainProductImage.src = image.url;
                    
                    // Update active state
                    document.querySelectorAll('.thumbnail').forEach(thumb => {
                        thumb.classList.remove('active');
                    });
                    this.classList.add('active');
                });
                
                thumbnailContainer.appendChild(thumbnail);
            });
        }
    }
});
