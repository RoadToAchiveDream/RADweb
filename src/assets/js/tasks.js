async function getToken() {
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
        return true;
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

function handleFetchError(response) {
    console.error('Fetch error:', response.statusText);
    if (response.status === 401) {
        redirectToLogin();
    } else {
        handleError(new Error(response.statusText), 'Fetch error');
    }
}

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

async function createTask() {
    try {
        const token = await getToken();
        const settings = await loadSettings();

        const title = document.getElementById('inputTaskTitle').value;
        const description = document.getElementById('inputTaskDescription').value;

        const requestBody = { title, description };

        const response = await fetch(`${settings.apiBaseUrl}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json-patch+json',
                'Accept': '*/*'
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Failed to create task');
        }

        console.log('Task created successfully');
        showAlert('success', 'Успех:', responseData.message || 'Task created successfully');
        await getAllTasks();
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

async function deleteTask(taskId) {
    try {
        const token = await getToken();
        const settings = await loadSettings();

        const response = await fetch(`${settings.apiBaseUrl}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            const responseData = await response.json();
            throw new Error(responseData.message || 'Failed to delete task');
        }

        console.log('Task deleted successfully');
        showAlert('success', 'Успех:', 'Task deleted successfully');
        await getAllTasks();
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

async function getTaskById(taskId) {
    try {
        const token = await getToken();
        const settings = await loadSettings();

        const response = await fetch(`${settings.apiBaseUrl}/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            const responseData = await response.json();
            throw new Error(responseData.message || 'Failed to get task');
        }

        const task = await response.json();
        console.log('Task:', task.data);
        // Display task details in the UI
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

async function getAllTasks() {
    try {
        const token = await getToken();
        const settings = await loadSettings();

        const response = await fetch(`${settings.apiBaseUrl}/tasks?PageIndex=1&PageSize=20&OrderBy=id&OrderType=desc`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            const responseData = await response.json();
            throw new Error(responseData.message || 'Failed to get tasks');
        }

        const tasks = await response.json();
        displayTasks(tasks.data);
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

function displayTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        const alertItem = document.createElement('div');
        alertItem.className = 'alert alert-info';
        alertItem.setAttribute('role', 'alert');
        alertItem.textContent = 'Нет никаких задач';
        tasksList.appendChild(alertItem);
        return;
    }

    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item card';
        taskItem.innerHTML = `
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Задача</label>
                    <input type="text" class="form-control" value="${task.title}" disabled>
                </div>
                <div class="mb-3">
                    <label class="form-label">Описание</label>
                    <input type="text" class="form-control" value="${task.description}" disabled>
                </div>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-info" onclick="getTaskById(${task.id})">Просмотр</button>
                    <button class="btn btn-danger" onclick="deleteTask(${task.id})">Удалить</button>
                </div>
            </div>
        `;
        tasksList.appendChild(taskItem);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createTaskForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await createTask();
    });

    getAllTasks();
});
