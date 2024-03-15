
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


// Login 

document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("form");
    const EmailandUsername = document.getElementById("email_username");
    const Password = document.getElementById("password");
    const errorHandler = document.getElementById("error");

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let messages = [];

        if (EmailandUsername.value === '' || EmailandUsername.value === null) {
            messages.push('Username is required!');
        }

        if (Password.value.length <= 6) {
            messages.push('Password must be more than 6 characters!');
        }

        if (Password.value.length >= 20) {
            messages.push('Password must be less than 20 characters!');
        }

        if (Password.value === 'password') {
            messages.push('Password cannot be "password".');
        }

        if (messages.length > 0) {
            errorHandler.innerText = messages.join(', ');
        } else {
            console.log("EmailandUsername.value:", EmailandUsername.value);
            console.log("Password.value:", Password.value);
            try {
                const response = await fetch("httpS://radserver.onrender.com/users");

                if (!response.ok) {
                    throw new Error(`HTTP error. status: ${response.status}`);
                }

                const userData = await response.json();

                const userExists = userData.some(user => user.EmailUsername === EmailandUsername.value && user.Password === Password.value);

                if (userExists) {
                    errorHandler.innerText = ("Successfully logged in.")
                    console.log("Account found, you can enter!");
                } else {
                    errorHandler.innerText = ("No matching account found.")
                    console.log("No account found.");
                }
            } catch (error) {
                console.log("Error: ", error);
            }
        }
    });
});
