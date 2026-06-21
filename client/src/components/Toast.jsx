import React, { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState({ message: "", show: false });
    const timeoutRef = useRef(null);

    const hideToast = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setToast((prev) => ({ ...prev, show: false }));
    }, []);

    const showToast = useCallback((message, duration = 3000) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Update the message and show state.
        // Because the toast is permanently mounted, the browser registers the transition from 
        // hidden state to active state, triggering the slide-in animation immediately!
        setToast({ message, show: true });

        // Auto-dismiss after duration
        timeoutRef.current = setTimeout(() => {
            hideToast();
        }, duration);
    }, [hideToast]);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div
                id="toast"
                className={`toast ${toast.show ? "show" : ""}`}
                role="alert"
                aria-live="polite"
            >
                <div className="toast-content-wrapper">
                    <span className="material-icons">info</span>
                    <span className="toast-message">{toast.message}</span>
                </div>
                <button 
                    className="toast-close-btn" 
                    onClick={hideToast} 
                    title="Закрити сповіщення"
                    aria-label="Закрити сповіщення"
                >
                    <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                </button>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
