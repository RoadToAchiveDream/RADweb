document.getElementById('registrationForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Get form values
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;

    // Create request payload
    const payload = {
        email: email,
        password: password,
        phoneNumber: phoneNumber,
        firstName: firstName,
        lastName: lastName
    };

    // Clear previous alerts
    clearAlerts();

    // Make POST request to the registration endpoint
    fetch('https://localhost:7065/api/users', {
        method: 'POST',
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json-patch+json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            // Check if the response status is 400 or 500 (client or server error)
            // Parse the response body as JSON
            return response.json().then(err => {
                throw new Error(err.message || JSON.stringify(err));
            });
        }
        return response.json();
    })
    .then(data => {
        // Handle successful response data
        console.log(data);
        // Redirect to home page on successful registration
        window.location.href = './index.html';
    })
    .catch(error => {
        console.error('Error:', error.message);
        // Display error message in an alert
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
