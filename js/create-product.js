/**
 * Product creation functionality for Order Management System
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and has Admin role
    checkUserAuthorization();
    
    const createProductForm = document.getElementById('create-product-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const productName = document.getElementById('productName');
    const productDescription = document.getElementById('productDescription');
    const productImages = document.getElementById('productImages');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imageError = document.getElementById('imageError');
    const nameCharCounter = document.getElementById('nameCharCounter');
    const descCharCounter = document.getElementById('descCharCounter');
    
    // Side Navbar Elements
    const sideNavbar = document.querySelector('.side-navbar');
    const navbarToggle = document.getElementById('navbar-toggle');
    const toggleIcon = document.getElementById('toggle-icon');
    const contentContainer = document.querySelector('.content-container');
    
    // Setup Navbar Toggle
    navbarToggle.addEventListener('click', function() {
        sideNavbar.classList.toggle('expanded');
        
        if (sideNavbar.classList.contains('expanded')) {
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-left');
            contentContainer.classList.remove('nav-collapsed');
            contentContainer.classList.add('nav-expanded');
        } else {
            toggleIcon.classList.remove('fa-chevron-left');
            toggleIcon.classList.add('fa-chevron-right');
            contentContainer.classList.remove('nav-expanded');
            contentContainer.classList.add('nav-collapsed');
        }
    });
    
    // Set up logout button handler
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
    
    // Character count for name field
    productName.addEventListener('input', function() {
        const currentLength = this.value.length;
        nameCharCounter.textContent = `${currentLength}/100`;
    });
    
    // Character count for description field
    productDescription.addEventListener('input', function() {
        const currentLength = this.value.length;
        descCharCounter.textContent = `${currentLength}/500`;
    });
    
    // Image preview and validation
    productImages.addEventListener('change', function() {
        // Clear previous previews and errors
        imagePreviewContainer.innerHTML = '';
        imageError.classList.add('d-none');
        imageError.textContent = '';
        
        const files = this.files;
        
        // Validate number of files
        if (files.length > 4) {
            showImageError('Maximum 4 images allowed');
            this.value = ''; // Clear the file input
            return;
        }
        
        // Validate each file
        let hasError = false;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                showImageError(`${file.name} exceeds the 10MB size limit`);
                hasError = true;
                break;
            }
            
            // Check file type
            if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                showImageError(`${file.name} is not an accepted image format (JPEG, JPG, PNG only)`);
                hasError = true;
                break;
            }
            
            // Create preview
            createImagePreview(file);
        }
        
        if (hasError) {
            this.value = ''; // Clear the file input
            imagePreviewContainer.innerHTML = '';
        }
    });
      createProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Show loading state
            const submitBtn = createProductForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
            
            // Clear previous messages
            errorMessage.classList.add('d-none');
            successMessage.classList.add('d-none');
            
            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                showError('Authentication token not found. Please log in again.');
                resetButton(submitBtn, originalBtnText);
                return;
            }
            
            // Check if there are images in the preview container
            const hasImagePreviews = imagePreviewContainer.children.length > 0;
            
            // Validate form data
            if (!validateForm(hasImagePreviews)) {
                resetButton(submitBtn, originalBtnText);
                return;
            }
            
            // Create FormData object for multipart/form-data request
            const formData = new FormData(createProductForm);
            
            // Make API request
            console.log('Submitting create product request...');
            const response = await fetch('https://distribo-api.azurewebsites.net/v1/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // No Content-Type header for multipart/form-data
                },
                body: formData
            });
            
            // Get response data
            let data;
            try {
                data = await response.json();
            } catch (error) {
                // If response is not JSON, create a default data object
                data = { message: 'An unexpected error occurred' };
            }
            
            console.log('Create product API response:', response);
            console.log('Create product API response data:', data);
            
            // Reset button state
            resetButton(submitBtn, originalBtnText);
            
            if (response.status === 200) {
                // Success - product created
                showSuccess('Product created successfully!');
                
                // Redirect to profile page after showing the success message
                console.log('Redirecting to profile page...');
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
                return; // Make sure we exit the function here
            } else {
                // Handle different error cases based on status codes
                handleErrorResponse(response.status, data);
            }
        } catch (error) {
            console.error('Error creating product:', error);
            showError('An unexpected error occurred. Please try again later.');
            
            // Reset button state
            const submitBtn = createProductForm.querySelector('button[type="submit"]');
            resetButton(submitBtn, 'Create Product');
        }
    });
      function validateForm(hasImagePreviews = false) {
        // Check if all required fields are filled
        if (!productName.value.trim()) {
            showError('Product name is required');
            productName.focus();
            return false;
        }
        
        if (!productDescription.value.trim()) {
            showError('Product description is required');
            productDescription.focus();
            return false;
        }
        
        const price = document.getElementById('productPrice').value;
        if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            showError('Valid product price is required');
            document.getElementById('productPrice').focus();
            return false;
        }
        
        // Check if at least one image is selected (either in the file input or in previews)
        if (productImages.files.length === 0 && !hasImagePreviews) {
            showError('At least one product image is required');
            productImages.focus();
            return false;
        }
        
        // Check stock data consistency
        const stockValue = document.getElementById('stockValue').value;
        const stockUnit = document.getElementById('stockUnit').value;
        
        if ((stockValue && !stockUnit) || (!stockValue && stockUnit)) {
            showError('Both stock quantity and unit must be provided if adding stock information');
            return false;
        }
        
        return true;
    }
      function createImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'position-relative me-2 mb-2';
            preview.innerHTML = `
                <div class="image-preview" style="width: 100px; height: 100px; position: relative;">
                    <img src="${e.target.result}" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover;">
                    <button type="button" class="btn btn-danger btn-sm position-absolute" style="top: -10px; right: -10px; border-radius: 50%; padding: 0.2rem 0.5rem;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            // Add remove functionality to the button
            const removeButton = preview.querySelector('.btn-danger');
            removeButton.addEventListener('click', function() {
                preview.remove();
                
                // Create a new FileList without the removed file
                updateFileInput(file);
            });
            
            imagePreviewContainer.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }
    
    function updateFileInput(fileToRemove) {
        // Get current files from the input
        const currentFiles = Array.from(productImages.files);
        
        // Create a new DataTransfer object
        const dataTransfer = new DataTransfer();
        
        // Add all files except the one being removed
        currentFiles.forEach(file => {
            if (file !== fileToRemove) {
                dataTransfer.items.add(file);
            }
        });
        
        // Set the new FileList to the input
        productImages.files = dataTransfer.files;
        
        // Show validation error if no files left
        if (productImages.files.length === 0) {
            productImages.setCustomValidity('At least one product image is required');
        } else {
            productImages.setCustomValidity('');
        }
    }
    
    function showImageError(message) {
        imageError.textContent = message;
        imageError.classList.remove('d-none');
    }
    
    function resetButton(button, originalText) {
        button.disabled = false;
        button.textContent = originalText;
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        
        // Scroll to error message
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.remove('d-none');
        
        // Clear form
        createProductForm.reset();
        imagePreviewContainer.innerHTML = '';
        nameCharCounter.textContent = '0/100';
        descCharCounter.textContent = '0/500';
        
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function handleErrorResponse(statusCode, data) {
        let errorMessage = 'An error occurred while creating the product.';
        
        switch (statusCode) {
            case 400:
                errorMessage = 'Invalid product data. Please check your inputs and try again.';
                if (data.message) errorMessage = data.message;
                break;
            case 409:
                errorMessage = 'A product with this name already exists.';
                if (data.message) errorMessage = data.message;
                break;
            case 500:
                errorMessage = 'Server error. Please try again later.';
                if (data.message) errorMessage = data.message;
                break;
            case 401:
                errorMessage = 'Your session has expired. Please log in again.';
                // Redirect to login page
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                break;
            case 403:
                errorMessage = 'You do not have permission to create products.';
                // Redirect to profile page
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
                break;
            default:
                if (data.message) errorMessage = data.message;
                break;
        }
        
        showError(errorMessage);
    }
});

/**
 * Checks if the current user is authorized to access this page
 * Only users with Admin role should be able to create products
 */
async function checkUserAuthorization() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
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
        
        if (userRole !== 'Admin') {
            // User is not an Admin, redirect to profile page
            console.log('User is not an Admin, redirecting to profile page...');
            const errorMessage = 'You do not have permission to create products. Only Admin users can access this page.';
            localStorage.setItem('accessError', errorMessage);
            window.location.href = 'profile.html';
        }
    } catch (error) {
        console.error('Error checking user authorization:', error);
        window.location.href = 'login.html';
    }
}
