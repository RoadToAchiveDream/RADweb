document.addEventListener('DOMContentLoaded', function () {

    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', function () {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('token');
            window.location.href = './authentication-login.html';
        }
    });
});
