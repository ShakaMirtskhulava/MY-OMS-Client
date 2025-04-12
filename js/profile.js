/**
 * Profile page functionality for Order Management System
 */

// Global variables for the map functionality
let map;
let marker;
let selectedLatitude = null;
let selectedLongitude = null;
let locationModal;

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Bootstrap modal
    locationModal = new bootstrap.Modal(document.getElementById('locationModal'));

    // Check for registration error message
    const registrationError = localStorage.getItem('registrationError');
    if (registrationError) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = registrationError;
        errorMessage.classList.remove('d-none');
        // Remove the error message from localStorage so it doesn't show again on refresh
        localStorage.removeItem('registrationError');
    }

    // DOM elements
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const profileContent = document.getElementById('profile-content');
    
    // Set up logout button handler
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Add event listener for delete company button
    document.getElementById('delete-company-btn').addEventListener('click', deleteCompany);

    // Add event listener for add location button
    document.getElementById('add-location-btn').addEventListener('click', function() {
        // Reset form values
        document.getElementById('location-name').value = '';
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        
        // Reset error and success messages
        document.getElementById('location-error').classList.add('d-none');
        document.getElementById('location-success').classList.add('d-none');
        
        // Show the modal
        locationModal.show();
    });

    // Add event listener for save location button
    document.getElementById('save-location-btn').addEventListener('click', saveLocation);

    // Fetch and display user profile data
    fetchProfileData();
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
 * Fetches the current user's profile information from the API
 */
