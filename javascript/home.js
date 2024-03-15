
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
