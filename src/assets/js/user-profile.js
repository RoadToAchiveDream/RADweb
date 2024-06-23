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

async function fetchUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token not found');
        window.location.href = './authentication-login.html';
        return;
    }

    try {
        const userData = parseJwt(token);
        console.log('User Profile Data:', userData);

        document.getElementById('userFirstname').value = userData.firstname;
        document.getElementById('userLastname').value = userData.lastname;
        document.getElementById('userEmail').value = userData.email;
        document.getElementById('userPhone').value = userData.phone_number;

        document.getElementById('deleteAccountForm').addEventListener('submit', function (event) {
            event.preventDefault();
            deleteUser(userData.id);
        });
    } catch (error) {
        console.error('Error parsing JWT or updating UI:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

async function deleteUser(userId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token not found');
            window.location.href = './authentication-login.html';
            return;
        }

        const settings = await loadSettings();
        const deleteUrl = `${settings.apiBaseUrl}/users/${userId}`;

        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (response.status === 401) {
            throw new Error('Unauthorized access');
        }

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        console.log('User deleted successfully');
        localStorage.removeItem('token');
        window.location.href = './authentication-login.html';
    } catch (error) {
        console.error('Error deleting user:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

async function changePassword(oldPassword, newPassword) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token not found');
            window.location.href = './authentication-login.html';
            return;
        }

        const userData = parseJwt(token);
        const phoneNumber = userData.phone_number;

        const settings = await loadSettings();
        const changePasswordUrl = `${settings.apiBaseUrl}/users/change-password?PhoneNumber=${encodeURIComponent(phoneNumber)}&OldPassword=${encodeURIComponent(oldPassword)}&NewPassword=${encodeURIComponent(newPassword)}`;

        const response = await fetch(changePasswordUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (response.status === 401) {
            throw new Error('Unauthorized access');
        }

        if (!response.ok) {
            throw new Error('Failed to change password');
        }

        clearAlerts();
        console.log('Password changed successfully');
        localStorage.removeItem('token');
        showAlert('success', 'Успех:', 'Пароль изменен успешно');
        $('#changePasswordModal').modal('hide');
    } catch (error) {
        console.error('Error changing password:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

document.getElementById('changePasswordForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        clearAlerts();
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
}

function clearAlerts() {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', function () {
    fetchUserProfile();
});