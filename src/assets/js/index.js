function getToken() {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
        redirectToLogin();
        throw new Error('Токен не найден или истек');
    }
    return token;
}

function isTokenExpired(token) {
    try {
        const decodedToken = parseJwt(token);
        const currentTime = Math.floor(Date.now() / 1000);
        return decodedToken.exp < currentTime;
    } catch (error) {
        console.error('Error parsing token:', error.message);
        return true; // Treat token as expired if there's an error
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

function redirectToLogin() {
    localStorage.removeItem('token');
    window.location.href = './authentication-login.html';
}

function handleError(error, message) {
    console.error(message, error);
    clearAlerts();
    showAlert('danger', 'Ошибка:', message);
}

getToken();