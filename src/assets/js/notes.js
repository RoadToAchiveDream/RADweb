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

async function createNote() {
    try {
        const token = getToken();
        const settings = await loadSettings();

        const title = document.getElementById('inputNoteTitle').value;
        const content = document.getElementById('inputNoteDescription').value;

        const requestBody = { title, content };

        const response = await fetch(`${settings.apiBaseUrl}/notes`, {
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
            throw new Error(responseData.message || 'Failed to create note');
        }

        console.log('Note created successfully');
        showAlert('success', 'Успех:', responseData.message || 'Note created successfully');
        await getAllNotes(); // Refresh notes list
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

async function deleteNote(noteId) {
    try {
        const token = getToken();
        const settings = await loadSettings();

        const response = await fetch(`${settings.apiBaseUrl}/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            const responseData = await response.json();
            throw new Error(responseData.message || 'Failed to delete note');
        }

        console.log('Note deleted successfully');
        showAlert('success', 'Успех:', 'Note deleted successfully');
        await getAllNotes(); // Refresh notes list
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

async function getNoteById(noteId) {
    try {
        const token = getToken();
        const settings = await loadSettings();

        const response = await fetch(`${settings.apiBaseUrl}/notes/${noteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const responseData = await response.json();
            throw new Error(responseData.message || 'Failed to get note');
        }

        const note = await response.json();
        console.log('Note:', note.data);

        // Populate modal with note details
        document.getElementById('modalNoteTitle').textContent = note.data.title;
        document.getElementById('modalNoteDescription').textContent = note.data.content;

        // Show the modal
        const noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
        noteModal.show();
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}



async function getAllNotes(page = 1) {
    try {
        const token = getToken();
        const settings = await loadSettings();

        const response = await fetch(`${settings.apiBaseUrl}/notes?PageIndex=${page}&PageSize=20&OrderBy=id&OrderType=desc`, {
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

        const notes = await response.json();
        const paginationHeader = response.headers.get('x-pagination');

        if (!paginationHeader) {
            throw new Error('Pagination metadata missing in response');
        }

        const paginationMeta = JSON.parse(paginationHeader);

        displayNotes(notes.data);
        updatePagination(paginationMeta);
    } catch (error) {
        console.error('Error:', error.message);
        clearAlerts();
        showAlert('danger', 'Ошибка:', error.message);
    }
}

function displayNotes(notes) {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';

    if (!notes || notes.length === 0) {
        const alertItem = document.createElement('div');
        alertItem.className = 'alert alert-info';
        alertItem.role = 'alert';
        alertItem.innerHTML = 'Нет никаких заметок';
        notesList.appendChild(alertItem);
        return;
    }

    // Create a row to contain note items
    const row = document.createElement('div');
    row.className = 'row row-cols-1 row-cols-lg-3 g-3'; // Bootstrap grid classes

    notes.forEach(note => {
        // Create a column div for each note item
        const colDiv = document.createElement('div');
        colDiv.className = 'col'; // Each note item takes full width on small screens and 1/3 width on large screens

        // Create the note item card
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item card';
        noteItem.innerHTML = `
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Заметка</label>
                    <input type="text" class="form-control" value="${note.title}" disabled>
                </div>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-secondary ti ti-eye" onclick="getNoteById(${note.id})"></button>
                    <button class="btn btn-danger ti ti-trash" onclick="deleteNote(${note.id})"></button>
                </div>
            </div>
        `;

        // Append the note item to the column div
        colDiv.appendChild(noteItem);

        // Append the column div to the row
        row.appendChild(colDiv);
    });

    // Append the row to the notesList
    notesList.appendChild(row);
}

function updatePagination(paginationMeta) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    if (!paginationMeta || !paginationMeta.TotalPages) {
        console.error('Pagination metadata is missing or incomplete.');
        return;
    }

    const currentPage = paginationMeta.CurrentPage || 1;
    const totalPages = paginationMeta.TotalPages;
    const maxVisiblePages = 3; // Maximum number of page links to display

    const prevButton = createPaginationButton('ti ti-arrow-big-left-line', currentPage > 1, currentPage - 1);
    paginationContainer.appendChild(prevButton);

    if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = createPaginationButton(null, true, i, currentPage === i);
            paginationContainer.appendChild(pageButton);
        }
    } else {
        let startPage, endPage;
        if (currentPage <= Math.floor(maxVisiblePages / 2)) {
            startPage = 1;
            endPage = maxVisiblePages;
        } else if (currentPage + Math.floor(maxVisiblePages / 2) >= totalPages) {
            startPage = totalPages - maxVisiblePages + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - Math.floor(maxVisiblePages / 2);
            endPage = currentPage + Math.floor(maxVisiblePages / 2);
        }

        if (startPage > 1) {
            const firstPageButton = createPaginationButton(null, true, 1, currentPage === 1);
            paginationContainer.appendChild(firstPageButton);

            const ellipsis = document.createElement('div');
            ellipsis.className = 'page-item disabled';
            ellipsis.innerHTML = '<a class="page-link btn btn-light m-1">...</a>';
            paginationContainer.appendChild(ellipsis);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = createPaginationButton(null, true, i, currentPage === i);
            paginationContainer.appendChild(pageButton);
        }

        if (endPage < totalPages) {
            const ellipsis = document.createElement('div');
            ellipsis.className = 'page-item disabled';
            ellipsis.innerHTML = '<a class="page-link btn btn-light m-1">...</a>';
            paginationContainer.appendChild(ellipsis);

            const lastPageButton = createPaginationButton(null, true, totalPages, currentPage === totalPages);
            paginationContainer.appendChild(lastPageButton);
        }
    }

    const nextButton = createPaginationButton('ti ti-arrow-big-right-line', currentPage < totalPages, currentPage + 1);
    paginationContainer.appendChild(nextButton);
}

function createPaginationButton(iconClass, isEnabled, page, isActive = false) {
    const li = document.createElement('div');
    li.className = 'page-item m-1' + (isActive ? ' active' : '') + (isEnabled ? '' : ' disabled');

    const a = document.createElement('a');
    a.className = 'page-link btn btn-light';
    a.href = '#';

    if (iconClass) {
        const icon = document.createElement('i');
        icon.className = iconClass;

        if (iconClass !== 'ti ti-arrow-big-left-line' && iconClass !== 'ti ti-arrow-big-right-line') {
            a.textContent = page;
            a.prepend(icon);
        } else {
            a.appendChild(icon);
        }
    } else {
        a.textContent = page; // Set the page number as text content of the anchor
    }

    if (isActive) {
        a.className = 'page-link btn';
    }

    if (isEnabled) {
        a.onclick = () => {
            getAllNotes(page);
        };
    } else {
        a.onclick = (event) => {
            event.preventDefault();
        };
    }

    li.appendChild(a);
    return li;
}



document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createNoteForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await createNote();
    });

    getAllNotes();
});
