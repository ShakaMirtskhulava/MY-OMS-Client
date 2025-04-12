/**
 * Common navbar functionality for Order Management System
 */
document.addEventListener('DOMContentLoaded', function() {
    // Side Navbar Elements
    const sideNavbar = document.querySelector('.side-navbar');
    const navbarToggle = document.getElementById('navbar-toggle');
    const toggleIcon = document.getElementById('toggle-icon');
    const contentContainer = document.querySelector('.content-container');
    
    // Ensure all elements exist before proceeding
    if (!sideNavbar || !navbarToggle || !toggleIcon || !contentContainer) {
        console.error('Navbar elements not found');
        return;
    }
    
    // Check if mobile view
    const isMobile = window.innerWidth < 768;
    
    // Initialize navbar state
    if (isMobile) {
        sideNavbar.classList.remove('expanded');
        contentContainer.classList.remove('nav-expanded', 'nav-collapsed');
        
        // Ensure toggle button is visible initially in mobile view
        navbarToggle.style.visibility = 'visible';
        navbarToggle.style.opacity = '1';
    }
    
    // Save navbar state to localStorage
    function saveNavbarState(isExpanded) {
        localStorage.setItem('navbarExpanded', isExpanded ? 'true' : 'false');
    }
    
    // Load navbar state from localStorage
    function loadNavbarState() {
        const state = localStorage.getItem('navbarExpanded');
        return state === 'true';
    }
    
    // Apply navbar state based on saved preferences
    function applyNavbarState() {
        const isExpanded = loadNavbarState();
        
        if (isExpanded && !isMobile) {
            sideNavbar.classList.add('expanded');
            navbarToggle.classList.add('expanded');
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-left');
            contentContainer.classList.remove('nav-collapsed');
            contentContainer.classList.add('nav-expanded');
        } else {
            sideNavbar.classList.remove('expanded');
            navbarToggle.classList.remove('expanded');
            toggleIcon.classList.remove('fa-chevron-left');
            toggleIcon.classList.add('fa-chevron-right');
            if (!isMobile) {
                contentContainer.classList.remove('nav-expanded');
                contentContainer.classList.add('nav-collapsed');
            }
        }
    }
    
    // Initialize with saved state
    applyNavbarState();
    
    // Setup Navbar Toggle
    navbarToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isCurrentlyExpanded = sideNavbar.classList.contains('expanded');
        const willBeExpanded = !isCurrentlyExpanded;
        
        sideNavbar.classList.toggle('expanded', willBeExpanded);
        navbarToggle.classList.toggle('expanded', willBeExpanded);
        
        if (willBeExpanded) {
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-left');
            if (!isMobile) {
                contentContainer.classList.remove('nav-collapsed');
                contentContainer.classList.add('nav-expanded');
            }
        } else {
            toggleIcon.classList.remove('fa-chevron-left');
            toggleIcon.classList.add('fa-chevron-right');
            if (!isMobile) {
                contentContainer.classList.remove('nav-expanded');
                contentContainer.classList.add('nav-collapsed');
            }
        }
        
        // Save state to localStorage
        saveNavbarState(willBeExpanded);
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const newIsMobile = window.innerWidth < 768;
        
        if (newIsMobile !== isMobile) {
            // Refresh the page to reset the layout
            location.reload();
        }
    });
    
    // Close navbar when clicking on a link (for mobile)
    if (isMobile) {
        const navLinks = document.querySelectorAll('.side-navbar .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                sideNavbar.classList.remove('expanded');
                navbarToggle.classList.remove('expanded');
                toggleIcon.classList.remove('fa-chevron-left');
                toggleIcon.classList.add('fa-chevron-right');
                
                // Save collapsed state
                saveNavbarState(false);
            });
        });
        
        // Close navbar when clicking outside in mobile view
        document.addEventListener('click', function(event) {
            // If navbar is expanded and click is outside navbar and not on the toggle button
            if (sideNavbar.classList.contains('expanded') && 
                !sideNavbar.contains(event.target) && 
                event.target !== navbarToggle &&
                !navbarToggle.contains(event.target)) {
                    
                sideNavbar.classList.remove('expanded');
                navbarToggle.classList.remove('expanded');
                toggleIcon.classList.remove('fa-chevron-left');
                toggleIcon.classList.add('fa-chevron-right');
                
                // Save collapsed state
                saveNavbarState(false);
            }
        });
    }
}); 