async function fetchProfileData() {
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
    const profileContent = document.getElementById('profile-content');    
    const companyInfoContainer = document.getElementById('company-info-container');
    const createCompanyBtnContainer = document.getElementById('create-company-btn-container');
    const deleteCompanyBtnContainer = document.getElementById('delete-company-btn-container');    
    const registerUserBtnContainer = document.getElementById('register-user-btn-container');    
    const addLocationBtn = document.getElementById('add-location-btn');
    
    // For Admin role, show Register User button immediately
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
            hideCompanyInfo();
        } else if (response.ok && data.data) {
            // Company found - display company data
            displayCompanyData(data.data);
            
            // Display locations if available
            if (data.data.locations) {
                displayLocations(data.data.locations, userRole);
            }
            
            // For RootUser, show delete button, Register User button, and Add Location button
            if (userRole === 'RootUser') {
                deleteCompanyBtnContainer.classList.remove('d-none');
                // Show Register User button only if RootUser has a company
                registerUserBtnContainer.classList.remove('d-none');
                // Show Add Location button
                addLocationBtn.classList.remove('d-none');
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
 * Displays the locations list in the UI
 * @param {Array} locations - Array of location objects
 * @param {String} userRole - The user's role
 */
function displayLocations(locations, userRole) {
    const locationsListElement = document.getElementById('locations-list');
    locationsListElement.innerHTML = '';

    if (!locations || locations.length === 0) {
        locationsListElement.innerHTML = '<div class="text-secondary">No locations available</div>';
        return;
    }

    // Check if there's only one location (for disable delete button logic)
    const isLastLocation = locations.length === 1;

    locations.forEach(location => {
        const locationItem = document.createElement('div');
        locationItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        locationItem.style.backgroundColor = '#283444';
        locationItem.style.border = '1px solid #334155';
        locationItem.style.marginBottom = '8px';
        locationItem.style.borderRadius = '5px';
        locationItem.style.color = '#fff';

        // Create location name and details
        const locationInfo = document.createElement('div');
        locationInfo.innerHTML = `
            <div><strong>${location.name}</strong></div>
            <div class="text-secondary small">Lat: ${location.latitude}, Lng: ${location.longitude}</div>
            <div class="text-secondary small">ID: ${location.id}</div>
        `;

        // Create delete button (only for RootUser)
        const actionsContainer = document.createElement('div');
        if (userRole === 'RootUser') {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete Location';

            // Disable button if this is the last location
            if (isLastLocation) {
                deleteBtn.disabled = true;
                deleteBtn.title = 'Cannot delete the last location';
                deleteBtn.style.opacity = '0.5';
                deleteBtn.style.cursor = 'not-allowed';
            } else {
                deleteBtn.addEventListener('click', () => deleteLocation(location.id));
            }
            
            actionsContainer.appendChild(deleteBtn);
        }

        // Add elements to the location item
        locationItem.appendChild(locationInfo);
        locationItem.appendChild(actionsContainer);
        locationsListElement.appendChild(locationItem);
    });
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
 * Handles saving a new location
 */
async function saveLocation() {
    const token = localStorage.getItem('token');
    const locationName = document.getElementById('location-name').value.trim();
    const errorElement = document.getElementById('location-error');
    const successElement = document.getElementById('location-success');
    
    // Reset messages
    errorElement.classList.add('d-none');
    successElement.classList.add('d-none');
    
    // Validate input
    if (!locationName) {
        errorElement.textContent = 'Please enter a location name';
        errorElement.classList.remove('d-none');
        return;
    }
    
    if (selectedLatitude === null || selectedLongitude === null) {
        errorElement.textContent = 'Please select a location on the map';
        errorElement.classList.remove('d-none');
        return;
    }
    
    // Prepare data for API
    const locationData = {
        name: locationName,
        latitude: selectedLatitude,
        longitude: selectedLongitude
    };
    
    try {
        const response = await fetch('https://distribo-api.azurewebsites.net/v1/locations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(locationData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success
            successElement.textContent = 'Location added successfully';
            successElement.classList.remove('d-none');
            
            // Refresh company data to update locations list
            setTimeout(() => {
                locationModal.hide();
                const userRole = document.getElementById('user-role').querySelector('span').textContent;
                fetchCompanyData(userRole, true);
            }, 1500);
        } else if (response.status === 409) {
            // Location name already exists
            errorElement.textContent = 'A location with this name already exists for your company';
            errorElement.classList.remove('d-none');
        } else {
            // Other error
            errorElement.textContent = data.message || 'An error occurred while adding the location';
            errorElement.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error adding location:', error);
        errorElement.textContent = 'Failed to save location. Please try again.';
        errorElement.classList.remove('d-none');
    }
}

/**
 * Handles deleting a location
 * @param {string} locationId - The ID of the location to delete
 */
async function deleteLocation(locationId) {
    if (!locationId) {
        console.error('Cannot delete location: No location ID provided');
        return;
    }

    console.log('Attempting to delete location with ID:', locationId);
    
    if (!confirm('Are you sure you want to delete this location?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    const errorMessage = document.getElementById('error-message');
    
    try {
        // First, check if we have more than one location
        const companyResponse = await fetch('https://distribo-api.azurewebsites.net/v1/companies/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const companyData = await companyResponse.json();
        
        if (companyResponse.ok && companyData.data && companyData.data.locations) {
            if (companyData.data.locations.length <= 1) {
                alert('Cannot delete the last location. Companies must have at least one location.');
                return;
            }
        }
        
        // Now proceed with deletion using query parameter format
        const response = await fetch(`https://distribo-api.azurewebsites.net/v1/locations?id=${locationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Log the response for debugging
        console.log('Delete location response status:', response.status);
        
        // Handle response based on status code
        if (response.ok) {
            alert('Location deleted successfully');
            // Refresh the locations list
            const userRole = document.getElementById('user-role').querySelector('span').textContent;
            fetchCompanyData(userRole, true);
        } else {
            const data = await response.json();
            console.error('Delete location API error response:', data);
            
            if (response.status === 400) {
                if (data.code === 'HasApprovedOrders') {
                    alert('Cannot delete location because it has approved orders');
                } else if (data.code === 'CompanyMustHaveOneLocation') {
                    alert('Cannot delete the last location. Companies must have at least one location');
                } else {
                    alert(data.message || 'An error occurred while deleting the location');
                }
            } else if (response.status === 404) {
                alert('Location not found. It may have been already deleted.');
            } else {
                throw new Error(data.message || `Error: ${response.status}`);
            }
        }
    } catch (error) {
        console.error('Error deleting location:', error);
        errorMessage.textContent = `Failed to delete location: ${error.message}`;
        errorMessage.classList.remove('d-none');
    }
}

/**
 * Ensures a URL has http/https prefix
 * @param {string} url - The URL to ensure has http prefix
 * @returns {string} The URL with http prefix
 */
function ensureHttpPrefix(url) {
    if (!url) return '';
    return url.match(/^https?:\/\//) ? url : `http://${url}`;
}
