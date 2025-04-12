/**
 * Product detail page functionality for Order Management System
 */

// Global variables for the map functionality
let map;
let marker;
let selectedLatitude = null;
let selectedLongitude = null;
let locationModal;
let currentProduct = null;
let companyLocations = [];
let customLocationSelected = false;

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Bootstrap modal
    locationModal = new bootstrap.Modal(document.getElementById('locationModal'));

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
    const orderForm = document.getElementById('order-form');
    const orderFormContainer = document.getElementById('order-form-container');
    const orderDisabledMessage = document.getElementById('order-disabled-message');
    const orderQuantityInput = document.getElementById('order-quantity');
    const deliveryDateInput = document.getElementById('delivery-date');
    const deliveryLocationSelect = document.getElementById('delivery-location');
    const customLocationBtn = document.getElementById('custom-location-btn');
    const useLocationBtn = document.getElementById('use-location-btn');

    // Set up logout button handler
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Check user role and show admin options if user is an administrator
    checkUserRoleAndCompany();
    
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

    // Set up custom location button handler
    customLocationBtn.addEventListener('click', function() {
        locationModal.show();
    });

    // Set up use location button handler
    useLocationBtn.addEventListener('click', function() {
        if (selectedLatitude && selectedLongitude) {
            customLocationSelected = true;
            locationModal.hide();
            
            // Update the location select to show custom location is selected
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.textContent = `Custom Location (${selectedLatitude.toFixed(4)}, ${selectedLongitude.toFixed(4)})`;
            customOption.selected = true;
            
            // Remove previous custom option if exists
            const existingCustomOption = Array.from(deliveryLocationSelect.options).find(opt => opt.value === 'custom');
            if (existingCustomOption) {
                deliveryLocationSelect.removeChild(existingCustomOption);
            }
            
            deliveryLocationSelect.appendChild(customOption);
        }
    });

    // Set up order form submit handler
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitOrder(productId);
    });

    // Set up validation for quantity input
    orderQuantityInput.addEventListener('input', function() {
        validateQuantity();
    });

    // Set up validation for date input
    deliveryDateInput.addEventListener('change', function() {
        validateDate();
    });

    // Fetch product details
    fetchProductDetails(productId);

    // Set min date for delivery date picker (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    deliveryDateInput.min = formatDate(tomorrow);
});

// Google Maps initialization callback
function initMap() {
    // Default coordinates (center of the world)
    const defaultLocation = { lat: 0, lng: 0 };
    
    // Create a new map centered at the default location
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        center: defaultLocation,
        mapTypeId: 'roadmap',
        styles: [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#38414e' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#212a37' }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca5b3' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#17263c' }]
            }
        ]
    });
    
    // Add click listener to the map
    map.addListener('click', function(event) {
        placeMarker(event.latLng);
    });
}

// Function to place a marker on the map
function placeMarker(location) {
    // Remove existing marker if any
    if (marker) {
        marker.setMap(null);
    }
    
    // Create a new marker
    marker = new google.maps.Marker({
        position: location,
        map: map,
        animation: google.maps.Animation.DROP
    });
    
    // Update the coordinates in the form
    selectedLatitude = location.lat();
    selectedLongitude = location.lng();
    document.getElementById('latitude').value = selectedLatitude;
    document.getElementById('longitude').value = selectedLongitude;
    
    // Center the map on the selected location
    map.setCenter(location);
}

