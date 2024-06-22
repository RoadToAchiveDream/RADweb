document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the logout button
    const logoutButton = document.getElementById('logoutButton');

    // Add click event listener to the logout button
    logoutButton.addEventListener('click', function() {
        // Show confirmation dialog
        if (confirm('Вы уверены, что хотите выйти?')) {
            // If confirmed, clear token from localStorage (assuming you're using tokens)
            localStorage.removeItem('token');
            // Redirect to login page
            window.location.href = './authentication-login.html';
        }
    });
});
