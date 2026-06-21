import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { rust } from "@codemirror/lang-rust";
import { dracula } from "../utils/draculaTheme.js";
import { basicSetup } from "codemirror";
import { indentUnit } from "@codemirror/language";
import { upsertFile } from "../store/slices/collabSlice.js";

function getFileIcon(name) {
    if (name.endsWith(".rs"))   return "code";
    if (name.endsWith(".toml")) return "settings";
    if (name.endsWith(".md"))   return "article";
    if (name.endsWith(".json")) return "data_object";
    if (name.endsWith(".txt"))  return "text_snippet";
    return "insert_drive_file";
}

/**
 * Окрема панель редактора для split-режиму.
 * Має власний CM instance і незалежно керує активним файлом.
 */
export function SplitPane({ initialFile, sendFsEvent, isDark, onClose }) {
    const dispatch    = useDispatch();
    const files       = useSelector((s) => s.collab.files);
    const allPaths    = Object.keys(files)
        .filter(p => !p.endsWith("/") && !p.endsWith(".gitkeep"))
        .sort();

    const [selectedFile, setSelectedFile] = useState(initialFile ?? allPaths[0] ?? null);

    const containerRef    = useRef(null);
    const cmViewRef       = useRef(null);
    const themeCompartRef = useRef(new Compartment());
    const selectedRef     = useRef(selectedFile);
    const filesRef        = useRef(files);
    const sendFsRef       = useRef(sendFsEvent);
    const isRemoteRef     = useRef(false);
    const debounceRef     = useRef(null);

    useEffect(() => { selectedRef.current = selectedFile; }, [selectedFile]);
    useEffect(() => { filesRef.current = files; },         [files]);
    useEffect(() => { sendFsRef.current = sendFsEvent; },  [sendFsEvent]);

    // ── Монтуємо CM ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const initContent = selectedFile ? (files[selectedFile] ?? "") : "";

        const view = new EditorView({
            state: EditorState.create({
                doc: initContent,
                extensions: [
                    basicSetup,
                    rust(),
                    indentUnit.of("    "),
                    themeCompartRef.current.of(isDark ? dracula : []),
                    EditorView.theme({
                        "&": { height: "100%", fontSize: "14px" },
                        ".cm-scroller": { overflow: "auto" },
                    }),
                    keymap.of([indentWithTab]),
                    EditorView.updateListener.of((update) => {
                        if (!update.docChanged || isRemoteRef.current) return;

                        clearTimeout(debounceRef.current);
                        debounceRef.current = setTimeout(() => {
                            const path    = selectedRef.current;
                            const content = view.state.doc.toString();
                            if (!path) return;
                            dispatch(upsertFile({ path, content }));
                            sendFsRef.current?.({ action: "upsert", path, content, is_dir: false });
                        }, 300);
                    }),
                ],
            }),
            parent: containerRef.current,
        });

        cmViewRef.current = view;
        return () => {
            clearTimeout(debounceRef.current);
            view.destroy();
            cmViewRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Оновлення теми ────────────────────────────────────────────────────────
    useEffect(() => {
        cmViewRef.current?.dispatch({
            effects: themeCompartRef.current.reconfigure(isDark ? dracula : []),
        });
    }, [isDark]);

    // ── Оновлення контенту при зміні файлу або remote update ─────────────────
    useEffect(() => {
        const view = cmViewRef.current;
        if (!view || !selectedFile) return;
        const newContent = files[selectedFile] ?? "";
        const curContent = view.state.doc.toString();
        if (newContent !== curContent) {
            isRemoteRef.current = true;
            view.dispatch({ changes: { from: 0, to: curContent.length, insert: newContent } });
            isRemoteRef.current = false;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFile, files]);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.value);
    };

    return (
        <div className="split-pane">
            <div className="split-pane-header">
                <span className="material-icons split-pane-icon" aria-hidden="true">
                    {selectedFile ? getFileIcon(selectedFile.split("/").pop()) : "insert_drive_file"}
                </span>
                <select
                    className="split-pane-select"
                    value={selectedFile ?? ""}
                    onChange={handleFileChange}
                >
                    {allPaths.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                <button className="split-pane-close" onClick={onClose} title="Закрити панель">
                    <span className="material-icons">close</span>
                </button>
            </div>
            <div ref={containerRef} className="split-pane-editor" />
        </div>
    );
}
