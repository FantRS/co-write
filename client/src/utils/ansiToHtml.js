// Dracula palette — відповідає кольорам теми редактора
const ANSI_FG = {
    "0":  "#282a36", "1": "#ff5555", "2": "#50fa7b", "3": "#f1fa8c",
    "4":  "#6272a4", "5": "#ff79c6", "6": "#8be9fd", "7": "#f8f8f2",
    "30": "#282a36", "31": "#ff5555", "32": "#50fa7b", "33": "#f1fa8c",
    "34": "#6272a4", "35": "#ff79c6", "36": "#8be9fd", "37": "#f8f8f2",
    "90": "#6272a4", "91": "#ff6e6e", "92": "#69ff47", "93": "#ffffa5",
    "94": "#d6acff", "95": "#ff92df", "96": "#a4ffff", "97": "#ffffff",
};

/**
 * Конвертує рядок з ANSI escape-кодами у безпечний HTML.
 * Підтримує: кольори (30-37, 90-97), жирний (1), скидання (0).
 */
export function ansiToHtml(raw) {
    const parts = [];
    let pos = 0;
    let bold = false;
    let color = null;

    const flush = (text) => {
        if (!text) return;
        // Ескейп HTML
        const escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        if (!bold && !color) {
            parts.push(escaped);
            return;
        }
        const styles = [];
        if (bold)  styles.push("font-weight:700");
        if (color) styles.push(`color:${color}`);
        parts.push(`<span style="${styles.join(";")}">${escaped}</span>`);
    };

    while (pos < raw.length) {
        const escIdx = raw.indexOf("\x1b[", pos);
        if (escIdx === -1) {
            flush(raw.slice(pos));
            break;
        }

        flush(raw.slice(pos, escIdx));

        const mEnd = raw.indexOf("m", escIdx + 2);
        if (mEnd === -1) {
            flush(raw.slice(escIdx));
            break;
        }

        const codes = raw.slice(escIdx + 2, mEnd).split(";");
        for (const code of codes) {
            const n = parseInt(code, 10);
            if (isNaN(n) || n === 0) {
                bold = false;
                color = null;
            } else if (n === 1) {
                bold = true;
            } else if (ANSI_FG[String(n)]) {
                color = ANSI_FG[String(n)];
            }
        }

        pos = mEnd + 1;
    }

    return parts.join("");
}

/** Видаляє всі ANSI escape-коди з рядка (для парсингу тексту). */
export function stripAnsi(raw) {
    return raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}
