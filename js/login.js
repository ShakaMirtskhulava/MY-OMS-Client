/**
 * Login functionality for Order Management System
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            
            // Clear previous error messages
            errorMessage.classList.add('d-none');
            
            // Prepare login data
            const loginData = {
                email: email,
                password: password
            };
            console.log('Attempting to log in with email:', email);
            // Make API request
            const response = await fetch('https://distribo-api.azurewebsites.net/v1/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            const data = await response.json();
            console.log('Login API response:', response);
            console.log('Login API response data:', data);

            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;            if (response.ok) {
                // Login successful
                // Check if data.data is a string (JWT token itself)
                const token = typeof data.data === 'string' ? data.data : (data.token || (data.data && data.data.token));
                
                if (token) {
                    // Store token
                    localStorage.setItem('token', token);
                    
                    // Store user data if available, or store minimal information
                    if (typeof data.data === 'object') {
                        localStorage.setItem('user', JSON.stringify(data.data));
                    } else {
                        localStorage.setItem('user', JSON.stringify({
                            token: token
                        }));
                    }
                      // Show success alert
                    const successAlert = document.createElement('div');
                    successAlert.className = 'alert alert-success';
                    successAlert.textContent = 'Login successful! Redirecting to products...';
                    errorMessage.parentNode.insertBefore(successAlert, errorMessage.nextSibling);
                    
                    console.log('Authentication successful, token stored');
                    
                    // Redirect to products page after a short delay
                    setTimeout(() => {
                        window.location.href = 'products.html';
                    }, 1500);
                } else {
                    // API returned success but with no token
                    console.error('Login API returned 200 but no token was found in the response', data);
                    showError('Authentication successful but no token was returned. Please contact support.');
                }
            } else {
                // Login failed
                showError(data.message || 'Authentication failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred during login. Please try again later.');
            
            // Reset button state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }
});
