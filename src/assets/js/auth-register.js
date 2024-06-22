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



document.getElementById('registrationForm').addEventListener('submit', async function (event) {
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

    try {
        const settings = await loadSettings();
        const apiUrl = `${settings.apiBaseUrl}/users`;

        // Make POST request to the registration endpoint
        const registrationResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json-patch+json'
            },
            body: JSON.stringify(payload)
        });

        const data = await registrationResponse.json();

        if (!registrationResponse.ok) {
            throw new Error(data.message);
        }

        // Proceed with login using the registered phone number and password
        const loginUrl = `${settings.apiBaseUrl}/accounts/login?PhoneNumber=${encodeURIComponent(phoneNumber)}&Password=${encodeURIComponent(password)}`;

        const loginResponse = await fetch(loginUrl, {
            method: 'GET',
            headers: {
                'Accept': '*/*'
            }
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
            throw new Error(loginData.message || 'Login failed');
        }

        const token = loginData.data; // Assuming token is in data field

        // Store token in localStorage or sessionStorage
        localStorage.setItem('token', token);

        // Redirect to home page on successful registration and login
        window.location.href = './user-profile.html';
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
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
