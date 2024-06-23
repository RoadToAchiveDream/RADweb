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

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;

    try {
        const settings = await loadSettings();
        const loginUrl = `${settings.apiBaseUrl}/accounts/login?PhoneNumber=${encodeURIComponent(phoneNumber)}&Password=${encodeURIComponent(password)}`;

        const response = await fetch(loginUrl, {
            method: 'GET',
            headers: {
                'Accept': '*/*'
            }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Unexpected response format');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        const token = data.data;

        localStorage.setItem('token', token);

        window.location.href = './dashboard.html';
    } catch (error) {
        console.error('Login error:', error.message);

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
