import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { EditorView } from "@codemirror/view";

const SYMBOL_PATTERNS = [
    { re: /^(pub(\(crate\))?\s+)?fn\s+(\w+)/,    icon: "functions", label: "fn",     nameIdx: 3 },
    { re: /^(pub(\(crate\))?\s+)?async\s+fn\s+(\w+)/, icon: "functions", label: "async fn", nameIdx: 3 },
    { re: /^(pub(\(crate\))?\s+)?struct\s+(\w+)/, icon: "category",  label: "struct", nameIdx: 3 },
    { re: /^(pub(\(crate\))?\s+)?enum\s+(\w+)/,   icon: "list",      label: "enum",   nameIdx: 3 },
    { re: /^(pub(\(crate\))?\s+)?trait\s+(\w+)/,  icon: "extension", label: "trait",  nameIdx: 3 },
    { re: /^impl(\s+\w+)+/,                        icon: "code",      label: "impl",   nameIdx: 0 },
    { re: /^(pub(\(crate\))?\s+)?mod\s+(\w+)/,    icon: "folder",    label: "mod",    nameIdx: 3 },
    { re: /^(pub(\(crate\))?\s+)?const\s+(\w+)/,  icon: "tag",       label: "const",  nameIdx: 3 },
    { re: /^(pub(\(crate\))?\s+)?type\s+(\w+)/,   icon: "schema",    label: "type",   nameIdx: 3 },
    { re: /^(pub(\(crate\))?\s+)?static\s+(\w+)/, icon: "memory",    label: "static", nameIdx: 3 },
    { re: /^#\[test\]/,                            icon: "science",   label: "test",   nameIdx: 0, lookahead: true },
];

function extractSymbols(content) {
    const lines = content.split("\n");
    const symbols = [];
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        for (const { re, icon, label, nameIdx, lookahead } of SYMBOL_PATTERNS) {
            const m = trimmed.match(re);
            if (!m) continue;
            let name;
            if (lookahead) {
                // #[test] — беремо ім'я з наступного рядку
                const next = lines[i + 1]?.trim() ?? "";
                const fnMatch = next.match(/fn\s+(\w+)/);
                name = fnMatch ? fnMatch[1] : null;
                if (!name) continue;
                i++; // пропускаємо fn рядок
            } else {
                name = nameIdx > 0 ? (m[nameIdx] ?? trimmed.slice(0, 50)) : trimmed.slice(0, 50);
            }
            symbols.push({ name, icon, label, line: i + 1 });
            break;
        }
    }
    return symbols;
}

const LABEL_COLORS = {
    fn:       "#50fa7b",
    "async fn": "#50fa7b",
    struct:   "#8be9fd",
    enum:     "#ffb86c",
    trait:    "#ff79c6",
    impl:     "#bd93f9",
    mod:      "#f1fa8c",
    const:    "#ff5555",
    type:     "#8be9fd",
    static:   "#ff5555",
    test:     "#50fa7b",
};

/** Панель структури файлу — символи Rust із навігацією. */
export function OutlinePanel({ cmViewRef }) {
    const files      = useSelector((s) => s.collab.files);
    const activeFile = useSelector((s) => s.collab.activeFile);

    const content = (activeFile && files[activeFile]) ?? "";
    const symbols = useMemo(() => extractSymbols(content), [content]);

    const handleClick = (symbol) => {
        const view = cmViewRef?.current;
        if (!view) return;
        try {
            const line = view.state.doc.line(symbol.line);
            view.dispatch({
                selection: { anchor: line.from },
                effects: EditorView.scrollIntoView(line.from, { y: "center" }),
            });
            view.focus();
        } catch { /* рядок поза межами */ }
    };

    if (!activeFile) return (
        <div className="outline-panel outline-panel--empty">
            <span className="material-icons outline-empty-icon">insert_drive_file</span>
            <p className="outline-empty-text">Файл не відкрито</p>
        </div>
    );

    if (symbols.length === 0) return (
        <div className="outline-panel outline-panel--empty">
            <span className="material-icons outline-empty-icon">article</span>
            <p className="outline-empty-text">Символів не знайдено</p>
        </div>
    );

    return (
        <div className="outline-panel">
            <div className="outline-file-hint">{activeFile}</div>
            {symbols.map((sym, i) => (
                <button
                    key={i}
                    className="symbol-item"
                    onClick={() => handleClick(sym)}
                    title={`${sym.label} ${sym.name} — рядок ${sym.line}`}
                >
                    <span className="material-icons symbol-icon">{sym.icon}</span>
                    <span className="symbol-name">{sym.name}</span>
                    <span
                        className="symbol-label"
                        style={{ color: LABEL_COLORS[sym.label] ?? "#6272a4" }}
                    >
                        {sym.label}
                    </span>
                    <span className="symbol-line">{sym.line}</span>
                </button>
            ))}
        </div>
    );
}
