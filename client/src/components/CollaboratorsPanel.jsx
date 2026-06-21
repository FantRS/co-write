import React, { useState } from "react";
import { useSelector } from "react-redux";
import { getMembersEndpoint, removeMemberEndpoint } from "../configs/paths.js";
import { useToast } from "./Toast.jsx";

function shortenPath(path, maxLen = 28) {
    if (!path || path.length <= maxLen) return path;
    const parts = path.split("/");
    let result = parts[parts.length - 1];
    for (let i = parts.length - 2; i >= 0; i--) {
        const candidate = parts.slice(i).join("/");
        if (candidate.length > maxLen) return "…/" + result;
        result = candidate;
    }
    return result;
}

const ROLE_LABELS = {
    manager: "Керівник",
    editor: "Редактор",
    reader: "Читач",
};

const ROLE_COLORS = {
    manager: { bg: "rgba(189,147,249,0.15)", color: "#bd93f9", border: "rgba(189,147,249,0.3)" },
    editor:  { bg: "rgba(80,250,123,0.12)", color: "#50fa7b", border: "rgba(80,250,123,0.3)" },
    reader:  { bg: "rgba(98,114,164,0.15)",  color: "#6272a4", border: "rgba(98,114,164,0.3)" },
};

function RoleBadge({ role }) {
    const s = ROLE_COLORS[role] || ROLE_COLORS.reader;
    return (
        <span className="role-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {ROLE_LABELS[role] || role}
        </span>
    );
}

function Avatar({ username, color }) {
    return (
        <div className="collab-avatar" style={{ background: `${color}22`, border: `2px solid ${color}55`, color }}>
            {username?.charAt(0).toUpperCase() || "?"}
        </div>
    );
}

export function CollaboratorsPanel({ docId, onChangeRole }) {
    const { collaborators, myRole, myConnId } = useSelector((s) => s.collab);
    const token = useSelector((s) => s.auth.token);
    const showToast = useToast();

    const [addUsername, setAddUsername] = useState("");
    const [addLoading, setAddLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const isManager = myRole === "manager";

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!addUsername.trim()) return;
        setAddLoading(true);
        try {
            const res = await fetch(getMembersEndpoint(docId), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username: addUsername.trim() }),
            });
            if (res.ok) {
                showToast(`${addUsername} доданий до проєкту`);
                setAddUsername("");
                setShowAddForm(false);
            } else {
                const msg = await res.text();
                showToast(msg || "Помилка додавання учасника");
            }
        } catch {
            showToast("Помилка підключення");
        } finally {
            setAddLoading(false);
        }
    };

    const handleRemoveMember = async (userId, username) => {
        if (!window.confirm(`Видалити ${username} з проєкту?`)) return;
        try {
            const res = await fetch(removeMemberEndpoint(docId, userId), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) showToast(`${username} видалений`);
            else showToast("Помилка видалення учасника");
        } catch {
            showToast("Помилка підключення");
        }
    };

    return (
        <div className="collab-panel">
            {/* Header */}
            <div className="sidebar-section-header">
                <span className="material-icons sidebar-section-icon">group</span>
                <span className="sidebar-section-title">Колаборанти</span>
                <span className="collab-online-count">{collaborators.length} онлайн</span>
            </div>

            {/* Online session participants */}
            <div className="collab-list-section">
                <p className="collab-list-label">Зараз у сесії</p>
                {collaborators.length === 0 ? (
                    <p className="collab-empty">Нікого немає</p>
                ) : (
                    <ul className="collab-list">
                        {collaborators.map((c) => (
                            <li key={c.connId} className={`collab-item ${c.isMe ? "collab-item--me" : ""}`}>
                                <Avatar username={c.username} color={c.color} />
                                <div className="collab-item-info">
                                    <span className="collab-name">
                                        {c.username}
                                        {c.isMe && <span className="collab-you-tag">ви</span>}
                                    </span>
                                    <RoleBadge role={c.role} />
                                    {c.cursor?.path && (
                                        <span className="collab-file-path" title={c.cursor.path}>
                                            <span className="material-icons" style={{ fontSize: "10px", flexShrink: 0 }}>insert_drive_file</span>
                                            {shortenPath(c.cursor.path)}
                                        </span>
                                    )}
                                </div>

                                {/* Role change dropdown — only visible to Manager, not for themselves */}
                                {isManager && !c.isMe && (
                                    <select
                                        className="collab-role-select"
                                        value={c.role}
                                        onChange={(e) => onChangeRole?.(c.connId, e.target.value)}
                                        title="Змінити роль"
                                    >
                                        <option value="reader">Читач</option>
                                        <option value="editor">Редактор</option>
                                        <option value="manager">Керівник</option>
                                    </select>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Add member section — only for Manager */}
            {isManager && (
                <div className="collab-list-section">
                    <div className="collab-list-label-row">
                        <p className="collab-list-label">Запросити до проєкту</p>
                        <button
                            className="collab-add-toggle"
                            onClick={() => setShowAddForm(v => !v)}
                            title="Додати учасника"
                        >
                            <span className="material-icons">{showAddForm ? "close" : "person_add"}</span>
                        </button>
                    </div>

                    {showAddForm && (
                        <form className="collab-add-form" onSubmit={handleAddMember}>
                            <div className="collab-add-input-row">
                                <input
                                    className="collab-add-input"
                                    type="text"
                                    placeholder="Ім'я користувача..."
                                    value={addUsername}
                                    onChange={(e) => setAddUsername(e.target.value)}
                                    disabled={addLoading}
                                    autoFocus
                                />
                                <button type="submit" className="btn primary collab-add-btn" disabled={addLoading || !addUsername.trim()}>
                                    <span className="material-icons">{addLoading ? "autorenew" : "send"}</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Copy invite link */}
            <button
                id="copy-link-btn"
                className="btn collab-copy-btn"
                onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("Посилання скопійовано!");
                }}
            >
                <span className="material-icons">link</span>
                Скопіювати посилання
            </button>
        </div>
    );
}
