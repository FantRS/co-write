import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { openTab } from "../store/slices/collabSlice.js";
import { EditorView } from "@codemirror/view";

/** Панель проблем — показує помилки та попередження після збірки. */
export function ProblemsPanel({ cmViewRef }) {
    const dispatch   = useDispatch();
    const diagnostics = useSelector((s) => s.collab.diagnostics);
    const activeFile  = useSelector((s) => s.collab.activeFile);

    const errors   = useMemo(() => diagnostics.filter(d => d.type === "error"),   [diagnostics]);
    const warnings = useMemo(() => diagnostics.filter(d => d.type === "warning"), [diagnostics]);

    if (diagnostics.length === 0) return (
        <div className="problems-panel problems-panel--empty">
            <span className="material-icons problems-empty-icon">check_circle</span>
            <p className="problems-empty-text">Помилок не знайдено</p>
        </div>
    );

    const handleClick = (diag) => {
        const isSameFile = !diag.file || diag.file === activeFile;

        if (!isSameFile && diag.file) {
            dispatch(openTab(diag.file));
        }

        if (!diag.line) return;

        const scrollToLine = () => {
            const view = cmViewRef?.current;
            if (!view) return;
            try {
                const line = view.state.doc.line(diag.line);
                const pos  = line.from + Math.max(0, Math.min((diag.col ?? 1) - 1, line.length));
                view.dispatch({
                    selection: { anchor: pos },
                    effects: EditorView.scrollIntoView(pos, { y: "center" }),
                });
                view.focus();
            } catch { /* рядок поза межами */ }
        };

        if (isSameFile) {
            scrollToLine();
        } else {
            setTimeout(scrollToLine, 150);
        }
    };

    return (
        <div className="problems-panel">
            {errors.length > 0 && (
                <div className="problems-group">
                    <div className="problems-group-header problems-group-header--error">
                        <span className="material-icons">error</span>
                        <span>Помилки ({errors.length})</span>
                    </div>
                    {errors.map((d, i) => (
                        <ProblemItem key={i} diag={d} onClick={handleClick} />
                    ))}
                </div>
            )}
            {warnings.length > 0 && (
                <div className="problems-group">
                    <div className="problems-group-header problems-group-header--warning">
                        <span className="material-icons">warning</span>
                        <span>Попередження ({warnings.length})</span>
                    </div>
                    {warnings.map((d, i) => (
                        <ProblemItem key={i} diag={d} onClick={handleClick} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ProblemItem({ diag, onClick }) {
    const isError = diag.type === "error";
    return (
        <button
            className={`problem-item problem-item--${isError ? "error" : "warning"}`}
            onClick={() => onClick(diag)}
            title={diag.message}
        >
            <span className={`material-icons problem-icon`}>
                {isError ? "error_outline" : "warning_amber"}
            </span>
            <div className="problem-content">
                <span className="problem-message">
                    {diag.code && <span className="problem-code">[{diag.code}]</span>}
                    {diag.message}
                </span>
                {(diag.file || diag.line) && (
                    <span className="problem-location">
                        {diag.file && `${diag.file}`}
                        {diag.line && `:${diag.line}`}
                        {diag.col  && `:${diag.col}`}
                    </span>
                )}
            </div>
        </button>
    );
}
