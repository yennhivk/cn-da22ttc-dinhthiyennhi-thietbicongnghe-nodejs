// Load Header and Footer components
document.addEventListener('DOMContentLoaded', function() {
    // Load Header
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        fetch('../includes/header.html?v=' + Date.now())
            .then(response => response.text())
            .then(data => {
                headerPlaceholder.innerHTML = data;
                // Initialize auth UI after header is loaded
                if (typeof initAuthUI === 'function') {
                    initAuthUI();
                }
                // Update cart badge after header is loaded
                if (typeof updateCartBadge === 'function') {
                    updateCartBadge();
                }
            })
            .catch(error => console.error('Error loading header:', error));
    }

    // Load Footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('../includes/footer.html?v=' + Date.now())
            .then(response => response.text())
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(error => console.error('Error loading footer:', error));
    }
});