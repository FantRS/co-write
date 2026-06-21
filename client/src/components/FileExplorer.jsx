import React, { useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    openTab,
    upsertFile,
    deleteFile,
    renameFile,
} from "../store/slices/collabSlice.js";
import { useToast } from "./Toast.jsx";

// ── Допоміжні функції ─────────────────────────────────────────────────────────

/**
 * Будує дерево вузлів з плаского списку шляхів.
 * Кожен директорний вузол отримує __dirPath — повний шлях від кореня.
 */
function buildTree(files) {
    const tree = {};
    for (const filePath of Object.keys(files)) {
        // Фільтруємо .gitkeep (старий маркер папок)
        if (filePath.endsWith(".gitkeep")) continue;
        // Папка з is_dir: відображаємо як папку без вмісту
        if (filePath.endsWith("/")) {
            const parts = filePath.slice(0, -1).split("/");
            let node = tree;
            let accPath = "";
            for (const part of parts) {
                accPath = accPath ? `${accPath}/${part}` : part;
                if (!node[part]) node[part] = { __isDir: true, __dirPath: accPath };
                node = node[part];
            }
            continue;
        }
        const parts = filePath.split("/");
        let node = tree;
        let accPath = "";
        for (let i = 0; i < parts.length - 1; i++) {
            accPath = accPath ? `${accPath}/${parts[i]}` : parts[i];
            if (!node[parts[i]]) node[parts[i]] = { __isDir: true, __dirPath: accPath };
            node = node[parts[i]];
        }
        const filename = parts[parts.length - 1];
        node[filename] = { __isDir: false, __path: filePath };
    }
    return tree;
}

function getFileIcon(name) {
    if (name.endsWith(".rs"))   return "code";
    if (name.endsWith(".toml")) return "settings";
    if (name.endsWith(".md"))   return "article";
    if (name.endsWith(".json")) return "data_object";
    if (name.endsWith(".txt"))  return "text_snippet";
    return "insert_drive_file";
}

function isReservedKey(key) {
    return key === "__isDir" || key === "__path" || key === "__dirPath";
}

function sortedChildren(node) {
    const entries = Object.entries(node).filter(([k]) => !isReservedKey(k));
    return entries.sort(([nameA, a], [nameB, b]) => {
        if (a.__isDir && !b.__isDir) return -1;
        if (!a.__isDir && b.__isDir) return 1;
        return nameA.localeCompare(nameB);
    });
}

// ── Вузол дерева ─────────────────────────────────────────────────────────────