/**
 * Fetches product details from the API
 * @param {string} productId - The ID of the product to fetch
 */
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`https://distribo-api.azurewebsites.net/v1/products/${productId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Product details API response:', response);
        console.log('Product details data:', data);

        // Hide loading spinner
        document.getElementById('loading-container').classList.add('d-none');

        if (!response.ok) {
            throw new Error(data.message || `Error: ${response.status}`);
        }
        
        if (data.data) {
            // Store current product data
            currentProduct = data.data;
            
            // Display product details
            displayProductDetails(data.data);
            document.getElementById('product-details').classList.remove('d-none');
            
            // Update available stock display
            if (currentProduct.stock && currentProduct.stock.value) {
                document.getElementById('stock-available').textContent = `Available: ${currentProduct.stock.value} KG`;
            }
        } else {
            throw new Error('Product data not found');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        document.getElementById('error-message').textContent = `Failed to load product details: ${error.message}`;
        document.getElementById('error-message').classList.remove('d-none');
        document.getElementById('loading-container').classList.add('d-none');
    }
}

/**
 * Displays product details in the UI
 * @param {Object} product - The product data object
 */
function displayProductDetails(product) {
    // Set product title
    document.title = `${product.name} - Order Management System`;
    document.getElementById('product-title').textContent = product.name;
    
    // Set product price
    document.getElementById('product-price').textContent = `$${parseFloat(product.price).toFixed(2)}`;
    
    // Set product description
    document.getElementById('product-description').textContent = product.description;
    
    // Set stock information
    if (product.stock && product.stock.value) {
        const unitDisplay = 'KG'; // Currently only supporting KG as the unit
        document.getElementById('stock-text').textContent = `In Stock: ${product.stock.value} ${unitDisplay}`;
    } else {
        document.getElementById('stock-info').classList.add('d-none');
    }
    
    // Set up images
    setupProductImages(product.images);
}

/**
 * Checks the current user's role and shows admin options if the user is an administrator
 * Also checks if user can create orders and fetches company locations if applicable
 */
async function checkUserRoleAndCompany() {
    try {
        const token = localStorage.getItem('token');
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
        
        // Check user role
        const userRole = data.data.role && data.data.role.name ? data.data.role.name : 'User';
        
        if (userRole === 'Admin') {
            // Show admin options for Admin users
            document.getElementById('adminOptions').classList.remove('d-none');
            
            // Show disabled message for order creation
            document.getElementById('order-disabled-message').classList.remove('d-none');
        } else if (userRole === 'RootUser') {
            // For RootUser, check if they have a company to enable order creation
            checkCompanyAndFetchLocations(userRole);
        } else if (userRole === 'User') {
            // For regular Users, always enable order creation and fetch locations
            document.getElementById('order-form-container').classList.remove('d-none');
            fetchCompanyLocations();
        } else {
            // For other roles, show disabled message
            document.getElementById('order-disabled-message').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error checking user role:', error);
        // Show disabled message as fallback
        document.getElementById('order-disabled-message').classList.remove('d-none');
    }
}

/**
 * Checks if RootUser has a company and fetches locations if they do
 * @param {string} userRole - The user's role
 */
async function checkCompanyAndFetchLocations(userRole) {
    if (userRole !== 'RootUser') return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://distribo-api.azurewebsites.net/v1/companies/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 404) {
            // No company found for RootUser
            document.getElementById('order-disabled-message').textContent = 'You need to create a company before you can place orders.';
            document.getElementById('order-disabled-message').classList.remove('d-none');
        } else if (response.ok) {
            // Company found, enable order creation
            document.getElementById('order-form-container').classList.remove('d-none');
            
            // Parse company data and populate locations
            const data = await response.json();
            if (data.data && data.data.locations) {
                populateLocationDropdown(data.data.locations);
                companyLocations = data.data.locations;
            }
        } else {
            throw new Error('Failed to check company status');
        }
    } catch (error) {
        console.error('Error checking company:', error);
        document.getElementById('order-disabled-message').classList.remove('d-none');
    }
}

/**
 * Fetches company locations for a User role
 */
async function fetchCompanyLocations() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://distribo-api.azurewebsites.net/v1/companies/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.locations) {
                populateLocationDropdown(data.data.locations);
                companyLocations = data.data.locations;
            }
        } else {
            throw new Error('Failed to fetch company locations');
        }
    } catch (error) {
        console.error('Error fetching company locations:', error);
    }
}

/**
 * Populates the location dropdown with available company locations
 * @param {Array} locations - Array of location objects
 */
function populateLocationDropdown(locations) {
    const locationSelect = document.getElementById('delivery-location');
    locationSelect.innerHTML = '<option value="" selected disabled>Select a location</option>';
    
    if (locations && locations.length > 0) {
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.name;
            option.dataset.lat = location.latitude;
            option.dataset.lng = location.longitude;
            locationSelect.appendChild(option);
        });
    } else {
        // If no locations, encourage using custom location
        const noLocationsOption = document.createElement('option');
        noLocationsOption.value = "";
        noLocationsOption.disabled = true;
        noLocationsOption.textContent = "No saved locations available";
        locationSelect.appendChild(noLocationsOption);
    }
}

/**
 * Validates the quantity input
 * @returns {boolean} - Whether the quantity is valid
 */
function validateQuantity() {
    const quantityInput = document.getElementById('order-quantity');
    const quantityFeedback = document.getElementById('quantity-feedback');
    const quantity = parseInt(quantityInput.value);
    
    // Reset validation state
    quantityInput.classList.remove('is-invalid');
    quantityFeedback.textContent = '';
    
    // Check if quantity is empty
    if (!quantityInput.value) {
        return false;
    }
    
    // Check if quantity is a positive number
    if (isNaN(quantity) || quantity <= 0) {
        quantityInput.classList.add('is-invalid');
        quantityFeedback.textContent = 'Please enter a positive quantity';
        return false;
    }
    
    // Check if quantity exceeds available stock
    if (currentProduct && currentProduct.stock && quantity > currentProduct.stock.value) {
        quantityInput.classList.add('is-invalid');
        quantityFeedback.textContent = `Quantity cannot exceed available stock (${currentProduct.stock.value} KG)`;
        return false;
    }
    
    return true;
}

/**
 * Validates the delivery date input
 * @returns {boolean} - Whether the date is valid
 */
function validateDate() {
    const dateInput = document.getElementById('delivery-date');
    const dateFeedback = document.getElementById('date-feedback');
    
    // Reset validation state
    dateInput.classList.remove('is-invalid');
    dateFeedback.textContent = '';
    
    // Check if date is empty
    if (!dateInput.value) {
        return false;
    }
    
    // Parse date
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Check if date is in the past
    if (selectedDate <= today) {
        dateInput.classList.add('is-invalid');
        dateFeedback.textContent = 'Delivery date must be in the future';
        return false;
    }
    
    return true;
}

/**
 * Formats a date object into YYYY-MM-DD format for date inputs
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Generate a random string for custom location names
 * @returns {string} - Random string
 */
function generateRandomLocationName() {
    return 'Custom_' + Math.random().toString(36).substring(2, 10);
}

/**
 * Submits an order to the API
 * @param {string} productId - The ID of the product to order
 */
async function submitOrder(productId) {
    // Validate inputs
    if (!validateQuantity() || !validateDate()) {
        return;
    }
    
    const locationSelect = document.getElementById('delivery-location');
    if (!locationSelect.value && !customLocationSelected) {
        locationSelect.classList.add('is-invalid');
        return;
    }
    
    // Get form values
    const quantity = parseInt(document.getElementById('order-quantity').value);
    const deliveryDate = document.getElementById('delivery-date').value;
    
    // Create order object
    const orderData = {
        deliveryDate: deliveryDate,
        items: [
            {
                productId: productId,
                quantity: quantity
            }
        ]
    };
    
    // Set delivery location
    if (customLocationSelected) {
        // Use custom location from map
        orderData.deliveryLocation = {
            latitude: selectedLatitude,
            longitude: selectedLongitude,
            name: generateRandomLocationName()
        };
    } else {
        // Use selected company location
        const selectedOption = locationSelect.options[locationSelect.selectedIndex];
        const locationId = selectedOption.value;
        const location = companyLocations.find(loc => loc.id === locationId);
        
        if (location) {
            orderData.deliveryLocation = {
                latitude: location.latitude,
                longitude: location.longitude,
                name: location.name
            };
        } else {
            showOrderAlert('Error: Selected location not found', 'danger');
            return;
        }
    }
    
    // Show loading state
    const createOrderBtn = document.getElementById('create-order-btn');
    const originalButtonText = createOrderBtn.innerHTML;
    createOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating order...';
    createOrderBtn.disabled = true;
    
    // Clear previous alert
    const orderAlert = document.getElementById('order-alert');
    orderAlert.classList.add('d-none');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://distribo-api.azurewebsites.net/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        console.log('Create order API response:', response);
        console.log('Create order API response data:', data);
        
        if (response.ok) {
            // Order created successfully
            showOrderAlert('Order created successfully! Your order has been submitted.', 'success');
            
            // Reset form
            document.getElementById('order-form').reset();
            customLocationSelected = false;
        } else if (response.status === 400) {
            // Check for stock mismatch
            if (data.code === 'StockMismatch') {
                showOrderAlert('Not enough items in stock to fulfill this order. Please try a smaller quantity or check back later.', 'danger');
            } else {
                showOrderAlert(data.message || 'Invalid order details. Please check your input and try again.', 'danger');
            }
        } else {
            // Server error
            showOrderAlert('An error occurred while creating your order. Please try again later.', 'danger');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        showOrderAlert('Failed to create order. Please check your connection and try again.', 'danger');
    } finally {
        // Reset button state
        createOrderBtn.innerHTML = originalButtonText;
        createOrderBtn.disabled = false;
    }
}

/**
 * Displays an alert message for order operations
 * @param {string} message - The message to display
 * @param {string} type - Alert type (success, danger, etc.)
 */
function showOrderAlert(message, type) {
    const alertElement = document.getElementById('order-alert');
    alertElement.textContent = message;
    alertElement.className = `alert alert-${type} mb-3`;
    alertElement.classList.remove('d-none');
    
    // Scroll to the alert
    alertElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Deletes a product
 * @param {string} productId - The ID of the product to delete
 */
async function deleteProduct(productId) {
    try {
        // Show loading state
        document.getElementById('loading-container').classList.remove('d-none');
        document.getElementById('product-details').classList.add('d-none');
        
        // Clear previous error messages
        document.getElementById('error-message').classList.add('d-none');
        
        const response = await fetch(`https://distribo-api.azurewebsites.net/v1/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        document.getElementById('error-message').textContent = `Failed to delete product: ${error.message}`;
        document.getElementById('error-message').classList.remove('d-none');
        document.getElementById('loading-container').classList.add('d-none');
        document.getElementById('product-details').classList.remove('d-none');
    }
}

/**
 * Sets up product images in the UI
 * @param {Array} images - Array of image objects
 */
function setupProductImages(images) {
    if (!images || images.length === 0) {
        // If no images, use a placeholder
        document.getElementById('main-product-image').src = 'https://via.placeholder.com/600x400?text=No+Image+Available';
        document.getElementById('main-product-image').alt = 'No image available';
        return;
    }
    
    // Set main image to first image
    document.getElementById('main-product-image').src = images[0].url;
    document.getElementById('main-product-image').alt = 'Product Image';
    
    // Create thumbnails if there are multiple images
    const thumbnailContainer = document.getElementById('thumbnail-container');
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
                document.getElementById('main-product-image').src = image.url;
                
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
