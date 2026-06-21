import { getCompleteEndpoint } from "../configs/paths.js";
import { marked } from "marked";

// ── LSP CompletionItemKind → CodeMirror type ──────────────────────────────────
// https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionItemKind
const LSP_KIND_MAP = {
    1:  "text",
    2:  "method",
    3:  "function",
    4:  "function",   // Constructor
    5:  "property",   // Field
    6:  "variable",
    7:  "class",
    8:  "interface",  // Interface
    9:  "namespace",  // Module
    10: "property",
    11: "unit",
    12: "constant",
    13: "constant",
    14: "keyword",
    15: "text",       // Snippet
    16: "constant",   // Color
    17: "constant",   // File
    18: "text",       // Reference
    19: "namespace",  // Folder
    20: "property",   // EnumMember
    21: "constant",   // Constant
    22: "type",       // Struct
    23: "text",       // Event
    24: "text",       // Operator
    25: "type",       // TypeParameter
};

const RUST_KIND_LABELS = {
    1:  "text",
    2:  "fn",        // method
    3:  "fn",        // function
    4:  "fn",        // constructor
    5:  "field",     // property
    6:  "var",       // variable
    7:  "class",     // class
    8:  "trait",     // interface / trait
    9:  "mod",       // module / namespace
    10: "property",  // property
    11: "unit",
    12: "enum",      // constant / enum
    13: "enum",
    14: "keyword",   // keyword
    15: "snippet",   // snippet
    16: "color",
    17: "file",
    18: "ref",
    19: "folder",
    20: "variant",   // EnumMember
    21: "const",     // Constant
    22: "struct",    // Struct
    23: "event",
    24: "op",        // Operator
    25: "type",      // TypeParameter
};

// ── Кеш результатів (per-prefix, TTL 5 сек) ──────────────────────────────────
const cache = new Map(); // key → { items, ts }
const CACHE_TTL = 5000;

function cacheKey(docId, filePath, line, ch, prefix) {
    return `${docId}:${filePath}:${line}:${ch}:${prefix}`;
}

// ── Основний LSP autocompletion source для CodeMirror ────────────────────────

/**
 * Фабрика LSP completion source.
 * Повертає функцію-джерело для передачі в `autocompletion({ override: [...] })`.
 *
 * @param {object} opts
 * @param {string}   opts.documentId  - UUID документа
 * @param {Function} opts.getFiles    - () => { [path]: content }
 * @param {Function} opts.getActivePath - () => string (поточний відносний шлях)
 */
export function createLspCompletionSource({ documentId, getFiles, getActivePath }) {
    return async function lspCompletionSource(context) {
        // Resolve documentId dynamically if it is a function
        const docId = typeof documentId === "function" ? documentId() : documentId;
        if (!docId) return null;

        // Matches word characters, colons, or dots (e.g. std::collections::H, my_struct.field)
        const wordMatch = context.matchBefore(/[\w:.]*/);
        if (!wordMatch) return null;
        if (wordMatch.from === wordMatch.to && !context.explicit) return null;

        const filePath   = getActivePath();
        const fileContent = context.state.doc.toString();
        const files      = { ...getFiles(), [filePath]: fileContent };

        // ВАЖЛИВО: беремо вміст напряму з CodeMirror стану, а не з Redux store
        // Redux store оновлюється з затримкою 300ms (debounce), тому може бути застарілим

        // Перетворюємо offset → line/character
        const offset = context.pos;
        const textBefore = fileContent.slice(0, offset);
        const lines = textBefore.split("\n");
        const line  = lines.length - 1;
        const character = lines[lines.length - 1].length;

        // Calculate replacement offset starting AFTER the last separator (:: or .)
        let fromOffset = wordMatch.from;
        const matchText = wordMatch.text;
        const lastDoubleColon = matchText.lastIndexOf("::");
        const lastDot = matchText.lastIndexOf(".");

        if (lastDoubleColon !== -1) {
            fromOffset += lastDoubleColon + 2;
        } else if (lastDot !== -1) {
            fromOffset += lastDot + 1;
        }

        console.debug("[LSP Autocomplete] WordMatch:", matchText, "from:", wordMatch.from, "to:", wordMatch.to, "calculated fromOffset:", fromOffset);

        const prefix = wordMatch.text;
        const key    = cacheKey(docId, filePath, line, character, prefix);

        // Перевіряємо кеш
        const cached = cache.get(key);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            console.debug("[LSP Autocomplete] Found in cache, items count:", cached.items.length);
            return buildResult(fromOffset, cached.items);
        }

        // Запит до бекенду
        console.debug("[LSP Autocomplete] Querying backend at", line, character, "file:", filePath);
        let lspItems;
        try {
            const res = await fetch(getCompleteEndpoint(docId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    files,
                    file_path: filePath,
                    line,
                    character,
                }),
                signal: AbortSignal.timeout(35000), // 35 сек (перший запит: 2s init + 3 retries = ~11s)
            });

            if (!res.ok) {
                console.warn("[LSP Autocomplete] Backend returned error status:", res.status);
                return null;
            }
            const data = await res.json();
            lspItems = data.items ?? [];
            console.debug("[LSP Autocomplete] Backend items received:", lspItems.length);
        } catch (e) {
            // Не блокуємо роботу при помилці LSP
            console.warn("[LSP Autocomplete] Network/Timeout error:", e.message);
            return null;
        }

        const options = lspItems.map(item => mapToCodeMirror(item));
        if (options.length > 0) {
            cache.set(key, { items: options, ts: Date.now() });
        }

        console.debug("[LSP Autocomplete] Returning CM6 options count:", options.length, "fromOffset:", fromOffset);
        return buildResult(fromOffset, options);
    };
}

