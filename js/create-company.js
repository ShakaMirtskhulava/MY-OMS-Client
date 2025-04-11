/**
 * Company creation functionality for Order Management System
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and has RootUser role
    checkUserAuthorization();
    
    const createCompanyForm = document.getElementById('create-company-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    
    // Set up logout button handler
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
    
    createCompanyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
          // Get form data
        const formData = {
            name: document.getElementById('companyName').value,
            address: document.getElementById('address').value || "",
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            locations: [
                {
                    latitude: parseFloat(document.getElementById('latitude').value),
                    longitude: parseFloat(document.getElementById('longitude').value),
                    name: document.getElementById('locationName').value
                }
            ]
        };
        
        try {
            // Show loading state
            const submitBtn = createCompanyForm.querySelector('button[type="submit"]');
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
            
            // Make API request
            console.log('Submitting create company request with data:', formData);
            const response = await fetch('https://distribo-api.azurewebsites.net/v1/companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            console.log('Create company API response:', response);
            console.log('Create company API response data:', data);
              // Reset button state
            resetButton(submitBtn, originalBtnText);
              if (response.status === 200) {
                // Success - company created
                showSuccess('Company created successfully!');
                
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
            console.error('Error creating company:', error);
            showError('An unexpected error occurred. Please try again later.');
            
            // Reset button state
            const submitBtn = createCompanyForm.querySelector('button[type="submit"]');
            resetButton(submitBtn, 'Create Company');
        }
    });
    
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
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function handleErrorResponse(statusCode, data) {
        let errorMsg = data.message || 'An error occurred while creating the company.';
        
        switch (statusCode) {
            case 400:
                errorMsg = 'Invalid company information. Please check your input and try again.';
                break;
            case 401:
                errorMsg = 'Authentication failed. Please log in again.';
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                break;
            case 403:
                errorMsg = 'You do not have permission to create companies. Only Root Users can perform this action.';
                break;
            case 404:
                errorMsg = 'User profile not found. Please log in again.';
                break;
            case 409:
                // Conflict - handle specific errors from the API
                if (data.code === 'UserAlreadyHasCompany') {
                    errorMsg = 'You already have a company associated with your account.';
                } else if (data.code === 'NameIsTaken') {
                    errorMsg = 'A company with this name already exists. Please choose a different name.';
                } else if (data.code === 'EmailIsTaken') {
                    errorMsg = 'A company with this email already exists. Please use a different email.';
                } else if (data.code === 'PhoneNumberIsTaken') {
                    errorMsg = 'A company with this phone number already exists. Please use a different phone number.';
                }
                break;
            case 500:
                errorMsg = 'A server error occurred. Please try again later.';
                break;
        }
        
        showError(errorMsg);
    }
    
    function checkUserAuthorization() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            // Not logged in, redirect to login page
            window.location.href = 'login.html';
            return;
        }
        
        // Check user role from JWT token
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                
                // Check if user has RootUser role
                const role = payload.role;
                if (role !== 'RootUser') {
                    // Unauthorized - redirect to profile page
                    showError('Only Root Users can create companies.');
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            // If token can't be decoded, redirect to login page
            window.location.href = 'login.html';
        }
    }
});
