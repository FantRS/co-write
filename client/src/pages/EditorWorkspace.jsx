import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useCollabEditor } from "../hooks/useCollabEditor.js";
import { useToast } from "../components/Toast.jsx";
import { FileExplorer } from "../components/FileExplorer.jsx";
import { FileTabs } from "../components/FileTabs.jsx";
import { CollaboratorsPanel } from "../components/CollaboratorsPanel.jsx";
import { Breadcrumb } from "../components/Breadcrumb.jsx";
import { OutlinePanel } from "../components/OutlinePanel.jsx";
import { ProblemsPanel } from "../components/ProblemsPanel.jsx";
import { Minimap } from "../components/Minimap.jsx";
import { closeTab, setConsoleVisible } from "../store/slices/collabSlice.js";
import { ansiToHtml } from "../utils/ansiToHtml.js";
import { getExportEndpoint } from "../configs/paths.js";

const ACTIVITY_TABS = [
    { id: "explorer",      icon: "folder_open", label: "Провідник" },
    { id: "outline",       icon: "view_list",   label: "Структура" },
    { id: "control",       icon: "terminal",    label: "Команди" },
    { id: "collaborators", icon: "group",       label: "Колаборанти" },
];

const LS_SIDEBAR_W  = "co-write:sidebar-width";
const LS_CONSOLE_H  = "co-write:console-height";
const LS_MINIMAP    = "co-write:minimap";

