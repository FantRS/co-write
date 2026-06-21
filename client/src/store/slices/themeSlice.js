import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("cowrite-theme");
    if (savedTheme) {
        return savedTheme === "dark";
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const themeSlice = createSlice({
    name: "theme",
    initialState: {
        isDark: getInitialTheme(),
    },
    reducers: {
        toggleTheme: (state) => {
            state.isDark = !state.isDark;
            const theme = state.isDark ? "dark" : "light";
            document.documentElement.dataset.theme = theme;
            localStorage.setItem("cowrite-theme", theme);
        },
        setTheme: (state, action) => {
            state.isDark = action.payload;
            const theme = state.isDark ? "dark" : "light";
            document.documentElement.dataset.theme = theme;
            localStorage.setItem("cowrite-theme", theme);
        }
    }
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
