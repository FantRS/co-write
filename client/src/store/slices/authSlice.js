import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "co-write:auth";

function loadAuth() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
}

const saved = loadAuth();

const initialState = {
    token: saved?.token ?? null,
    username: saved?.username ?? null,
    userId: saved?.userId ?? null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuth: (state, action) => {
            const { token, username, user_id } = action.payload;
            state.token = token;
            state.username = username;
            state.userId = user_id;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, username, userId: user_id }));
        },
        clearAuth: (state) => {
            state.token = null;
            state.username = null;
            state.userId = null;
            localStorage.removeItem(STORAGE_KEY);
        },
    },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
