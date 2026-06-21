import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { openTab, closeTab } from "../store/slices/collabSlice.js";

function getFileIcon(name) {
    if (name.endsWith(".rs"))   return "code";
    if (name.endsWith(".toml")) return "settings";
    if (name.endsWith(".md"))   return "article";
    if (name.endsWith(".json")) return "data_object";
    if (name.endsWith(".txt"))  return "text_snippet";
    return "insert_drive_file";
}

/** Панель відкритих вкладок над редактором. */
export function FileTabs() {
    const dispatch   = useDispatch();
    const openTabs   = useSelector((s) => s.collab.openTabs);
    const activeFile = useSelector((s) => s.collab.activeFile);

    if (openTabs.length === 0) return (
        <div className="file-tabs file-tabs--empty">
            <span className="file-tabs-hint">відкрийте файл у провіднику</span>
        </div>
    );

    return (
        <div className="file-tabs">
            <div className="file-tabs-list">
                {openTabs.map((path) => {
                    const name     = path.split("/").pop();
                    const isActive = path === activeFile;
                    return (
                        <div
                            key={path}
                            className={`file-tab ${isActive ? "file-tab--active" : ""}`}
                            onClick={() => dispatch(openTab(path))}
                            title={path}
                        >
                            <span className="material-icons file-tab-icon">
                                {getFileIcon(name)}
                            </span>
                            <span className="file-tab-name">{name}</span>
                            <button
                                className="file-tab-close"
                                title="Закрити (Ctrl+W)"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    dispatch(closeTab(path));
                                }}
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
