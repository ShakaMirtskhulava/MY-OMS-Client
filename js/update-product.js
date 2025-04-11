/**
 * Update product page functionality for Order Management System
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
    const loadingContainer = document.getElementById('loading-container');
    const formContainer = document.getElementById('form-container');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const updateProductForm = document.getElementById('update-product-form');
    const backBtn = document.getElementById('back-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const productNameInput = document.getElementById('productName');
    const productDescriptionInput = document.getElementById('productDescription');
    const productPriceInput = document.getElementById('productPrice');
    const stockValueInput = document.getElementById('stockValue');
    const stockUnitSelect = document.getElementById('stockUnit');
    const productImagesInput = document.getElementById('productImages');
    const currentImagePreviewContainer = document.getElementById('currentImagePreviewContainer');
    const newImagePreviewContainer = document.getElementById('newImagePreviewContainer');
    const imageError = document.getElementById('imageError');
    const nameCharCounter = document.getElementById('nameCharCounter');
    const descCharCounter = document.getElementById('descCharCounter');

    // Store product data
    let productData = null;
    
    // Back to product detail page
    backBtn.href = `product-detail.html?id=${productId}`;
    cancelBtn.href = `product-detail.html?id=${productId}`;

    // Set up logout button handler
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Check if user is an admin
    checkUserRole();

    // Character counters
    productNameInput.addEventListener('input', function() {
        nameCharCounter.textContent = `${this.value.length}/${this.maxLength}`;
    });

    productDescriptionInput.addEventListener('input', function() {
        descCharCounter.textContent = `${this.value.length}/${this.maxLength}`;
    });

    // Preview new images on selection
    productImagesInput.addEventListener('change', function() {
        previewNewImages();
    });

    // Set up form submit handler
    updateProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            updateProduct();
        }
    });

    // Fetch product details
    fetchProductDetails(productId);

    /**
     * Checks the current user's role and ensures only admins can access this page
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
            
            if (!response.ok) {
                throw new Error(data.message || `Error: ${response.status}`);
            }
            
            // Check if the user has the Admin role
            const userRole = data.data.role && data.data.role.name ? data.data.role.name : 'User';
            
            if (userRole !== 'Admin') {
                // Redirect non-admin users to login page
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error checking user role:', error);
            // Redirect to login on error
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
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
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('Product details API response:', response);
            console.log('Product details data:', data);

            // Hide loading spinner
            loadingContainer.style.display = 'none';

            if (!response.ok) {
                throw new Error(data.message || `Error: ${response.status}`);
            }

            if (data.data) {
                // Store product data
                productData = data.data;
                
                // Populate form with product data
                populateForm(data.data);
                
                // Show form
                formContainer.style.display = 'block';
            } else {
                throw new Error('Product data not found');
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            errorMessage.textContent = `Failed to load product details: ${error.message}`;
            errorMessage.classList.remove('d-none');
            loadingContainer.style.display = 'none';
        }
    }

    /**
     * Populates the form with product data
     * @param {Object} product - The product data object
     */
    function populateForm(product) {
        // Set product name
        productNameInput.value = product.name;
        nameCharCounter.textContent = `${product.name.length}/${productNameInput.maxLength}`;
        
        // Set product description
        productDescriptionInput.value = product.description;
        descCharCounter.textContent = `${product.description.length}/${productDescriptionInput.maxLength}`;
        
        // Set product price
        productPriceInput.value = product.price;
        
        // Set stock information
        if (product.stock && product.stock.value !== undefined) {
            stockValueInput.value = product.stock.value;
            stockUnitSelect.value = product.stock.unit;
        }
        
        // Display current images
        if (product.images && product.images.length > 0) {
            displayCurrentImages(product.images);
        }
    }    /**
     * Displays the current product images
     * @param {Array} images - Array of image objects
     */
    function displayCurrentImages(images) {
        currentImagePreviewContainer.innerHTML = '';
        
        images.forEach((image, index) => {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'position-relative me-2 mb-2';
            imageWrapper.dataset.imageId = image.id;
            
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = `Product image ${index + 1}`;
            img.className = 'img-thumbnail';
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            
            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-danger btn-sm position-absolute top-0 end-0';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.style.width = '20px';
            removeBtn.style.height = '20px';
            removeBtn.style.padding = '0';
            removeBtn.style.fontSize = '10px';
            
            removeBtn.addEventListener('click', function() {
                // Remove image from display
                imageWrapper.remove();
                
                // Add image ID to list of images to remove
                const imagesToRemove = document.getElementById('imagesToRemove');
                if (!imagesToRemove) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.id = 'imagesToRemove';
                    input.name = 'ImagesToRemove';
                    input.value = image.id;
                    updateProductForm.appendChild(input);
                } else {
                    imagesToRemove.value += `,${image.id}`;
                }
                
                // Check if all images have been removed
                if (currentImagePreviewContainer.childElementCount === 0) {
                    // If all current images are removed, make new images required
                    productImagesInput.setAttribute('required', 'required');
                    
                    // Add a note to inform the user
                    const noteElement = document.createElement('div');
                    noteElement.className = 'form-text text-warning';
                    noteElement.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> All existing images removed. You must upload at least one new image.';
                    currentImagesContainer.appendChild(noteElement);
                }
            });
            
            imageWrapper.appendChild(img);
            imageWrapper.appendChild(removeBtn);
            currentImagePreviewContainer.appendChild(imageWrapper);
        });
    }

    /**
     * Previews newly selected images
     */
    function previewNewImages() {
        newImagePreviewContainer.innerHTML = '';
        imageError.classList.add('d-none');
        
        if (productImagesInput.files.length > 0) {
            const files = productImagesInput.files;
            let validFiles = true;
            
            // Check if there are too many images
            const currentImageCount = currentImagePreviewContainer.querySelectorAll('img').length;
            if (files.length + currentImageCount > 4) {
                imageError.textContent = `You can only have up to 4 images in total. You already have ${currentImageCount} images.`;
                imageError.classList.remove('d-none');
                productImagesInput.value = '';
                return;
            }
            
            // Validate and preview each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    imageError.textContent = `Image "${file.name}" exceeds the maximum size of 10MB.`;
                    imageError.classList.remove('d-none');
                    validFiles = false;
                    break;
                }
                
                // Validate file type
                const fileType = file.type.toLowerCase();
                if (!['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
                    imageError.textContent = `Image "${file.name}" is not a supported format. Please use JPEG, JPG, or PNG.`;
                    imageError.classList.remove('d-none');
                    validFiles = false;
                    break;
                }
                
                // Create preview
                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'position-relative me-2 mb-2';
                
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.alt = `New image ${i + 1}`;
                img.className = 'img-thumbnail';
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-danger btn-sm position-absolute top-0 end-0';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.style.width = '20px';
                removeBtn.style.height = '20px';
                removeBtn.style.padding = '0';
                removeBtn.style.fontSize = '10px';
                
                removeBtn.addEventListener('click', function() {
                    // Remove this image from the file input
                    const newFileList = new DataTransfer();
                    for (let j = 0; j < files.length; j++) {
                        if (j !== i) {
                            newFileList.items.add(files[j]);
                        }
                    }
                    productImagesInput.files = newFileList.files;
                    
                    // Remove the preview
                    imageWrapper.remove();
                    
                    // If no images left, clear the input
                    if (newFileList.files.length === 0) {
                        productImagesInput.value = '';
                    }
                });
                
                imageWrapper.appendChild(img);
                imageWrapper.appendChild(removeBtn);
                newImagePreviewContainer.appendChild(imageWrapper);
            }
            
            if (!validFiles) {
                productImagesInput.value = '';
                newImagePreviewContainer.innerHTML = '';
            }
        }
    }

    /**
     * Validates the form before submission
     * @returns {boolean} True if form is valid, false otherwise
     */
    function validateForm() {
        let isValid = true;
        errorMessage.classList.add('d-none');
        
        // Validate product name
        if (!productNameInput.value.trim()) {
            errorMessage.textContent = 'Product name is required.';
            errorMessage.classList.remove('d-none');
            isValid = false;
            return isValid;
        }
        
        // Validate product description
        if (!productDescriptionInput.value.trim()) {
            errorMessage.textContent = 'Product description is required.';
            errorMessage.classList.remove('d-none');
            isValid = false;
            return isValid;
        }
        
        // Validate product price
        if (!productPriceInput.value || parseFloat(productPriceInput.value) <= 0) {
            errorMessage.textContent = 'Product price must be greater than zero.';
            errorMessage.classList.remove('d-none');
            isValid = false;
            return isValid;
        }
        
        // Validate stock value if provided
        if (stockValueInput.value && parseFloat(stockValueInput.value) < 0) {
            errorMessage.textContent = 'Stock value cannot be negative.';
            errorMessage.classList.remove('d-none');
            isValid = false;
            return isValid;
    }
        
        return isValid;
    }
    
    /**
     * Updates the product
     */
    async function updateProduct() {
        try {
            // Show loading state
            loadingContainer.style.display = 'block';
            formContainer.style.display = 'none';
            
            // Check if we have any image files
            const hasCurrentImages = currentImagePreviewContainer.querySelectorAll('img').length > 0;
            const hasNewImages = productImagesInput.files.length > 0;
            
            if (!hasCurrentImages && !hasNewImages) {
                errorMessage.textContent = 'At least one product image is required. Please upload an image.';
                errorMessage.classList.remove('d-none');
                loadingContainer.style.display = 'none';
                formContainer.style.display = 'block';
                return;
            }
            
            // Create form data
            const formData = new FormData();
            formData.append('Name', productNameInput.value.trim());
            formData.append('Description', productDescriptionInput.value.trim());
            formData.append('Price', productPriceInput.value);
            formData.append('StockNewUnit', stockUnitSelect.value);
            
            if (stockValueInput.value) {
                formData.append('Stock.Value', stockValueInput.value);
            }
            
            // Handle image files - we need to ensure all kept images are included 
            // in the ImageFiles field (required by the API)
            
            // First add any newly uploaded images
            if (hasNewImages) {
                for (let i = 0; i < productImagesInput.files.length; i++) {
                    formData.append('ImageFiles', productImagesInput.files[i]);
                }
            }
            
            // Get current images that we want to keep
            const imagesToKeep = [];
            const keepImageIds = [];
            const currentImageWrappers = currentImagePreviewContainer.querySelectorAll('div[data-image-id]');
            
            // Create an array of promises to fetch existing images
            const imagePromises = [];
              currentImageWrappers.forEach(wrapper => {
                const imageId = wrapper.dataset.imageId;
                keepImageIds.push(imageId);
                  // Get the img element inside the wrapper
                const imgElement = wrapper.querySelector('img');
                if (imgElement && imgElement.src) {
                    // Create a promise to fetch this image while ensuring proper content type
                    const imagePromise = fetch(imgElement.src)
                        .then(response => {
                            // Get content type from response
                            let contentType = response.headers.get('content-type');
                            
                            // Force a valid content type that will pass backend validation
                            // The backend checks if ContentType contains "jpeg", "jpg", or "png"
                            if (!contentType || 
                                !(contentType.includes('jpeg') || 
                                  contentType.includes('jpg') || 
                                  contentType.includes('png'))) {
                                
                                // Determine content type from URL if possible
                                const url = imgElement.src.toLowerCase();
                                if (url.endsWith('.png')) {
                                    contentType = 'image/png';
                                } else {
                                    // Default to jpeg for maximum compatibility
                                    contentType = 'image/jpeg';
                                }
                            }
                            
                            return response.blob().then(blob => ({ blob, contentType }));
                        })
                        .then(({ blob, contentType }) => {
                            // Create a file from the blob with a unique name and validated content type
                            // Explicitly use a file extension that matches the content type
                            let extension = 'jpg';
                            if (contentType.includes('png')) {
                                extension = 'png';
                            }
                            
                            const fileName = `existing-image-${imageId}.${extension}`;
                            return new File([blob], fileName, { type: contentType });
                        });
                    
                    imagePromises.push(imagePromise);
                }
            });
            
            // Wait for all image fetch operations to complete
            const existingImageFiles = await Promise.all(imagePromises);
            
            // Add all existing image files to the form data
            existingImageFiles.forEach(file => {
                formData.append('ImageFiles', file);
            });
              // Append the KeepImageIds if any
            if (keepImageIds.length > 0) {
                formData.append('KeepImageIds', keepImageIds.join(','));
            }
            
            // Verify that we have at least one image file
            let imageFilesCount = 0;
            for (let pair of formData.entries()) {
                if (pair[0] === 'ImageFiles') {
                    imageFilesCount++;
                }
            }
            
            // If no images are present (neither new nor existing), show an error
            if (imageFilesCount === 0) {
                errorMessage.textContent = 'At least one product image is required. Please upload an image.';
                errorMessage.classList.remove('d-none');
                loadingContainer.style.display = 'none';
                formContainer.style.display = 'block';
                return;
            }
            
            // Log form data for debugging
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
            }
            
            const response = await fetch(`https://distribo-api.azurewebsites.net/v1/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            // Parse response
            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = { message: null };
            }
            
            console.log('Update product API response:', response);
            console.log('Update product API response data:', data);
            
            if (response.ok) {
                // Product updated successfully, redirect to product detail page
                successMessage.textContent = 'Product updated successfully!';
                successMessage.classList.remove('d-none');
                
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = `product-detail.html?id=${productId}`;
                }, 1500);
            } else {
                throw new Error(data.message || `Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error updating product:', error);
            errorMessage.textContent = `Failed to update product: ${error.message}`;
            errorMessage.classList.remove('d-none');
            loadingContainer.style.display = 'none';
            formContainer.style.display = 'block';
        }
    }
});