export function EditorWorkspace({ isDark }) {
    const navigate       = useNavigate();
    const [searchParams] = useSearchParams();
    const showToast      = useToast();
    const dispatch       = useDispatch();
    const documentId     = searchParams.get("id");

    const token      = useSelector((s) => s.auth.token);
    const activeFile = useSelector((s) => s.collab.activeFile);
    const diagnostics = useSelector((s) => s.collab.diagnostics);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [activeTab,         setActiveTab]         = useState("explorer");
    const [shortcutsOpen,     setShortcutsOpen]     = useState(false);
    const [consoleTab,        setConsoleTab]         = useState("output");  // "output" | "problems"
    const [minimapVisible,    setMinimapVisible]     = useState(
        () => localStorage.getItem(LS_MINIMAP) !== "false"
    );
    const [sidebarWidth,      setSidebarWidth]       = useState(
        () => parseInt(localStorage.getItem(LS_SIDEBAR_W)) || 260
    );
    const [consoleHeight,     setConsoleHeight]      = useState(
        () => parseInt(localStorage.getItem(LS_CONSOLE_H)) || 240
    );

    const sidebarWidthRef  = useRef(sidebarWidth);
    const consoleHeightRef = useRef(consoleHeight);
    useEffect(() => { sidebarWidthRef.current  = sidebarWidth; },  [sidebarWidth]);
    useEffect(() => { consoleHeightRef.current = consoleHeight; }, [consoleHeight]);

    // ── Editor hook ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!documentId) {
            showToast("Документ не знайдено", 3000);
            setTimeout(() => navigate("/"), 3000);
        }
    }, [documentId, navigate, showToast]);

    const {
        editorRef,
        cmViewRef,
        docTitle,
        connectionStatus,
        syncStatus,
        wordStats,
        consoleOutput,
        consoleVisible,
        setConsoleVisible: setConsoleVisibleCb,
        isRunning,
        runCode,
        runTests,
        formatCode,
        clearConsole,
        sendFsEvent,
        sendRoleChange,
    } = useCollabEditor(documentId, isDark);

    // ── Авто-перемикання на Problems після збірки з помилками ─────────────────
    useEffect(() => {
        if (!isRunning && diagnostics.length > 0) {
            setConsoleTab("problems");
        }
    }, [isRunning]);

    // ── Persist minimap ────────────────────────────────────────────────────────
    useEffect(() => {
        localStorage.setItem(LS_MINIMAP, String(minimapVisible));
    }, [minimapVisible]);

    // ── Global keyboard shortcuts ─────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            // Ігноруємо якщо CM editor в фокусі (він обробляє сам)
            const inCm = document.activeElement?.closest(".cm-editor");

            // Ctrl+` — toggle console
            if (e.ctrlKey && e.key === "`") {
                e.preventDefault();
                dispatch(setConsoleVisible(!consoleVisible));
                return;
            }

            // Ctrl+W (якщо CM не в фокусі — CM обробляє через keymap)
            if (!inCm && e.ctrlKey && e.key === "w") {
                e.preventDefault();
                if (activeFile) dispatch(closeTab(activeFile));
                return;
            }

        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [consoleVisible, activeFile, dispatch]);

    // ── Resizable sidebar ─────────────────────────────────────────────────────
    const onSidebarResizeStart = useCallback((e) => {
        const startX = e.clientX;
        const startW = sidebarWidthRef.current;
        document.body.classList.add("resizing-h");

        const onMove = (e) => setSidebarWidth(
            Math.max(180, Math.min(520, startW + e.clientX - startX))
        );
        const onUp = () => {
            document.body.classList.remove("resizing-h");
            localStorage.setItem(LS_SIDEBAR_W, String(sidebarWidthRef.current));
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup",   onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup",   onUp);
    }, []);

    // ── Resizable console ─────────────────────────────────────────────────────
    const onConsoleResizeStart = useCallback((e) => {
        const startY = e.clientY;
        const startH = consoleHeightRef.current;
        document.body.classList.add("resizing-v");

        const onMove = (e) => setConsoleHeight(
            Math.max(100, Math.min(520, startH - (e.clientY - startY)))
        );
        const onUp = () => {
            document.body.classList.remove("resizing-v");
            localStorage.setItem(LS_CONSOLE_H, String(consoleHeightRef.current));
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup",   onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup",   onUp);
    }, []);

    // ── Export ────────────────────────────────────────────────────────────────
    const handleExport = async () => {
        if (!token) return;
        try {
            const res = await fetch(getExportEndpoint(documentId), {
                method:  "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { showToast("Помилка експорту"); return; }
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `${docTitle || "project"}.tar.xz`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Архів завантажено!");
        } catch {
            showToast("Помилка підключення при експорті");
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard
            .writeText(window.location.href)
            .then(() => showToast("Посилання скопійовано"))
            .catch(() => showToast("Помилка копіювання посилання"));
    };

    // ── Diagnostics counts ────────────────────────────────────────────────────
    const errorCount   = diagnostics.filter(d => d.type === "error").length;
    const warningCount = diagnostics.filter(d => d.type === "warning").length;

    // ── ANSI console output ───────────────────────────────────────────────────
    const consoleHtml = consoleOutput ? ansiToHtml(consoleOutput) : "";

    if (!documentId) return (
        <div className="ed-loading">
            <div className="ed-loading-spinner" />
            <p className="ed-loading-text">завантаження документа...</p>
        </div>
    );

    return (
        <div
            className="workspace-wrapper"
            style={{ "--sidebar-width": `${sidebarWidth}px` }}
        >
            {/* ─── Aurora background ─────────────────────────────────────── */}
            <div className="ed-aurora" aria-hidden="true">
                <div className="ed-orb ed-orb--1" />
                <div className="ed-orb ed-orb--2" />
                <div className="ed-grid" />
            </div>

            {/* ─── Activity Bar ──────────────────────────────────────────── */}
            <nav className="activity-bar">
                {ACTIVITY_TABS.map(tab => (
                    <button
                        key={tab.id}
                        id={`activity-${tab.id}`}
                        className={`activity-tab ${activeTab === tab.id ? "active" : ""}`}
                        title={tab.label}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="material-icons">{tab.icon}</span>
                    </button>
                ))}
                <div className="activity-bar-spacer" />
                <button
                    id="activity-home"
                    className="activity-tab"
                    title="На головну"
                    onClick={() => navigate("/")}
                >
                    <span className="material-icons">home</span>
                </button>
            </nav>

            {/* ─── Sidebar ───────────────────────────────────────────────── */}
            <aside className="sidebar">
                    <div className="sidebar-header">
                        <span className="sidebar-proj-label">проект</span>
                        <h2 id="documentTitle" className="sidebar-proj-title">{docTitle}</h2>
                    </div>

                    {activeTab === "explorer" && (
                        <div className="ed-panel-anim">
                            <FileExplorer onFilesChange={sendFsEvent} />
                        </div>
                    )}

                    {activeTab === "outline" && (
                        <div className="ed-panel-anim" style={{ flex: 1, overflow: "hidden auto", display: "flex", flexDirection: "column" }}>
                            <OutlinePanel cmViewRef={cmViewRef} />
                        </div>
                    )}

                    {activeTab === "control" && (
                        <div className="sidebar-menu ed-panel-anim">
                            <p className="ed-section-comment">{"// виконання"}</p>
                            <div className="action-buttons">
                                <div className="run-buttons-row">
                                    <button id="runCode" className="btn success" onClick={runCode} disabled={isRunning}>
                                        <span className="ed-dollar">{isRunning ? "›" : "$"}</span>
                                        <span>{isRunning ? "running…" : "cargo run"}</span>
                                    </button>
                                    <button id="runTests" className="btn info" onClick={runTests} disabled={isRunning}>
                                        <span className="ed-dollar">$</span>
                                        <span>cargo test</span>
                                    </button>
                                </div>
                                <p className="ed-section-comment">{"// утиліти"}</p>
                                <button id="formatCode" className="btn" onClick={formatCode} disabled={isRunning}>
                                    <span className="ed-dollar">$</span>
                                    <span>rustfmt .</span>
                                </button>
                                <button id="exportProject" className="btn" onClick={handleExport}>
                                    <span className="ed-dollar">↓</span>
                                    <span>export .tar.xz</span>
                                </button>
                                <button id="copyLink" className="btn" onClick={handleCopyLink}>
                                    <span className="ed-dollar">@</span>
                                    <span>share link</span>
                                </button>
                                <button id="showShortcuts" className="btn" onClick={() => setShortcutsOpen(true)}>
                                    <span className="ed-dollar">?</span>
                                    <span>hotkeys</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "collaborators" && (
                        <div className="ed-panel-anim" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                            <CollaboratorsPanel
                                docId={documentId}
                                onChangeRole={(connId, newRole) => sendRoleChange(connId, newRole)}
                            />
                        </div>
                    )}

                    {/* Resize handle */}
                    <div className="ed-resize-x" onMouseDown={onSidebarResizeStart} />
                </aside>

            {/* ─── Main Editor ───────────────────────────────────────────── */}
            <main className="editor-main">

                {/* File tabs */}
                <FileTabs />

                {/* Breadcrumb */}
                <Breadcrumb path={activeFile} />

                {/* Editor area */}
                <div className="editor-workspace">
                    <div className="editor-pane">
                        <div ref={editorRef} style={{ flex: 1, overflow: "hidden", minWidth: 0 }} />
                        {minimapVisible && <Minimap cmViewRef={cmViewRef} />}
                    </div>
                </div>

                {/* Console panel */}
                {consoleVisible && (
                    <div className="console-panel" id="consolePanel" style={{ height: consoleHeight }}>

                        {/* Resize handle at top */}
                        <div className="ed-resize-y" onMouseDown={onConsoleResizeStart} />

                        <div className="console-header">
                            <div className="console-tabs">
                                <button
                                    className={`console-tab ${consoleTab === "output" ? "active" : ""}`}
                                    onClick={() => setConsoleTab("output")}
                                >
                                    <span className="material-icons">terminal</span>
                                    <span>вивід</span>
                                </button>
                                <button
                                    className={`console-tab ${consoleTab === "problems" ? "active" : ""}`}
                                    onClick={() => setConsoleTab("problems")}
                                >
                                    <span className="material-icons">
                                        {errorCount > 0 ? "error_outline" : "warning_amber"}
                                    </span>
                                    <span>проблеми</span>
                                    {(errorCount + warningCount) > 0 && (
                                        <span className={`console-tab-badge ${errorCount > 0 ? "badge--error" : "badge--warning"}`}>
                                            {errorCount + warningCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                            <div className="console-actions">
                                <button className="console-btn" title="Очистити" onClick={clearConsole}>
                                    <span className="material-icons">delete_sweep</span>
                                </button>
                                <button
                                    className="console-btn close-btn"
                                    title="Закрити (Ctrl+`)"
                                    onClick={() => setConsoleVisibleCb(false)}
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="console-body">
                            {consoleTab === "output" ? (
                                <pre
                                    id="consoleOutput"
                                    className="console-output"
                                    dangerouslySetInnerHTML={{ __html: consoleHtml }}
                                />
                            ) : (
                                <ProblemsPanel cmViewRef={cmViewRef} />
                            )}
                        </div>
                    </div>
                )}

                {/* Status bar */}
                <footer className="status-bar">
                    <div className="status-left">
                        <span id="connectionStatus" className="status-indicator">
                            <span className={`status-dot ${connectionStatus}`} />
                            <span className="status-text">
                                {connectionStatus === "connected"    && "підключено"}
                                {connectionStatus === "disconnected" && "відключено"}
                                {connectionStatus === "connecting"   && "з'єднання..."}
                                {connectionStatus === "error"        && "помилка"}
                            </span>
                        </span>
                        <span className="status-indicator">
                            <span className="material-icons">code</span>
                            <span>rust · utf-8</span>
                        </span>
                        {/* Diagnostics indicator */}
                        {(errorCount + warningCount) > 0 && (
                            <button
                                className={`status-indicator status-diag-btn ${errorCount > 0 ? "status-diag--error" : "status-diag--warn"}`}
                                title="Відкрити панель проблем"
                                onClick={() => {
                                    setConsoleVisibleCb(true);
                                    setConsoleTab("problems");
                                }}
                            >
                                <span className="material-icons">
                                    {errorCount > 0 ? "error" : "warning"}
                                </span>
                                {errorCount > 0 && <span>{errorCount} {errorCount === 1 ? "помилка" : "помилок"}</span>}
                                {warningCount > 0 && <span>{warningCount} {warningCount === 1 ? "поп." : "поп."}</span>}
                            </button>
                        )}
                    </div>
                    <div className="status-right">
                        <span id="syncStatus" className="status-indicator">
                            <span className={`material-icons ${syncStatus !== "Синхронізовано" ? "sync-spinner" : ""}`}>
                                {syncStatus === "Синхронізовано" ? "done_all" : "sync"}
                            </span>
                            <span className="status-text">{syncStatus}</span>
                        </span>
                        <span className="status-indicator">
                            <span className="material-icons">notes</span>
                            <span id="wordStats">{wordStats}</span>
                        </span>
                        {/* Minimap toggle */}
                        <button
                            className={`status-indicator status-toggle-btn ${minimapVisible ? "active" : ""}`}
                            title={minimapVisible ? "Сховати мінімап" : "Показати мінімап"}
                            onClick={() => setMinimapVisible(v => !v)}
                        >
                            <span className="material-icons">map</span>
                        </button>
                    </div>
                </footer>
            </main>

            {/* ─── Shortcuts Modal ───────────────────────────────────────── */}
            {shortcutsOpen && (
                <div className="modal-overlay" onClick={() => setShortcutsOpen(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-group">
                                <span className="material-icons">keyboard</span>
                                <h3 className="modal-title">Гарячі клавіші</h3>
                            </div>
                            <button className="modal-close-btn" onClick={() => setShortcutsOpen(false)}>
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {[
                                { desc: "Запустити (cargo run)",          keys: ["Ctrl", "S"] },
                                { desc: "Тести (cargo test)",             keys: ["Ctrl", "Alt", "S"] },
                                { desc: "Форматувати (rustfmt)",          keys: ["Alt", "S"] },
                                { desc: "Закрити вкладку",                keys: ["Ctrl", "W"] },
                                { desc: "Відкрити/закрити консоль",       keys: ["Ctrl", "`"] },
                                { desc: "Автодоповнення / Відступ",       keys: ["Tab"] },
                            ].map(({ desc, keys }) => (
                                <div key={desc} className="shortcut-item">
                                    <span className="shortcut-desc">{desc}</span>
                                    <div className="shortcut-key-wrapper">
                                        {keys.map((k, i) => (
                                            <React.Fragment key={k}>
                                                <kbd className="shortcut-key">{k}</kbd>
                                                {i < keys.length - 1 && <span className="shortcut-plus">+</span>}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
