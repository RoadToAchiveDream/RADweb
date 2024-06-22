async function loadSettings() {
    try {
        const response = await fetch('../settings.json');
        if (!response.ok) {
            throw new Error('Failed to load settings');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading settings:', error.message);
        throw error;
    }
}

// Function to parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('JWT parsing error:', error.message);
        throw error;
    }
}

// Function to fetch user profile data
async function fetchUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token not found');
        // Redirect or handle unauthorized access
        window.location.href = './authentication-login.html'; // Redirect to login page
        return;
    }

    try {
        // Parse JWT token to get user data
        const userData = parseJwt(token);
        console.log('User Profile Data:', userData);

        // Update UI with user profile data
        document.getElementById('userFirstname').value = userData.firstname;
        document.getElementById('userLastname').value = userData.lastname;
        document.getElementById('userEmail').value = userData.email;
        document.getElementById('userPhone').value = userData.phone_number;
    } catch (error) {
        console.error('Error parsing JWT or updating UI:', error.message);
        // Handle error, show alert or message
        showAlert('danger', 'Ошибка:', error.message);
    }
}

// Function to show Bootstrap alert
function showAlert(type, title, message) {
    const alertContainer = document.getElementById('alertContainer');

    const alert = document.createElement('div');
    alert.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
    alert.setAttribute('role', 'alert');

    alert.innerHTML = `
        <strong>${title}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.appendChild(alert);
}

// Example usage in your application
document.addEventListener('DOMContentLoaded', function () {
    fetchUserProfile();
});

