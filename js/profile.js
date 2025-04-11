/**
 * Profile page functionality for Order Management System
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Check for registration error message
    const registrationError = localStorage.getItem('registrationError');
    if (registrationError) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = registrationError;
        errorMessage.classList.remove('d-none');
        // Remove the error message from localStorage so it doesn't show again on refresh
        localStorage.removeItem('registrationError');
    }

    // Set up logout button handler
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Add event listener for delete company button
    document.getElementById('delete-company-btn').addEventListener('click', deleteCompany);

    // Fetch and display user profile data
    fetchUserProfile();
});

/**
 * Fetches the current user's profile information from the API
 */
async function fetchUserProfile() {
    const token = localStorage.getItem('token');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const profileContent = document.getElementById('profile-content');

    try {
        console.log('Fetching user profile data...');
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
        }        // Display the user data
        displayUserProfile(data.data);
        // Get user role
        const userRole = data.data.role && data.data.role.name ? data.data.role.name : 'User';
        
        if (userRole === 'RootUser' || userRole === 'User') {
            // Show the company section for RootUser and User
            document.getElementById('company-section').classList.remove('d-none');
            fetchCompanyData(userRole, true); // true means show company info
        } else if (userRole === 'Admin') {
            // For Admin users, only show the Register User button without company info
            document.getElementById('company-section').classList.remove('d-none');
            fetchCompanyData(userRole, false); // false means don't show company info
        } else {
            // For other roles, hide loading spinner and show profile content
            loadingSpinner.classList.add('d-none');
            profileContent.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        errorMessage.textContent = `Failed to load profile: ${error.message}`;
        errorMessage.classList.remove('d-none');
        loadingSpinner.classList.add('d-none');
    }
}

/**
 * Fetches company information for the current user
 * @param {string} userRole - The role of the current user
 * @param {boolean} showCompanyInfo - Whether to show company information
 */
async function fetchCompanyData(userRole, showCompanyInfo = true) {
    const token = localStorage.getItem('token');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const profileContent = document.getElementById('profile-content');    const companyInfoContainer = document.getElementById('company-info-container');
    const createCompanyBtnContainer = document.getElementById('create-company-btn-container');
    const deleteCompanyBtnContainer = document.getElementById('delete-company-btn-container');    
    const registerUserBtnContainer = document.getElementById('register-user-btn-container');    // For Admin role, show Register User button immediately
    if (userRole === 'Admin') {
        registerUserBtnContainer.classList.remove('d-none');
        // Show Create Product button for Admin users
        document.getElementById('create-product-btn-container').classList.remove('d-none');
    }
    // For RootUser, we'll show the Register User button only if they have a company (checked later)
    
    // For Admin role, hide company info and exit early
    if (!showCompanyInfo) {
        companyInfoContainer.classList.add('d-none');
        // Hide loading spinner and show profile content
        loadingSpinner.classList.add('d-none');
        profileContent.classList.remove('d-none');
        return; // Exit early since we don't need company data
    }

    try {
        const response = await fetch('https://distribo-api.azurewebsites.net/v1/companies/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Company API response:', response);
        console.log('Company API response data:', data);

        if (response.status === 404) {
            // Company not found - for RootUser, show create button
            if (userRole === 'RootUser') {
                createCompanyBtnContainer.classList.remove('d-none');
                console.log('Create company button should be visible now');
            }
            
            // Hide company info since there's no company
            hideCompanyInfo();        } else if (response.ok && data.data) {
            // Company found - display company data
            displayCompanyData(data.data);
            
            // For RootUser, show delete button and Register User button
            if (userRole === 'RootUser') {
                deleteCompanyBtnContainer.classList.remove('d-none');
                // Show Register User button only if RootUser has a company
                registerUserBtnContainer.classList.remove('d-none');
            }
        } else {
            throw new Error(data.message || `Error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching company data:', error);
        // We'll show the profile anyway, but with N/A for company data
        hideCompanyInfo();
    } finally {
        // Hide loading spinner and show profile content
        loadingSpinner.classList.add('d-none');
        profileContent.classList.remove('d-none');
    }
}

/**
 * Displays the user profile data in the UI
 * @param {Object} userData - The user data returned from the API
 */
function displayUserProfile(userData) {
    // Update user details
    document.getElementById('user-email').querySelector('span').textContent = userData.email;
    
    // Handle role display, accounting for role being an object with name property
    const roleText = userData.role && userData.role.name ? userData.role.name : 'User';
    document.getElementById('user-role').querySelector('span').textContent = roleText;
    
    // Update avatar with first two characters of the email
    const avatarElement = document.getElementById('user-avatar');
    const userInitials = userData.email.substring(0, 2).toUpperCase();
    avatarElement.textContent = userInitials;
}

/**
 * Displays company data in the UI
 * @param {Object} companyData - The company data returned from the API
 */
function displayCompanyData(companyData) {
    document.getElementById('company-name').textContent = companyData.name || 'N/A';
    
    // Format address
    const addressParts = [];
    if (companyData.address) addressParts.push(companyData.address);
    if (companyData.city) addressParts.push(companyData.city);
    if (companyData.state) addressParts.push(companyData.state);
    if (companyData.zipCode) addressParts.push(companyData.zipCode);
    if (companyData.country) addressParts.push(companyData.country);
    
    const addressText = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
    document.getElementById('company-address').textContent = addressText;
    
    document.getElementById('company-phone').textContent = companyData.phone || 'N/A';
    
    // Format website with link if present
    if (companyData.website) {
        const websiteElement = document.getElementById('company-website');
        websiteElement.innerHTML = '';
        const link = document.createElement('a');
        link.href = ensureHttpPrefix(companyData.website);
        link.textContent = companyData.website;
        link.target = '_blank';
        websiteElement.appendChild(link);
    } else {
        document.getElementById('company-website').textContent = 'N/A';
    }
}

/**
 * Hides company info by setting all fields to N/A
 */
function hideCompanyInfo() {
    document.getElementById('company-name').textContent = 'N/A';
    document.getElementById('company-address').textContent = 'N/A';
    document.getElementById('company-phone').textContent = 'N/A';
    document.getElementById('company-website').textContent = 'N/A';
}

/**
 * Handles the delete company button click
 */
async function deleteCompany() {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
        return;
    }

    const token = localStorage.getItem('token');
    const errorMessage = document.getElementById('error-message');

    try {
        // First fetch the company to get its ID
        const getResponse = await fetch('https://distribo-api.azurewebsites.net/v1/companies/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const companyData = await getResponse.json();
        
        if (!getResponse.ok || !companyData.data || !companyData.data.id) {
            throw new Error('Could not retrieve company information');
        }
        
        const companyId = companyData.data.id;
        
        // Now delete the company
        const deleteResponse = await fetch(`https://distribo-api.azurewebsites.net/v1/companies?id=${companyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const deleteData = await deleteResponse.json();
        
        if (!deleteResponse.ok) {
            throw new Error(deleteData.message || `Error: ${deleteResponse.status}`);
        }
        
        alert('Company has been successfully deleted');
        
        // Refresh the page to update the UI
        window.location.reload();
    } catch (error) {
        console.error('Error deleting company:', error);
        errorMessage.textContent = `Failed to delete company: ${error.message}`;
        errorMessage.classList.remove('d-none');
    }
}

/**
 * Ensures a URL has an http/https prefix
 * @param {string} url - The URL to check and potentially modify
 * @returns {string} - The URL with http:// prefix if needed
 */
function ensureHttpPrefix(url) {
    if (!url) return '';
    return url.match(/^https?:\/\//) ? url : `http://${url}`;
}