function TreeNode({
    name, node, depth, activeFile, canEdit,
    onFileClick, onNewFile, onNewFolder, onDelete, onRename,
    creating, createName, onCreateNameChange, onCreateSubmit, onCreateCancel,
}) {
    const [open, setOpen]       = useState(true);
    const [renaming, setRenaming] = useState(false);
    const [renameVal, setRenameVal] = useState(name);

    const isDir   = node.__isDir;
    const filePath = node.__path;    // тільки для файлів
    const dirPath  = node.__dirPath; // тільки для директорій
    const isActive = !isDir && activeFile === filePath;
    const isSrcFolder = isDir && dirPath === "src";
    const children = sortedChildren(node);

    const submitRename = (e) => {
        e && e.preventDefault();
        const trimmed = renameVal.trim();
        if (trimmed && trimmed !== name) {
            onRename(name, trimmed, node);
        }
        setRenaming(false);
    };

    return (
        <div className="tree-node">
            <div
                className={`tree-item ${isActive ? "tree-item--active" : ""}`}
                style={{ paddingLeft: `${8 + depth * 10}px` }}
                onClick={() => isDir ? setOpen((o) => !o) : onFileClick(filePath)}
                onDoubleClick={() => canEdit && !isSrcFolder && setRenaming(true)}
                title={isDir ? dirPath : filePath}
            >
                {isDir ? (
                    <span className={`material-icons tree-chevron${open ? " tree-chevron--open" : ""}`}>
                        chevron_right
                    </span>
                ) : (
                    <span className="tree-chevron-spacer" />
                )}
                <span className="material-icons tree-icon">
                    {isDir ? "folder" : getFileIcon(name)}
                </span>

                {renaming ? (
                    <form onSubmit={submitRename} className="rename-form">
                        <input
                            className="rename-input"
                            value={renameVal}
                            autoFocus
                            onChange={(e) => setRenameVal(e.target.value)}
                            onBlur={submitRename}
                            onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </form>
                ) : (
                    <span className="tree-label">{name}</span>
                )}

                {canEdit && (
                    <div className="tree-actions">
                        {isDir && (
                            <>
                                <button
                                    className="tree-action-btn"
                                    title="Новий файл"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNewFile(dirPath);
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: "14px" }}>note_add</span>
                                </button>
                                <button
                                    className="tree-action-btn"
                                    title="Нова папка"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNewFolder(dirPath);
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: "14px" }}>create_new_folder</span>
                                </button>
                            </>
                        )}
                        {!isSrcFolder && (
                            <button
                                className="tree-action-btn tree-action-btn--danger"
                                title="Видалити"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(isDir ? dirPath : filePath, node);
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: "14px" }}>delete</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isDir && open && (
                <div className="tree-children" style={{ '--guide-x': `${8 + depth * 10 + 6}px` }}>
                    {children.map(([childName, childNode]) => (
                        <TreeNode
                            key={childName}
                            name={childName}
                            node={childNode}
                            depth={depth + 1}
                            activeFile={activeFile}
                            canEdit={canEdit}
                            onFileClick={onFileClick}
                            onNewFile={onNewFile}
                            onNewFolder={onNewFolder}
                            onDelete={onDelete}
                            onRename={onRename}
                            creating={creating}
                            createName={createName}
                            onCreateNameChange={onCreateNameChange}
                            onCreateSubmit={onCreateSubmit}
                            onCreateCancel={onCreateCancel}
                        />
                    ))}

                    {/* Form з'являється всередині потрібної папки */}
                    {creating?.parentPath === dirPath && (
                        <form
                            className="create-form"
                            style={{ paddingLeft: `${8 + (depth + 1) * 10 + 16}px` }}
                            onSubmit={onCreateSubmit}
                        >
                            <span className="material-icons tree-icon">
                                {creating.isDir ? "create_new_folder" : "note_add"}
                            </span>
                            <input
                                className="rename-input"
                                placeholder={creating.isDir ? "назва-папки" : "файл.rs"}
                                value={createName}
                                autoFocus
                                onChange={(e) => onCreateNameChange(e.target.value)}
                                onBlur={onCreateSubmit}
                                onKeyDown={(e) => e.key === "Escape" && onCreateCancel()}
                            />
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Головний компонент провідника ─────────────────────────────────────────────

export function FileExplorer({ onFilesChange }) {
    const dispatch    = useDispatch();
    const files       = useSelector((s) => s.collab.files);
    const activeFile  = useSelector((s) => s.collab.activeFile);
    const myRole      = useSelector((s) => s.collab.myRole);
    const canEdit     = myRole !== "reader";
    const showToast   = useToast();

    const [creating, setCreating] = useState(null); // { parentPath: string, isDir: bool }
    const [newName, setNewName]   = useState("");

    const tree        = buildTree(files);
    const rootEntries = sortedChildren(tree);

    // ── Перейти до файлу ─────────────────────────────────────────────────────
    const handleFileClick = useCallback((path) => {
        dispatch(openTab(path));
    }, [dispatch]);

    // ── Новий файл/папка ─────────────────────────────────────────────────────
    const handleNewFile   = useCallback((parentPath) => {
        setCreating({ parentPath, isDir: false });
        setNewName("");
    }, []);
    const handleNewFolder = useCallback((parentPath) => {
        setCreating({ parentPath, isDir: true });
        setNewName("");
    }, []);

    const handleCreateSubmit = useCallback((e) => {
        e && e.preventDefault();
        const trimmed = newName.trim();
        if (!trimmed || !creating) { setCreating(null); return; }

        if (!creating.parentPath && trimmed.toLowerCase() === "src") {
            showToast("Не можна створити файл або папку з назвою 'src' у кореневому каталозі");
            setCreating(null);
            setNewName("");
            return;
        }

        const prefix = creating.parentPath ? `${creating.parentPath}/` : "";

        if (creating.isDir) {
            // Папка — відправляємо як upsert з is_dir:true (без .gitkeep)
            const dirPath = `${prefix}${trimmed}/`;
            dispatch(upsertFile({ path: dirPath, content: "" }));
            onFilesChange && onFilesChange({ action: "upsert", path: dirPath, content: "", is_dir: true });
        } else {
            const fullPath = `${prefix}${trimmed}`;
            dispatch(upsertFile({ path: fullPath, content: "" }));
            onFilesChange && onFilesChange({ action: "upsert", path: fullPath, content: "", is_dir: false });
            dispatch(openTab(fullPath));
        }

        setCreating(null);
        setNewName("");
    }, [creating, newName, dispatch, onFilesChange]);

    // ── Видалення ────────────────────────────────────────────────────────────
    const handleDelete = useCallback((pathOrDir, node) => {
        if (node.__isDir && (pathOrDir === "src" || node.__dirPath === "src")) {
            showToast("Папка 'src' є захищеною та не може бути видалена");
            return;
        }
        if (node.__isDir) {
            // dirPath зберігається у node.__dirPath
            const dirP = pathOrDir;
            const toDelete = Object.keys(files).filter(
                (p) => p === dirP || p.startsWith(`${dirP}/`)
            );
            toDelete.forEach((p) => {
                dispatch(deleteFile(p));
                onFilesChange && onFilesChange({ action: "delete", path: p });
            });
        } else {
            dispatch(deleteFile(pathOrDir));
            onFilesChange && onFilesChange({ action: "delete", path: pathOrDir });
        }
    }, [files, dispatch, onFilesChange]);

    // ── Перейменування ───────────────────────────────────────────────────────
    const handleRename = useCallback((oldName, newNameVal, node) => {
        if (node.__isDir && (node.__dirPath === "src" || oldName === "src")) {
            showToast("Папка 'src' є захищеною та не може бути перейменована");
            return;
        }
        if (node.__isDir && newNameVal.toLowerCase() === "src") {
            showToast("Не можна перейменувати папку на 'src'");
            return;
        }
        if (!node.__isDir) {
            const old_path = node.__path;
            const segments = old_path.split("/");
            if (segments.length === 1 && newNameVal.toLowerCase() === "src") {
                showToast("Не можна перейменувати файл на 'src' у кореневому каталозі");
                return;
            }
            segments[segments.length - 1] = newNameVal;
            const new_path = segments.join("/");
            dispatch(renameFile({ oldPath: old_path, newPath: new_path }));
            onFilesChange && onFilesChange({ action: "rename", old_path, new_path });
        } else {
            const oldDirPath = node.__dirPath; // напр. "src"
            // Отримуємо батьківський шлях (все крім останнього сегменту)
            const parts = oldDirPath.split("/");
            parts[parts.length - 1] = newNameVal;
            const newDirPath = parts.join("/");

            Object.keys(files)
                .filter((p) => p === oldDirPath || p.startsWith(`${oldDirPath}/`))
                .forEach((old_path) => {
                    const new_path = newDirPath + old_path.slice(oldDirPath.length);
                    dispatch(renameFile({ oldPath: old_path, newPath: new_path }));
                    onFilesChange && onFilesChange({ action: "rename", old_path, new_path });
                });
        }
    }, [files, dispatch, onFilesChange]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="file-explorer">
            <div className="file-explorer-header">
                <span className="fe-title">Провідник</span>
                {canEdit && (
                    <div className="fe-actions">
                        <button
                            className="tree-action-btn"
                            title="Новий файл у src/"
                            onClick={() => handleNewFile("src")}
                        >
                            <span className="material-icons" style={{ fontSize: "16px" }}>note_add</span>
                        </button>
                        <button
                            className="tree-action-btn"
                            title="Нова папка в корені"
                            onClick={() => handleNewFolder("")}
                        >
                            <span className="material-icons" style={{ fontSize: "16px" }}>create_new_folder</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="file-tree">
                {rootEntries.map(([name, node]) => (
                    <TreeNode
                        key={name}
                        name={name}
                        node={node}
                        depth={0}
                        activeFile={activeFile}
                        canEdit={canEdit}
                        onFileClick={handleFileClick}
                        onNewFile={handleNewFile}
                        onNewFolder={handleNewFolder}
                        onDelete={handleDelete}
                        onRename={handleRename}
                        creating={creating}
                        createName={newName}
                        onCreateNameChange={setNewName}
                        onCreateSubmit={handleCreateSubmit}
                        onCreateCancel={() => setCreating(null)}
                    />
                ))}

                {/* Форма для кореневого рівня (parentPath === "") */}
                {creating?.parentPath === "" && (
                    <form className="create-form" onSubmit={handleCreateSubmit}>
                        <span className="material-icons tree-icon">
                            {creating.isDir ? "create_new_folder" : "note_add"}
                        </span>
                        <input
                            className="rename-input"
                            placeholder={creating.isDir ? "назва-папки" : "файл.rs"}
                            value={newName}
                            autoFocus
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleCreateSubmit}
                            onKeyDown={(e) => e.key === "Escape" && setCreating(null)}
                        />
                    </form>
                )}
            </div>
        </div>
    );
}
