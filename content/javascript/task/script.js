// Toggle mode. Dark and Light

document.addEventListener("DOMContentLoaded", function () {
    const userPreferredMode = localStorage.getItem("preferred-mode");

    function setMode(mode) {
        if (mode === "dark") {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    }

    function toggleMode() {
        if (document.body.classList.contains("dark-mode")) {
            setMode("light");
            localStorage.setItem("preferred-mode", "light");
        } else {
            setMode("dark");
            localStorage.setItem("preferred-mode", "dark");
        }
    }

    if (userPreferredMode) {
        setMode(userPreferredMode);
    }

    const modeToggle = document.getElementById("mode-toggle");
    modeToggle.addEventListener("click", toggleMode);
});


/////////////////////////////////////////////

const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

function addTask() {
    if (inputBox.value === '') {
        alert("You shudnn't leave input empty!");
    }

    else {
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;
        listContainer.appendChild(li);
        let deleteButton = document.createElement("button");
        deleteButton.innerHTML = "\u00d7";
        li.appendChild(deleteButton);
    }
    inputBox.value = "";
    saveData();
}
listContainer.addEventListener("click", function (e) {
    if (e.target.tagName === "LI") {
        e.target.classList.toggle("checked");
        saveData()
    }
    else if (e.target.tagName === "BUTTON") {
        e.target.parentElement.remove();
        saveData()
    }
}, false);

function saveData() {
    localStorage.setItem("data", listContainer.innerHTML);
}
function showTask() {
    listContainer.innerHTML = localStorage.getItem("data");
}
showTask();