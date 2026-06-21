import React from "react";

function getFileIcon(name) {
    if (name.endsWith(".rs"))   return "code";
    if (name.endsWith(".toml")) return "settings";
    if (name.endsWith(".md"))   return "article";
    if (name.endsWith(".json")) return "data_object";
    if (name.endsWith(".txt"))  return "text_snippet";
    return "insert_drive_file";
}

/** Breadcrumb навігація — показує шлях до активного файлу над редактором. */
export function Breadcrumb({ path }) {
    if (!path) return null;

    const parts = path.split("/");

    return (
        <div className="ed-breadcrumb" aria-label="Шлях до файлу">
            {parts.map((part, i) => {
                const isLast = i === parts.length - 1;
                return (
                    <React.Fragment key={i}>
                        {i > 0 && (
                            <span className="ed-breadcrumb-sep" aria-hidden="true">›</span>
                        )}
                        <span className={`ed-breadcrumb-part${isLast ? " ed-breadcrumb-part--active" : ""}`}>
                            <span className="material-icons ed-breadcrumb-icon" aria-hidden="true">
                                {isLast ? getFileIcon(part) : "folder"}
                            </span>
                            {part}
                        </span>
                    </React.Fragment>
                );
            })}
        </div>
    );
}
