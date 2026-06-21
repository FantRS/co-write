import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Lobby } from "./pages/Lobby.jsx";
import { EditorWorkspace } from "./pages/EditorWorkspace.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import "./styles/main.css";

/** Захищений маршрут — якщо токена немає, редиректить на /login */
function ProtectedRoute({ children }) {
    const token = useSelector((state) => state.auth.token);
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

export function App() {
    // Hardcode Dark Theme permanently on application boot
    useEffect(() => {
        document.documentElement.dataset.theme = "dark";
        localStorage.setItem("cowrite-theme", "dark");
    }, []);

    return (
        <ToastProvider>
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <Routes>
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
                    <Route path="/editor" element={<ProtectedRoute><EditorWorkspace isDark={true} /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </ToastProvider>
    );
}
