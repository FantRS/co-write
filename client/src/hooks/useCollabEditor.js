import { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as Automerge from "@automerge/automerge";
import { EditorState, Compartment, Prec, StateField, StateEffect } from "@codemirror/state";
import { EditorView, keymap, hoverTooltip, Decoration, WidgetType } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { rust } from "@codemirror/lang-rust";
import { dracula } from "../utils/draculaTheme.js";
import { basicSetup } from "codemirror";
import { indentUnit } from "@codemirror/language";
import { autocompletion, completionKeymap, acceptCompletion, completionStatus } from "@codemirror/autocomplete";
import { createLspCompletionSource, renderMarkdown } from "../utils/lspCompletion.js";
import { webSocketUrl, getDocumentTitleEndpoint, getExecuteEndpoint, getTestEndpoint, getFormatEndpoint, getHoverEndpoint } from "../configs/paths.js";
import { useToast } from "../components/Toast.jsx";
import { stripAnsi } from "../utils/ansiToHtml.js";
import {
    setDocTitle,
    setConnectionStatus,
    setSyncStatus,
    setWordStats,
    setConsoleOutput,
    appendConsoleOutput,
    setConsoleVisible,
    setIsRunning,
    setDiagnostics,
    updateActiveFileContent,
    upsertFile,
    deleteFile,
    renameFile,
    setFiles,
    openTab,
    closeTab,
    resetCollabState,
    setCollaborators,
    updateCollaboratorCursor,
} from "../store/slices/collabSlice.js";

// ── LocalStorage helpers ──────────────────────────────────────────────────────

function lsKey(docId)  { return `co-write:files:${docId}`; }

function loadFilesFromStorage(docId) {
    try {
        const raw = localStorage.getItem(lsKey(docId));
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
}

function saveFilesToStorage(docId, files) {
    try {
        localStorage.setItem(lsKey(docId), JSON.stringify(files));
    } catch { /* ignore */ }
}

// ── Rust output parser ────────────────────────────────────────────────────────

function parseRustOutput(rawOutput) {
    const text  = stripAnsi(rawOutput);
    const lines = text.split("\n");
    const diagnostics = [];

    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^(error|warning)(\[([^\]]+)\])?: (.+)/);
        if (!m) continue;
        const locM = lines[i + 1]?.match(/^\s+-->\s+(.+):(\d+):(\d+)/);
        diagnostics.push({
            type:    m[1],
            code:    m[3] ?? null,
            message: m[4],
            file:    locM ? locM[1] : null,
            line:    locM ? parseInt(locM[2], 10) : null,
            col:     locM ? parseInt(locM[3], 10) : null,
        });
    }
    return diagnostics;
}

// ── CodeMirror cursor decorations ─────────────────────────────────────────────

class CursorWidget extends WidgetType {
    constructor(color, username) {
        super();
        this.color    = color;
        this.username = username;
    }
    eq(other) { return other.color === this.color && other.username === this.username; }
    toDOM() {
        const el       = document.createElement("span");
        el.className   = "collab-cursor";
        el.style.setProperty("--cursor-color", this.color);
        el.setAttribute("data-name", this.username);
        return el;
    }
    ignoreEvent() { return true; }
}

export const setCursorsEffect = StateEffect.define();

export const cursorsField = StateField.define({
    create: () => Decoration.none,
    update: (decos, tr) => {
        for (const e of tr.effects) {
            if (e.is(setCursorsEffect)) return e.value;
        }
        return decos.map(tr.changes);
    },
    provide: (f) => EditorView.decorations.from(f),
});

// ─────────────────────────────────────────────────────────────────────────────

