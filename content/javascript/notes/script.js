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

const notesContainer = document.querySelector(".notes-container");
const createBtn = document.querySelector(".btn");
let notes = document.querySelectorAll(".input-box");

function showNotes() {
    notesContainer.innerHTML = localStorage.getItem(".notes");
}
showNotes();

function saveNotes() {
    localStorage.setItem(".notes", notesContainer.innerHTML);
}

createBtn.addEventListener("click", ()=> {
    let inputBox = document.createElement("p");
    let img = document.createElement("img");
    inputBox.className = "input-box";
    inputBox.setAttribute("contenteditable", "true");
    img.src = "assets/images/notes/delete.png";
    notesContainer.appendChild(inputBox).appendChild(img);
})

notesContainer.addEventListener("click", function(e){
    if (e.target.tagName === "IMG") {
        e.target.parentElement.remove();
        saveNotes();
    }

    else if (e.target.tagName === "P") {
        notes = document.querySelectorAll(".input-box");
        notes.forEach(nt => {
            nt.onkeyup = function() {
                saveNotes();
            }
        })
    }
})   

document.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        document.execCommand("InsertLineBreak");
        event.preventDefault();
        
    }
})