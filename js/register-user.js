/**
 * Register User functionality for Order Management System
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Set up logout button handler
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Check user authorization (must be Admin or RootUser)
    checkUserAuthorization();

    // Set up form submission handler
    document.getElementById('register-form').addEventListener('submit', handleRegisterSubmit);
});

/**
 * Verifies the current user has permission to access this page
 */
async function checkUserAuthorization() {
    const token = localStorage.getItem('token');
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('https://distribo-api.azurewebsites.net/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to verify user authorization');
        }
        
        const data = await response.json();
        const userRole = data.data.role && data.data.role.name ? data.data.role.name : '';
        
        // Check if user has required role
        if (userRole !== 'Admin' && userRole !== 'RootUser') {
            // User is not authorized, log them out
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }
        
        // If user is a RootUser, check if they have a company
        if (userRole === 'RootUser') {
            const hasCompany = await checkRootUserHasCompany(token);
            if (!hasCompany) {
                // Redirect to profile page with error message
                localStorage.setItem('registrationError', 'You need to create a company before registering users.');
                window.location.href = 'profile.html';
                return;
            }
        }
        
        // User is authorized, populate role options based on their role
        populateRoleOptions(userRole);
        
    } catch (error) {
        console.error('Authorization check failed:', error);
        errorMessage.textContent = `Authorization error: ${error.message}`;
        errorMessage.classList.remove('d-none');
        
        // After a short delay, redirect to login
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }, 3000);
    }
}

/**
 * Populates the role dropdown with appropriate options based on current user's role
 * @param {string} currentUserRole - The role of the current user (Admin or RootUser)
 */
function populateRoleOptions(currentUserRole) {
    const roleSelect = document.getElementById('role');
    
    // Clear existing options except the placeholder
    while (roleSelect.options.length > 1) {
        roleSelect.remove(1);
    }
    
    if (currentUserRole === 'Admin') {
        // Admin can create Employee, RootUser, and Distributor
        const adminRoles = ['Employee', 'RootUser', 'Distributor'];
        adminRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            roleSelect.appendChild(option);
        });
    } else if (currentUserRole === 'RootUser') {
        // RootUser can only create User role
        const option = document.createElement('option');
        option.value = 'User';
        option.textContent = 'User';
        roleSelect.appendChild(option);
    }
}

/**
 * Handles the form submission to register a new user
 * @param {Event} e - The submit event
 */
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    // Get form elements
    const form = e.target;
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const roleSelect = document.getElementById('role');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    // Reset form validation state
    form.classList.remove('was-validated');
    errorMessage.classList.add('d-none');
    successMessage.classList.add('d-none');
    
    // Basic form validation
    let isValid = true;
    
    // Validate email
    if (!emailInput.value || !isValidEmail(emailInput.value)) {
        emailInput.classList.add('is-invalid');
        isValid = false;
    } else {
        emailInput.classList.remove('is-invalid');
    }
    
    // Validate password
    if (!passwordInput.value) {
        passwordInput.classList.add('is-invalid');
        isValid = false;
    } else {
        passwordInput.classList.remove('is-invalid');
    }
    
    // Validate password confirmation
    if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.classList.add('is-invalid');
        isValid = false;
    } else {
        confirmPasswordInput.classList.remove('is-invalid');
    }
    
    // Validate role selection
    if (!roleSelect.value) {
        roleSelect.classList.add('is-invalid');
        isValid = false;
    } else {
        roleSelect.classList.remove('is-invalid');
    }
    
    if (!isValid) {
        errorMessage.textContent = 'Please fix the form errors and try again.';
        errorMessage.classList.remove('d-none');
        return;
    }
    
    // Prepare request data
    const userData = {
        email: emailInput.value,
        password: passwordInput.value,
        role: roleSelect.value
    };
    
    // Show loading spinner
    loadingSpinner.classList.remove('d-none');
    form.classList.add('d-none');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://distribo-api.azurewebsites.net/v1/users/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        // Hide loading spinner
        loadingSpinner.classList.add('d-none');
        form.classList.remove('d-none');
        
        if (response.ok) {
            // Registration successful
            successMessage.textContent = 'User registered successfully! An email confirmation link has been sent to the user.';
            successMessage.classList.remove('d-none');
            
            // Reset form
            form.reset();
        } else {
            // API returned an error
            throw new Error(data.message || `Error: ${response.status}`);
        }
    } catch (error) {
        console.error('User registration failed:', error);
        errorMessage.textContent = `Failed to register user: ${error.message}`;
        errorMessage.classList.remove('d-none');
        
        // Hide loading spinner
        loadingSpinner.classList.add('d-none');
        form.classList.remove('d-none');
    }
}

/**
 * Validates an email address format
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Checks if a RootUser has an associated company
 * @param {string} token - The authentication token
 * @returns {boolean} - Whether the RootUser has a company
 */
async function checkRootUserHasCompany(token) {
    try {
        const response = await fetch('https://distribo-api.azurewebsites.net/v1/companies/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // If we get a 404, the user doesn't have a company
        if (response.status === 404) {
            return false;
        }
        
        // If the request was successful and returned data, the user has a company
        if (response.ok) {
            const data = await response.json();
            return data.data && Object.keys(data.data).length > 0;
        }
        
        // For any other response, assume the user doesn't have a company
        return false;
    } catch (error) {
        console.error('Error checking if RootUser has company:', error);
        return false;
    }
}
