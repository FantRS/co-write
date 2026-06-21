import { createSlice } from "@reduxjs/toolkit";

const DEFAULT_FILES = {
    "src/main.rs": `fn main() {\n    println!("Hello, world!");\n}`
};

const initialState = {
    docTitle: "Завантаження...",
    connectionStatus: "connecting", // 'connecting' | 'connected' | 'disconnected' | 'error'
    syncStatus: "Синхронізація...",
    wordStats: "0 сл. | 0 симв.",
    consoleOutput: "",
    consoleVisible: false,
    isRunning: false,
    // Список відкритих вкладок (незалежний від файлової системи)
    openTabs: ["src/main.rs"],
    // Розібрані помилки/попередження після збірки
    diagnostics: [], // [{ type, code, message, file, line, col }]
    // Учасники сесії
    collaborators: [], // [{ connId, userId, username, role, color, cursor, isMe }]
    myRole: null,
    myConnId: null,
    // Файловий проект
    files: {},
    activeFile: "src/main.rs",
    // Git статуси файлів (потребує backend endpoint)
    gitStatus: {}, // { "src/main.rs": "M" }
};

const collabSlice = createSlice({
    name: "collab",
    initialState,
    reducers: {
        setDocTitle: (state, action) => {
            state.docTitle = action.payload || "Без назви";
        },
        setConnectionStatus: (state, action) => {
            state.connectionStatus = action.payload;
        },
        setSyncStatus: (state, action) => {
            state.syncStatus = action.payload;
        },
        setWordStats: (state, action) => {
            state.wordStats = action.payload;
        },
        setConsoleOutput: (state, action) => {
            state.consoleOutput = action.payload;
        },
        appendConsoleOutput: (state, action) => {
            state.consoleOutput += action.payload;
        },
        setConsoleVisible: (state, action) => {
            state.consoleVisible = action.payload;
        },
        setIsRunning: (state, action) => {
            state.isRunning = action.payload;
        },
        // ── Діагностика ──────────────────────────────────────────────────────────
        setDiagnostics: (state, action) => {
            state.diagnostics = action.payload;
        },
        // ── Вкладки ──────────────────────────────────────────────────────────────
        /** Відкриває файл у новій вкладці (або перемикається на існуючу). */
        openTab: (state, action) => {
            const path = action.payload;
            if (!path) return;
            if (!state.openTabs.includes(path)) {
                state.openTabs.push(path);
            }
            state.activeFile = path;
        },
        /** Закриває вкладку і перемикається на сусідню. */
        closeTab: (state, action) => {
            const path = action.payload;
            const idx = state.openTabs.indexOf(path);
            if (idx === -1) return;
            state.openTabs = state.openTabs.filter(p => p !== path);
            if (state.activeFile === path) {
                // Перемикаємось на попередню або першу доступну
                state.activeFile = state.openTabs[Math.max(0, idx - 1)] ?? null;
            }
        },
        // ── Файлова система ──────────────────────────────────────────────────────
        upsertFile: (state, action) => {
            const { path, content } = action.payload;
            state.files[path] = content;
        },
        deleteFile: (state, action) => {
            const path = action.payload;
            delete state.files[path];
            // Закрити вкладку якщо відкрита
            const idx = state.openTabs.indexOf(path);
            if (idx !== -1) {
                state.openTabs = state.openTabs.filter(p => p !== path);
                if (state.activeFile === path) {
                    state.activeFile = state.openTabs[Math.max(0, idx - 1)] ?? state.openTabs[0] ?? null;
                }
            }
        },
        renameFile: (state, action) => {
            const { oldPath, newPath } = action.payload;
            const content = state.files[oldPath] ?? "";
            delete state.files[oldPath];
            state.files[newPath] = content;
            // Оновити вкладки
            const tabIdx = state.openTabs.indexOf(oldPath);
            if (tabIdx !== -1) {
                state.openTabs[tabIdx] = newPath;
            }
            if (state.activeFile === oldPath) {
                state.activeFile = newPath;
            }
        },
        setFiles: (state, action) => {
            state.files = action.payload;
            // Ініціалізувати openTabs якщо порожні
            if (state.openTabs.length === 0) {
                const keys = Object.keys(action.payload)
                    .filter(k => !k.endsWith('/') && !k.endsWith('.gitkeep'));
                if (keys.length > 0) {
                    state.openTabs = [keys[0]];
                    state.activeFile = keys[0];
                }
            } else {
                // Відфільтрувати вкладки що більше не існують
                state.openTabs = state.openTabs.filter(p => action.payload[p] !== undefined);
                if (!state.openTabs.includes(state.activeFile)) {
                    state.activeFile = state.openTabs[0] ?? null;
                }
            }
        },
        setActiveFile: (state, action) => {
            const path = action.payload;
            state.activeFile = path;
            // Автоматично відкриваємо вкладку
            if (path && !state.openTabs.includes(path)) {
                state.openTabs.push(path);
            }
        },
        updateActiveFileContent: (state, action) => {
            if (state.activeFile) {
                state.files[state.activeFile] = action.payload;
            }
        },
        resetCollabState: (state) => {
            state.docTitle = "Завантаження...";
            state.connectionStatus = "connecting";
            state.syncStatus = "Синхронізація...";
            state.wordStats = "0 сл. | 0 симв.";
            state.consoleOutput = "";
            state.consoleVisible = false;
            state.isRunning = false;
            state.openTabs = ["src/main.rs"];
            state.diagnostics = [];
            state.collaborators = [];
            state.myRole = null;
            state.myConnId = null;
            state.gitStatus = {};
        },
        // ── Колаборанти ──────────────────────────────────────────────────────────
        setCollaborators: (state, action) => {
            const { participants, myConnId, myUsername } = action.payload;
            const COLORS = [
                "#bd93f9", "#50fa7b", "#ffb86c", "#ff79c6",
                "#8be9fd", "#f1fa8c", "#ff5555", "#6272a4"
            ];
            // Зберігаємо існуючі позиції курсорів
            const existingCursors = Object.fromEntries(
                state.collaborators.map(c => [c.connId, c.cursor])
            );
            state.collaborators = participants.map((p, i) => ({
                connId: p.conn_id,
                userId: p.user_id,
                username: p.username,
                role: p.role,
                color: COLORS[i % COLORS.length],
                isMe: p.conn_id === myConnId,
                cursor: existingCursors[p.conn_id] ?? null,
            }));
            if (myConnId) {
                state.myConnId = myConnId;
                const me = participants.find(p => p.conn_id === myConnId);
                if (me) state.myRole = me.role;
            } else if (myUsername) {
                const me = participants.find(p => p.username === myUsername);
                if (me) {
                    state.myRole = me.role;
                    state.myConnId = me.conn_id;
                }
            }
        },
        /** Оновлює позицію курсора конкретного колаборанта. */
        updateCollaboratorCursor: (state, action) => {
            const { connId, path, position } = action.payload;
            const collab = state.collaborators.find(c => c.connId === connId);
            if (collab) {
                collab.cursor = { path, position };
            }
        },
        setMyRole: (state, action) => {
            state.myRole = action.payload;
        },
        setMyConnId: (state, action) => {
            state.myConnId = action.payload;
        },
        setGitStatus: (state, action) => {
            state.gitStatus = action.payload;
        },
    }
});

export const {
    setDocTitle,
    setConnectionStatus,
    setSyncStatus,
    setWordStats,
    setConsoleOutput,
    appendConsoleOutput,
    setConsoleVisible,
    setIsRunning,
    setDiagnostics,
    openTab,
    closeTab,
    upsertFile,
    deleteFile,
    renameFile,
    setFiles,
    setActiveFile,
    updateActiveFileContent,
    resetCollabState,
    setCollaborators,
    updateCollaboratorCursor,
    setMyRole,
    setMyConnId,
    setGitStatus,
} = collabSlice.actions;

export default collabSlice.reducer;