export function useCollabEditor(documentId, isDark) {
    const showToast  = useToast();
    const dispatch   = useDispatch();

    const token    = useSelector((s) => s.auth.token);
    const username = useSelector((s) => s.auth.username);
    const tokenRef = useRef(token);
    useEffect(() => { tokenRef.current = token; }, [token]);

    const {
        docTitle, connectionStatus, syncStatus, wordStats,
        consoleOutput, consoleVisible, isRunning,
        files, activeFile, collaborators, myRole, myConnId,
    } = useSelector((s) => s.collab);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const editorRef       = useRef(null);
    const cmViewRef       = useRef(null);
    const socketRef       = useRef(null);
    const themeCompartRef = useRef(new Compartment());
    const editCompartRef  = useRef(new Compartment());

    const docRef       = useRef(null);
    const syncStateRef = useRef(null);

    const isRemoteUpdateRef = useRef(false);
    const debounceRef       = useRef(null);
    const cursorThrottleRef = useRef(null);

    const runCodeRef    = useRef(null);
    const formatCodeRef = useRef(null);
    const runTestsRef   = useRef(null);
    const closeTabRef   = useRef(null);

    const filesRef      = useRef(files);
    const activeFileRef = useRef(activeFile);
    const docIdRef      = useRef(documentId);
    const collabsRef    = useRef(collaborators);
    const myConnIdRef   = useRef(myConnId);

    useEffect(() => { filesRef.current = files; },           [files]);
    useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);
    useEffect(() => { docIdRef.current = documentId; },      [documentId]);
    useEffect(() => { collabsRef.current = collaborators; }, [collaborators]);
    useEffect(() => { myConnIdRef.current = myConnId; },     [myConnId]);

    // ── Automerge init ────────────────────────────────────────────────────────
    if (!docRef.current) {
        try {
            docRef.current       = Automerge.from({ text: "" });
            syncStateRef.current = Automerge.initSyncState();
        } catch (e) {
            console.error("Automerge init error:", e);
            docRef.current = { text: "" };
        }
    }

    // ── Статистика ────────────────────────────────────────────────────────────
    const updateStats = useCallback((text) => {
        const chars = text.length;
        const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
        dispatch(setWordStats(`${words} сл. | ${chars} симв.`));
    }, [dispatch]);

    // ── Automerge ─────────────────────────────────────────────────────────────
    const sendSyncMessage = useCallback(() => {
        const ws = socketRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try {
            const [next, msg] = Automerge.generateSyncMessage(docRef.current, syncStateRef.current);
            syncStateRef.current = next;
            if (msg) ws.send(msg);
        } catch (e) {
            console.error("Automerge generateSyncMessage error:", e);
        }
    }, []);

    // ── FS event через WS ─────────────────────────────────────────────────────
    const sendFsEvent = useCallback((event) => {
        const ws = socketRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try { ws.send(JSON.stringify({ event })); } catch (e) {
            console.error("WS send fs event error:", e);
        }
    }, []);

    // ── Role change ───────────────────────────────────────────────────────────
    const sendRoleChange = useCallback((targetConnId, newRole) => {
        const ws = socketRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try {
            ws.send(JSON.stringify({ type: "role_change", target_conn_id: targetConnId, new_role: newRole }));
        } catch (e) {
            console.error("WS send role change error:", e);
        }
    }, []);

    // ── Cursor position via WS ────────────────────────────────────────────────
    const sendCursor = useCallback((position) => {
        const ws = socketRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        if (cursorThrottleRef.current) return;
        cursorThrottleRef.current = setTimeout(() => {
            cursorThrottleRef.current = null;
        }, 50);
        try {
            ws.send(JSON.stringify({
                type:     "cursor",
                conn_id:  myConnIdRef.current,
                path:     activeFileRef.current,
                position,
            }));
        } catch (e) {
            console.error("WS send cursor error:", e);
        }
    }, []);

    // ── Persist files ─────────────────────────────────────────────────────────
    const persistFiles = useCallback((updatedFiles) => {
        if (docIdRef.current) saveFilesToStorage(docIdRef.current, updatedFiles);
    }, []);

    // ── Локальні зміни тексту ─────────────────────────────────────────────────
    const handleLocalChange = useCallback(() => {
        if (isRemoteUpdateRef.current || !cmViewRef.current) return;
        dispatch(setSyncStatus("Синхронізація..."));
        clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            if (!cmViewRef.current) return;
            const newText = cmViewRef.current.state.doc.toString();
            const path    = activeFileRef.current;
            if (!path) return;

            dispatch(updateActiveFileContent(newText));
            const nextFiles = { ...filesRef.current, [path]: newText };
            persistFiles(nextFiles);
            sendFsEvent({ action: "upsert", path, content: newText, is_dir: false });
            dispatch(setSyncStatus("Синхронізовано"));
            debounceRef.current = null;
        }, 300);
    }, [sendFsEvent, persistFiles, dispatch]);

    // ── Automerge binary frames ───────────────────────────────────────────────
    const handleBinary = useCallback((data) => {
        try {
            const bytes = new Uint8Array(data);
            if (bytes[0] === 123) {
                try {
                    const resp = JSON.parse(new TextDecoder().decode(bytes));
                    if (resp.status && resp.status !== 200) {
                        showToast(`Помилка синхронізації: ${resp.message}`);
                    }
                } catch { /* ignore */ }
                return;
            }
            if (bytes.length < 2) return;
            const [nextDoc, nextSync] = Automerge.receiveSyncMessage(
                docRef.current, syncStateRef.current, bytes
            );
            docRef.current       = nextDoc;
            syncStateRef.current = nextSync;
            sendSyncMessage();
            dispatch(setSyncStatus("Синхронізовано"));
        } catch (e) {
            console.error("Automerge binary handler error:", e);
        }
    }, [showToast, sendSyncMessage, dispatch]);

    // ── Text frames (FS-події, participants_update, cursor) ───────────────────
    const handleText = useCallback((raw) => {
        let msg;
        try { msg = JSON.parse(raw); } catch { return; }

        if (msg?.type === "participants_update") {
            dispatch(setCollaborators({ participants: msg.participants, myUsername: username }));
            return;
        }

        if (msg?.type === "permission_denied") {
            showToast(msg.reason || "Акція заборонена (недостатньо прав)");
            return;
        }

        // Позиція курсора іншого учасника
        if (msg?.type === "cursor") {
            dispatch(updateCollaboratorCursor({
                connId:   msg.conn_id,
                path:     msg.path,
                position: msg.position,
            }));
            return;
        }

        const event  = msg?.event;
        if (!event) return;
        const action = event.action;

        if (action === "upsert") {
            const { path, content = "", is_dir } = event;
            if (is_dir) return;
            dispatch(upsertFile({ path, content }));
            const nextFiles = { ...filesRef.current, [path]: content };
            persistFiles(nextFiles);
            if (path === activeFileRef.current && cmViewRef.current) {
                const cur = cmViewRef.current.state.doc.toString();
                if (cur !== content) {
                    isRemoteUpdateRef.current = true;
                    cmViewRef.current.dispatch({ changes: { from: 0, to: cur.length, insert: content } });
                    updateStats(content);
                    isRemoteUpdateRef.current = false;
                }
            }
        } else if (action === "delete") {
            const { path } = event;
            dispatch(deleteFile(path));
            const next = { ...filesRef.current };
            delete next[path];
            persistFiles(next);
        } else if (action === "rename") {
            const { old_path, new_path } = event;
            dispatch(renameFile({ oldPath: old_path, newPath: new_path }));
            const next = { ...filesRef.current };
            next[new_path] = next[old_path] ?? "";
            delete next[old_path];
            persistFiles(next);
        } else if (action === "snapshot") {
            dispatch(setFiles(event.files));
            persistFiles(event.files);
        }
    }, [dispatch, persistFiles, updateStats, showToast, username]);

    // ── Cursor decorations у CM при зміні collaborators ───────────────────────
    useEffect(() => {
        const view = cmViewRef.current;
        if (!view) return;
        const activePath = activeFileRef.current;

        const widgets = collabsRef.current
            .filter(c => !c.isMe && c.cursor?.path === activePath && c.cursor.position != null)
            .map(c => {
                const pos = Math.min(c.cursor.position, view.state.doc.length);
                return Decoration.widget({
                    widget: new CursorWidget(c.color, c.username),
                    side:   1,
                }).range(pos);
            })
            .sort((a, b) => a.from - b.from);

        try {
            const decos = widgets.length > 0
                ? Decoration.set(widgets, true)
                : Decoration.none;
            view.dispatch({ effects: setCursorsEffect.of(decos) });
        } catch { /* out-of-range positions */ }
    }, [collaborators, activeFile]);

    // ── WebSocket ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!documentId) return;

        const saved = loadFilesFromStorage(documentId);
        if (saved) {
            dispatch(setFiles(saved));
            const keys = Object.keys(saved).filter(k => !k.endsWith(".gitkeep"));
            if (!saved[activeFileRef.current] && keys.length > 0) {
                dispatch(openTab(keys[0]));
            }
        }

        let active = true;
        let reconnectTimeout;

        const connect = () => {
            if (!tokenRef.current) {
                dispatch(setConnectionStatus("error"));
                showToast("Необхідна автентифікація");
                return;
            }
            dispatch(setConnectionStatus("connecting"));
            const ws = new WebSocket(webSocketUrl(documentId, tokenRef.current));
            ws.binaryType = "arraybuffer";

            ws.onopen = () => {
                if (!active) { ws.close(); return; }
                socketRef.current = ws;
                dispatch(setConnectionStatus("connected"));
                sendSyncMessage();
            };
            ws.onclose = () => {
                if (!active) return;
                socketRef.current = null;
                dispatch(setConnectionStatus("disconnected"));
                showToast("Втрачено з'єднання, перепідключення...");
                reconnectTimeout = setTimeout(connect, 5000);
            };
            ws.onerror = () => {
                dispatch(setConnectionStatus("error"));
                showToast("Помилка WebSocket з'єднання");
            };
            ws.onmessage = (evt) => {
                if (!active) return;
                if (evt.data instanceof ArrayBuffer) handleBinary(evt.data);
                else if (typeof evt.data === "string") handleText(evt.data);
            };
        };

        connect();

        return () => {
            active = false;
            clearTimeout(reconnectTimeout);
            clearTimeout(cursorThrottleRef.current);
            socketRef.current?.close();
            dispatch(resetCollabState());
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documentId]);

    // ── Document title ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!documentId) return;
        let active = true;
        fetch(getDocumentTitleEndpoint(documentId), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(r => r.ok ? r.text() : Promise.reject())
            .then(title => { if (active) dispatch(setDocTitle(title)); })
            .catch(() => { if (active) dispatch(setDocTitle("Без назви")); });
        return () => { active = false; };
    }, [documentId, dispatch, token]);

    // ── CodeMirror mount ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!editorRef.current) return;

        const lspSource = createLspCompletionSource({
            documentId:    () => docIdRef.current,
            getFiles:      () => filesRef.current,
            getActivePath: () => activeFileRef.current,
        });

        const view = new EditorView({
            state: EditorState.create({
                doc: filesRef.current[activeFileRef.current] ?? "",
                extensions: buildExtensions(
                    isDark,
                    themeCompartRef.current,
                    editCompartRef.current,
                    handleLocalChange,
                    updateStats,
                    lspSource,
                    sendCursor,
                    () => runCodeRef.current?.(),
                    () => formatCodeRef.current?.(),
                    () => runTestsRef.current?.(),
                    () => closeTabRef.current?.(),
                    docIdRef,
                    filesRef,
                    activeFileRef
                ),
            }),
            parent: editorRef.current,
        });

        cmViewRef.current = view;
        updateStats(view.state.doc.toString());

        return () => {
            view.destroy();
            cmViewRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Перемикання активного файлу ───────────────────────────────────────────
    useEffect(() => {
        if (!cmViewRef.current || !activeFile) return;
        const content = files[activeFile] ?? "";
        const current = cmViewRef.current.state.doc.toString();
        if (current !== content) {
            isRemoteUpdateRef.current = true;
            cmViewRef.current.dispatch({ changes: { from: 0, to: current.length, insert: content } });
            updateStats(content);
            isRemoteUpdateRef.current = false;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFile]);

    // ── Зміна теми ───────────────────────────────────────────────────────────
    useEffect(() => {
        cmViewRef.current?.dispatch({
            effects: themeCompartRef.current.reconfigure(isDark ? dracula : [])
        });
    }, [isDark]);

    // ── Блокування редагування для Reader (включаючи paste) ───────────────────
    useEffect(() => {
        if (!cmViewRef.current) return;
        const canEdit = myRole !== "reader";
        cmViewRef.current.dispatch({
            effects: editCompartRef.current.reconfigure([
                EditorView.editable.of(canEdit),
                EditorState.readOnly.of(!canEdit),
            ]),
        });
    }, [myRole]);

    // ── Запуск коду ───────────────────────────────────────────────────────────
    const runCode = useCallback(async () => {
        if (!documentId || isRunning) return;

        const snapshot = { ...filesRef.current };
        if (activeFileRef.current && cmViewRef.current) {
            snapshot[activeFileRef.current] = cmViewRef.current.state.doc.toString();
        }
        const projectFiles = Object.fromEntries(
            Object.entries(snapshot).filter(([p]) => !p.endsWith(".gitkeep"))
        );

        dispatch(setConsoleVisible(true));
        dispatch(setIsRunning(true));
        dispatch(setConsoleOutput("> cargo run --release\nCompiling project...\nRunning executable...\n\n"));
        dispatch(setDiagnostics([]));

        try {
            const res  = await fetch(getExecuteEndpoint(documentId), {
                method:  "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
                },
                body: JSON.stringify({ files: projectFiles }),
            });
            const data = await res.json();
            const output = data.success
                ? data.stdout + (data.stderr ? "\n" + data.stderr : "")
                : (data.stderr || data.stdout || "Unknown compilation error");
            dispatch(appendConsoleOutput(output));
            dispatch(setDiagnostics(parseRustOutput(output)));
        } catch (err) {
            dispatch(appendConsoleOutput("\nПомилка з'єднання з сервером: " + err.message));
        } finally {
            dispatch(setIsRunning(false));
            setTimeout(() => {
                document.querySelector(".console-body")?.scrollTo(0, 999999);
            }, 50);
        }
    }, [documentId, isRunning, dispatch]);

    // ── Запуск тестів ─────────────────────────────────────────────────────────
    const runTests = useCallback(async () => {
        if (!documentId || isRunning) return;

        const snapshot = { ...filesRef.current };
        if (activeFileRef.current && cmViewRef.current) {
            snapshot[activeFileRef.current] = cmViewRef.current.state.doc.toString();
        }
        const projectFiles = Object.fromEntries(
            Object.entries(snapshot).filter(([p]) => !p.endsWith(".gitkeep"))
        );

        dispatch(setConsoleVisible(true));
        dispatch(setIsRunning(true));
        const isCargo   = Object.keys(projectFiles).some(p => p === "Cargo.toml");
        const execLabel = isCargo ? "cargo test" : "rustc --test";
        dispatch(setConsoleOutput(`> ${execLabel}\nCompiling tests...\nRunning tests...\n\n`));
        dispatch(setDiagnostics([]));

        try {
            const res  = await fetch(getTestEndpoint(documentId), {
                method:  "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
                },
                body: JSON.stringify({ files: projectFiles }),
            });
            const data = await res.json();
            const output = data.success
                ? data.stdout + (data.stderr ? "\n" + data.stderr : "")
                : (data.stderr || data.stdout || "Unknown testing error");
            dispatch(appendConsoleOutput(output));
            dispatch(setDiagnostics(parseRustOutput(output)));
        } catch (err) {
            dispatch(appendConsoleOutput("\nПомилка з'єднання з сервером: " + err.message));
        } finally {
            dispatch(setIsRunning(false));
            setTimeout(() => {
                document.querySelector(".console-body")?.scrollTo(0, 999999);
            }, 50);
        }
    }, [documentId, isRunning, dispatch]);

    // ── Форматування ──────────────────────────────────────────────────────────
    const formatCode = useCallback(async () => {
        if (!documentId || isRunning) return;
        const currentPath    = activeFileRef.current;
        if (!currentPath || !cmViewRef.current) return;
        const currentContent = cmViewRef.current.state.doc.toString();
        if (!currentContent.trim()) return;

        dispatch(setSyncStatus("Форматування..."));
        try {
            const res = await fetch(getFormatEndpoint(documentId), {
                method:  "POST",
                headers: { "Content-Type": "text/plain" },
                body:    currentContent,
            });
            if (res.ok) {
                const formatted = await res.text();
                if (formatted && formatted !== currentContent) {
                    isRemoteUpdateRef.current = true;
                    cmViewRef.current.dispatch({
                        changes: { from: 0, to: currentContent.length, insert: formatted }
                    });
                    isRemoteUpdateRef.current = false;
                    dispatch(updateActiveFileContent(formatted));
                    persistFiles({ ...filesRef.current, [currentPath]: formatted });
                    sendFsEvent({ action: "upsert", path: currentPath, content: formatted, is_dir: false });
                    showToast("Код успішно відформатовано");
                }
            } else {
                showToast("Помилка форматування коду");
            }
        } catch {
            showToast("Не вдалося зв'язатися з сервером для форматування");
        } finally {
            dispatch(setSyncStatus("Синхронізовано"));
        }
    }, [documentId, isRunning, sendFsEvent, persistFiles, dispatch, showToast]);

    useEffect(() => { runCodeRef.current    = runCode; },    [runCode]);
    useEffect(() => { formatCodeRef.current = formatCode; }, [formatCode]);
    useEffect(() => { runTestsRef.current   = runTests; },   [runTests]);
    useEffect(() => {
        closeTabRef.current = () => {
            const cur = activeFileRef.current;
            if (cur) dispatch(closeTab(cur));
        };
    }, [dispatch]);

    const clearConsole       = useCallback(() => dispatch(setConsoleOutput("")), [dispatch]);
    const setConsoleVisibleCb = useCallback((v) => dispatch(setConsoleVisible(v)), [dispatch]);

    return {
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
    };
}

