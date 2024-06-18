document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Get form values
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;

    // Create URL with query parameters
    const url = new URL('https://localhost:7065/api/accounts/login');
    const params = { PhoneNumber: phoneNumber, Password: password };
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    // Make GET request to the login endpoint
    fetch(url, {
        method: 'GET',
        headers: {
            'Accept': '*/*'
        }
    })
    .then(response => {
        if (!response.ok) {
            // If response is not ok, attempt to parse JSON error message
            return response.json().then(err => {
                throw new Error(`${err.message}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Handle successful response data
        console.log(data);
        // Redirect to home page on successful login
        window.location.href = './index.html';
    })
    .catch(error => {
        console.error('Error:', error.message);
        // Display error message to the user or handle as needed
        // Example: Show error message in an alert
        showAlert('danger', 'Ошибка:', error.message);
    });
});

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

// Function to clear all alerts
function clearAlerts() {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = ''; // Clear all child elements
}
