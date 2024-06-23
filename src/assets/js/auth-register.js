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

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;

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

        const registrationResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json-patch+json'
            },
            body: JSON.stringify(payload)
        });


        const contentType = registrationResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Unexpected response format');
        }

        const data = await registrationResponse.json();

        if (!registrationResponse.ok) {
            throw new Error(data.message);
        }

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

        const token = loginData.data;

        localStorage.setItem('token', token);

        window.location.href = './user-profile.html';
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
});

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

function clearAlerts() {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
}