// ── Extensions factory ────────────────────────────────────────────────────────

function buildExtensions(
    isDark, themeCompart, editCompart,
    handleLocalChange, updateStats, lspSource,
    onCursorMove,
    onRunCode, onFormatCode, onRunTests, onCloseTab,
    docIdRef, filesRef, activeFileRef
) {
    return [
        basicSetup,
        cursorsField,
        editCompart.of([EditorView.editable.of(true), EditorState.readOnly.of(false)]),
        hoverTooltip(async (view, pos, side) => {
            const docId      = docIdRef.current;
            const activePath = activeFileRef.current;
            if (!docId || !activePath) return null;

            const charAtPos = view.state.doc.sliceString(pos, pos + 1);
            if (!charAtPos || !/\w/.test(charAtPos)) return null;

            const lineObj   = view.state.doc.lineAt(pos);
            const line      = lineObj.number - 1;
            const character = pos - lineObj.from;

            const snapshot = { ...filesRef.current };
            snapshot[activePath] = view.state.doc.toString();
            const projectFiles   = Object.fromEntries(
                Object.entries(snapshot).filter(([p]) => !p.endsWith(".gitkeep"))
            );

            try {
                const res = await fetch(getHoverEndpoint(docId), {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({ files: projectFiles, file_path: activePath, line, character }),
                });
                if (!res.ok) return null;
                const data = await res.json();
                if (!data.content) return null;

                const text = view.state.doc.toString();
                let start = pos, end = pos;
                while (start > 0 && /\w/.test(text[start - 1])) start--;
                while (end < text.length && /\w/.test(text[end])) end++;

                return {
                    pos: start, end, above: true,
                    create() {
                        const dom = renderMarkdown(data.content);
                        dom.className = "cm-hover-tooltip-docs";
                        return { dom };
                    }
                };
            } catch (e) {
                console.error("Hover tooltip error:", e);
                return null;
            }
        }),
        autocompletion({ override: [lspSource], defaultKeymap: false }),
        Prec.highest(keymap.of([
            ...completionKeymap.filter((b) => b.key !== "Enter"),
            {
                key: "Tab",
                run: (view) => {
                    if (completionStatus(view.state) !== null) return acceptCompletion(view);
                    return false;
                },
            },
            {
                key: "Mod-s",
                run: () => { onRunCode?.(); return true; },
                preventDefault: true,
            },
            {
                key: "Ctrl-Alt-s",
                run: () => { onRunTests?.(); return true; },
                preventDefault: true,
            },
            {
                key: "Alt-s",
                run: () => { onFormatCode?.(); return true; },
                preventDefault: true,
            },
            {
                key: "Ctrl-w",
                run: () => { onCloseTab?.(); return true; },
                preventDefault: true,
            },
            indentWithTab,
        ])),
        indentUnit.of("    "),
        rust(),
        themeCompart.of(isDark ? dracula : []),
        EditorView.theme({
            "&": { height: "100%", fontSize: "14px" },
            ".cm-scroller": { overflow: "auto" },
        }),
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                handleLocalChange();
                updateStats(update.state.doc.toString());
            }
            if (update.selectionSet) {
                onCursorMove?.(update.state.selection.main.head);
            }
        }),
    ];
}
