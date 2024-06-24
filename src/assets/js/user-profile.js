function getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        throw new Error('Токен не найден');
    }
    if (isTokenExpired(token)) {
        redirectToLogin();
        throw new Error('Токен посрочен');
    }
    return token;
}

function isTokenExpired(token) {
    try {
        const decodedToken = parseJwt(token);
        const currentTime = Math.floor(Date.now() / 1000);
        return decodedToken.exp < currentTime;
    } catch (error) {
        console.error('Не удалось анализировать токен:', error.message);
        return true;
    }
}

async function loadSettings() {
    try {
        const response = await fetch('../settings.json');
        if (!response.ok) throw new Error('Не удалось загрузить settings.json');
        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузки settings.json', error.message);
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
        console.error('JWT parsing error', error.message);
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
            const responseData = await response.json();
            throw new Error(responseData.message);
        }

        const userProfile = await response.json();
        populateUserProfile(userProfile.data);
        setUpFormListeners(userData.id);
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
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
            const responseData = await response.json();
            throw new Error(responseData.message);
        }

        console.log('Аккаун успешно удален');
        localStorage.removeItem('token');
        redirectToLogin();
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

async function changePassword(oldPassword, newPassword) {
    try {
        const token = getToken();
        const userData = parseJwt(token);
        const settings = await loadSettings();

        const userResponse = await fetch(`${settings.apiBaseUrl}/users/${userData.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!userResponse.ok) {
            const userProfile = await userResponse.json();
            throw new Error(userProfile.message);
        }

        const userProfile = await userResponse.json();
        const phoneNumber = encodeURIComponent(userProfile.data.phoneNumber);
        const requestBody = {
            phoneNumber: phoneNumber,
            oldPassword: oldPassword,
            newPassword: newPassword
        };

        const changePasswordUrl = `${settings.apiBaseUrl}/users/change-password?PhoneNumber=${phoneNumber}&OldPassword=${encodeURIComponent(oldPassword)}&NewPassword=${encodeURIComponent(newPassword)}`;

        const response = await fetch(changePasswordUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message);
        }

        console.log('Пароль успешно обновлен');
        localStorage.removeItem('token');
        clearAlerts();
        showAlert('success', 'Успех:', responseData.message);
        $('#changePasswordModal').modal('hide');
        redirectToLogin();
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
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

        var responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message);
        }

        console.log('Данные пользователя успешно обновлены');
        clearAlerts();
        showAlert('success', 'Успех:', responseData.message);
        $('#editUserModal').modal('hide');

        await fetchUserProfile();
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
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