// ── Перетворення LSP item → CodeMirror completion ─────────────────────────────

function mapToCodeMirror(item) {
    const cmType = LSP_KIND_MAP[item.kind] ?? "text";
    const cleanKind = RUST_KIND_LABELS[item.kind] ?? cmType;

    // rust-analyzer надсилає snippets у insertText якщо insertTextFormat=2
    const isSnippet = item.insertTextFormat === 2;
    const applyText = item.insertText ?? item.label;
    const insertText = isSnippet ? stripSnippetPlaceholders(applyText) : applyText;

    // Бекенд вже повертає готовий markdown у тому ж форматі що й hover —
    // ```rust\n<сигнатура>\n``` + документація. Просто передаємо його в renderMarkdown.
    return {
        label:   item.label,
        type:    cmType,
        detail:  cleanKind,
        info:    item.markdown ? () => renderMarkdown(item.markdown) : undefined,
        apply:   insertText,
        boost:   getBoost(item.kind),
    };
}

/**
 * Повертає URL документації для заданого символу Rust.
 */
function getDocumentationUrl(symbol) {
    const trimmed = symbol.trim();
    // Стандартні типи Rust
    const stdTypes = [
        "Option", "Result", "String", "Vec", "Box", "Pin", "Future", "Rc", "Arc", 
        "Cell", "RefCell", "HashMap", "BTreeMap", "HashSet", "BTreeSet", "Result",
        "u8", "u16", "u32", "u64", "u128", "usize",
        "i8", "i16", "i32", "i64", "i128", "isize",
        "f32", "f64", "str", "bool", "char"
    ];
    
    if (
        trimmed.startsWith("std::") || 
        trimmed.startsWith("core::") || 
        trimmed.startsWith("alloc::") || 
        stdTypes.includes(trimmed)
    ) {
        return `https://doc.rust-lang.org/stable/std/?search=${encodeURIComponent(trimmed)}`;
    }
    // Для сторонніх крейтів та локальних символів шукаємо на docs.rs
    return `https://docs.rs/releases/search?query=${encodeURIComponent(trimmed)}`;
}

/**
 * Рендерить простий Markdown-текст в HTML DOM вузол для відображення в CodeMirror.
 */
export function renderMarkdown(text) {
    const container = document.createElement("div");
    container.className = "markdown-body";

    if (!text) return container;

    try {
        // Розділяємо текст по блоках коду, щоб не перетворювати квадратні дужки всередині коду (наприклад, масиви [1, 2])
        const parts = text.split("```");
        for (let i = 0; i < parts.length; i++) {
            // Парні індекси — це звичайний Markdown текст, непарні — код всередині ```
            if (i % 2 === 0) {
                parts[i] = parts[i].replace(
                    /(?<!\!)(?<!\\)\[(`?)([a-zA-Z0-9_::\<\>\&\'\s\-]+)\1\](?!\(|\[)/g,
                    (match, backtick, symbol) => {
                        const url = getDocumentationUrl(symbol);
                        return `[${backtick}${symbol}${backtick}](${url})`;
                    }
                );
            }
        }
        const processedText = parts.join("```");

        // Рендеримо за допомогою бібліотеки marked
        container.innerHTML = marked.parse(processedText);
        
        // Всі посилання в документації повинні відкриватися в новій вкладці
        const links = container.querySelectorAll("a");
        links.forEach(link => {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
        });
    } catch (err) {
        console.error("Error rendering Markdown with marked:", err);
        container.textContent = text;
    }

    return container;
}

/**
 * Видаляє табстопи зі snippet-рядка rust-analyzer.
 * $0, $1, ${1:placeholder} → "placeholder" або ""
 */
function stripSnippetPlaceholders(text) {
    return text
        .replace(/\$\{(\d+):([^}]*)\}/g, "$2")  // ${1:placeholder} → placeholder
        .replace(/\$\{(\d+)\}/g, "")             // ${1} → ""
        .replace(/\$\d+/g, "");                  // $0 → ""
}

/** Вищий boost = вище у списку. */
function getBoost(kind) {
    // Highly boost actual Rust code symbols (functions, structs, enums, constants, modules, traits, etc.)
    if (kind === 3 || kind === 2 || kind === 4) return 100; // Function, Method, Constructor
    if (kind === 22 || kind === 13 || kind === 7 || kind === 8 || kind === 25) return 90; // Struct, Enum, Class, Interface/Trait, TypeParameter
    if (kind === 21 || kind === 20 || kind === 5 || kind === 10) return 80; // Constant, EnumMember, Field, Property
    if (kind === 9 || kind === 19) return 70; // Module, Namespace, Folder
    if (kind === 6) return 60; // Variable
    if (kind === 14) return 10; // Keyword
    return 0; // Text, Snippet, etc.
}

function buildResult(from, options) {
    return {
        from,
        options,
        filter: true,       // CodeMirror сам фільтрує по введеному тексту
        validFor: /^[\w]*$/, // Фільтруємо по слову після роздільника
    };
}
