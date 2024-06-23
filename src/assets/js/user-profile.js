// Centralized function to get token from localStorage or redirect to login
function getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        throw new Error('Token not found');
    }
    return token;
}

// Centralized error handling
function handleError(error, context = 'Error') {
    console.error(`${context}:`, error.message);
    showAlert('danger', 'Ошибка:', error.message);
}

async function loadSettings() {
    try {
        const response = await fetch('../settings.json');
        if (!response.ok) throw new Error('Failed to load settings');
        return await response.json();
    } catch (error) {
        handleError(error, 'Error loading settings');
        throw error;
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        handleError(error, 'JWT parsing error');
        throw error;
    }
}

async function fetchUserProfile() {
    try {
        const token = getToken();
        const userData = parseJwt(token);
        const settings = await loadSettings();
        const response = await fetch(`${settings.apiBaseUrl}/users/${userData.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            handleFetchError(response);
            return;
        }

        const userProfile = await response.json();
        populateUserProfile(userProfile.data);
        setUpFormListeners(userData.id);
    } catch (error) {
        handleError(error, 'Error fetching user profile');
    }
}

function populateUserProfile(userProfile) {
    document.getElementById('userFirstname').value = userProfile.firstName;
    document.getElementById('userLastname').value = userProfile.lastName;
    document.getElementById('userEmail').value = userProfile.email;
    document.getElementById('userPhone').value = userProfile.phoneNumber;
}

function setUpFormListeners(userId) {
    document.getElementById('deleteAccountForm').addEventListener('submit', function (event) {
        event.preventDefault();
        deleteUser(userId);
    });

    document.getElementById('editUserForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        await editUser(userId);
    });
}

async function deleteUser(userId) {
    try {
        const token = getToken();
        const settings = await loadSettings();
        const response = await fetch(`${settings.apiBaseUrl}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            handleFetchError(response);
            return;
        }

        console.log('User deleted successfully');
        localStorage.removeItem('token');
        redirectToLogin();
    } catch (error) {
        handleError(error, 'Error deleting user');
    }
}

async function changePassword(oldPassword, newPassword) {
    try {
        const token = getToken();
        const userData = parseJwt(token);
        const settings = await loadSettings();

        // Fetch user profile to get phoneNumber
        const userResponse = await fetch(`${settings.apiBaseUrl}/users/${userData.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!userResponse.ok) {
            handleFetchError(userResponse);
            return;
        }

        const userProfile = await userResponse.json();
        const phoneNumber = encodeURIComponent(userProfile.data.phoneNumber); // Ensure phoneNumber is encoded

        // Construct the change password endpoint with query parameters
        const changePasswordUrl = `${settings.apiBaseUrl}/users/change-password?PhoneNumber=${phoneNumber}&OldPassword=${encodeURIComponent(oldPassword)}&NewPassword=${encodeURIComponent(newPassword)}`;

        const response = await fetch(changePasswordUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            handleFetchError(response);
            return;
        }

        console.log('Password changed successfully');
        localStorage.removeItem('token');
        showAlert('success', 'Успех:', 'Пароль изменен успешно');
        $('#changePasswordModal').modal('hide');
        redirectToLogin();
    } catch (error) {
        handleError(error, 'Error changing password');
    }
}

async function editUser(userId) {
    try {
        const token = getToken();
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phoneNumber: document.getElementById('phoneNumber').value
        };

        const settings = await loadSettings();
        const response = await fetch(`${settings.apiBaseUrl}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json-patch+json',
                'Accept': '*/*'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            handleFetchError(response);
            return;
        }

        console.log('User updated successfully');
        showAlert('success', 'Успех:', 'Данные пользователя успешно обновлены');
        $('#editUserModal').modal('hide');

        // Update token if it has changed
        const newToken = response.headers.get('Authorization');
        if (newToken && newToken !== token) {
            localStorage.setItem('token', newToken);
            console.log('Token updated after user update');
        }

        await fetchUserProfile(); // Reload the user profile with updated details
    } catch (error) {
        handleError(error, 'Error updating user');
    }
}

function handleFetchError(response) {
    if (response.status === 401) {
        redirectToLogin();
    } else {
        console.error('Fetch error:', response.statusText);
        showAlert('danger', 'Ошибка:', response.statusText);
    }
}

function redirectToLogin() {
    localStorage.removeItem('token');
    window.location.href = './authentication-login.html';
}

document.getElementById('changePasswordForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showAlert('danger', 'Ошибка:', 'Новые пароли не совпадают');
        return;
    }

    await changePassword(oldPassword, newPassword);
});

function showAlert(type, title, message) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.error('Alert container not found');
        return;
    }

    const alert = document.createElement('div');
    alert.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        <strong>${title}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            if (alert.parentElement) alert.parentElement.removeChild(alert);
        }, 150);
    }, 5000);
}

function clearAlerts() {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', function () {
    fetchUserProfile();
});
