const html = document.documentElement;
const themeToggle = document.getElementById("toggleTheme");
const themeIcon = themeToggle.querySelector(".material-icons");

function updateThemeIcon(isDark) {
    themeIcon.textContent = isDark ? "light_mode" : "dark_mode";
}

function setTheme(isDark) {
    html.dataset.theme = isDark ? "dark" : "light";
    updateThemeIcon(isDark);
}

// Check system theme preference
if (window.matchMedia) {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(darkModeQuery.matches);
    darkModeQuery.addEventListener("change", (e) => setTheme(e.matches));
}

// Theme toggle button
themeToggle.addEventListener("click", () => {
    const isDark = html.dataset.theme === "light";
    setTheme(isDark);
});
