import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearAuth } from "../store/slices/authSlice.js";
import { createDocEndpoint, getDocumentsEndpoint } from "../configs/paths.js";
import { useToast } from "../components/Toast.jsx";
import "../styles/Lobby.css";

const CARD_COLORS = [
    "#bd93f9", // purple
    "#50fa7b", // green
    "#ffb86c", // orange
    "#ff79c6", // pink
    "#8be9fd", // cyan
    "#f1fa8c", // yellow
    "#ff6e6e", // coral
    "#38f0c0", // teal
    "#ff9580", // peach
    "#a9dc76", // lime
    "#ffd57e", // gold
    "#78dcf0", // sky
    "#cf9af5", // lavender
    "#ff85a1", // rose
    "#5af78e", // mint
    "#ffca7a", // amber
];

function hashTitle(title) {
    let h = 5381;
    for (let i = 0; i < title.length; i++) {
        h = (Math.imul(h, 31) + title.charCodeAt(i)) >>> 0;
    }
    return h;
}

// Ukrainian/Russian Cyrillic → Latin transliteration for slugs
const CYR_MAP = {
    'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ie',
    'ж':'zh','з':'z','и':'y','і':'i','ї':'i','й':'y','к':'k','л':'l',
    'м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
    'ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'',
    'ю':'iu','я':'ia','ы':'y','э':'e','ъ':'','ё':'yo',
};

function toSlug(title) {
    return (title || "")
        .toLowerCase()
        .split("")
        .map((c) => CYR_MAP[c] ?? c)
        .join("")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9._-]/g, "")
        .replace(/^[-._]+|[-._]+$/g, "")
        || "untitled";
}

// Name must start with a letter (Latin or Cyrillic) or digit
const NAME_RE = /^[a-zA-Zа-яА-ЯіІїЇєЄ0-9][a-zA-Zа-яА-ЯіІїЇєЄ0-9 \-_.]*$/;

function formatDate(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Aurora background that follows mouse ───────────────────────────────────────

function AuroraBackground() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            el.style.setProperty("--ax", `${x}%`);
            el.style.setProperty("--ay", `${y}%`);
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    return (
        <div ref={ref} className="lb-aurora" aria-hidden="true">
            <div className="lb-orb lb-orb--1" />
            <div className="lb-orb lb-orb--2" />
            <div className="lb-orb lb-orb--3" />
            <div className="lb-grid" />
            <div className="lb-aurora-follow" />
        </div>
    );
}

// ── Typewriter greeting ────────────────────────────────────────────────────────

function TypewriterGreeting({ username }) {
    const [phase, setPhase] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const CMD = "whoami";
    const RESULT = username || "user";

    useEffect(() => {
        if (phase === 0) {
            if (displayed.length < CMD.length) {
                const t = setTimeout(() => setDisplayed(CMD.slice(0, displayed.length + 1)), 80);
                return () => clearTimeout(t);
            } else {
                const t = setTimeout(() => setPhase(1), 350);
                return () => clearTimeout(t);
            }
        }
        if (phase === 1) {
            const t = setTimeout(() => { setDisplayed(""); setPhase(2); }, 200);
            return () => clearTimeout(t);
        }
        if (phase === 2) {
            if (displayed.length < RESULT.length) {
                const t = setTimeout(() => setDisplayed(RESULT.slice(0, displayed.length + 1)), 60);
                return () => clearTimeout(t);
            }
        }
    }, [phase, displayed, CMD, RESULT]);

    const showResult = phase === 2;

    return (
        <div className="lb-hero-terminal">
            <div className="lb-term-line">
                <span className="lb-term-prompt">~/workspace</span>
                <span className="lb-term-dollar"> $ </span>
                <span className="lb-term-cmd">{phase >= 1 ? CMD : displayed}</span>
                {phase === 0 && <span className="lb-term-cursor" />}
            </div>
            {/* Always rendered — visibility:hidden reserves space so content never shifts */}
            <div
                className="lb-term-line lb-term-result-line"
                style={{ visibility: showResult ? "visible" : "hidden" }}
            >
                <span className="lb-term-arrow">→</span>
                <span className="lb-term-result">{showResult ? displayed : RESULT}</span>
                {showResult && displayed.length < RESULT.length && <span className="lb-term-cursor" />}
            </div>
        </div>
    );
}

// ── Animated stat counter ──────────────────────────────────────────────────────

function StatPill({ icon, value, label }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (value === 0) return;
        let current = 0;
        const step = Math.ceil(value / 16);
        const t = setInterval(() => {
            current = Math.min(current + step, value);
            setCount(current);
            if (current >= value) clearInterval(t);
        }, 40);
        return () => clearInterval(t);
    }, [value]);

    return (
        <div className="lb-stat-pill">
            <span className="material-icons lb-stat-icon">{icon}</span>
            <span className="lb-stat-value">{count}</span>
            <span className="lb-stat-label">{label}</span>
        </div>
    );
}

// ── Terminal create input ──────────────────────────────────────────────────────

function TerminalCreate({ docName, setDocName, onKeyDown, onSubmit, isCreating }) {
    const [focused, setFocused] = useState(false);
    const [cursorLeft, setCursorLeft] = useState(0);
    const inputRef = useRef(null);
    const mirrorRef = useRef(null);

    // Pixel-accurate cursor measurement via hidden mirror span
    const updateCursor = useCallback(() => {
        const input = inputRef.current;
        const mirror = mirrorRef.current;
        if (!input || !mirror) return;
        const pos = input.selectionStart ?? input.value.length;
        mirror.textContent = input.value.slice(0, pos);
        const paddingLeft = parseFloat(getComputedStyle(input).paddingLeft) || 0;
        setCursorLeft(mirror.offsetWidth + paddingLeft);
    }, []);

    // Re-measure when text changes
    useEffect(() => { updateCursor(); }, [docName, updateCursor]);

    return (
        <div className={`lb-terminal-create ${focused ? "lb-terminal-create--focused" : ""}`}>
            <div className="lb-tc-dots">
                <span className="lb-tc-dot lb-tc-dot--red" />
                <span className="lb-tc-dot lb-tc-dot--yellow" />
                <span className="lb-tc-dot lb-tc-dot--green" />
            </div>
            <div className="lb-tc-bar">
                <span className="lb-tc-prompt">~/workspace</span>
                <span className="lb-tc-dollar"> $ cargo new</span>
                <div className="lb-tc-input-wrap">
                    {/* Hidden mirror — same font as input, measures text width precisely */}
                    <span ref={mirrorRef} className="lb-tc-mirror" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        className="lb-tc-input"
                        type="text"
                        placeholder="назва-проєкту"
                        maxLength={120}
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        onKeyDown={onKeyDown}
                        onKeyUp={updateCursor}
                        onClick={updateCursor}
                        onSelect={updateCursor}
                        onFocus={() => { setFocused(true); requestAnimationFrame(updateCursor); }}
                        onBlur={() => setFocused(false)}
                        disabled={isCreating}
                        autoFocus
                    />
                    {/* Cursor AFTER input in DOM — paints on top, mix-blend-mode:difference inverts pixels below */}
                    {focused && !isCreating && (
                        <span
                            className="lb-tc-block-cursor"
                            style={{ left: `${cursorLeft}px` }}
                        />
                    )}
                </div>
                {isCreating ? (
                    <span className="lb-tc-spinner material-icons">autorenew</span>
                ) : (
                    <button className="lb-tc-enter" onClick={onSubmit} title="Створити">
                        <span className="lb-tc-enter-key">↵</span>
                    </button>
                )}
            </div>
            <div className="lb-tc-hint">натисніть Enter або ↵ щоб створити</div>
        </div>
    );
}

// ── Editor-style tab bar ───────────────────────────────────────────────────────

function EditorTabs({ activeTab, setActiveTab, myCount, sharedCount }) {
    return (
        <div className="lb-editor-tabs">
            <button
                className={`lb-editor-tab ${activeTab === "mine" ? "lb-editor-tab--active" : ""}`}
                onClick={() => setActiveTab("mine")}
            >
                <span className="material-icons">folder</span>
                <span>мої проєкти</span>
                <span className="lb-etab-badge">{myCount}</span>
            </button>
            <button
                className={`lb-editor-tab ${activeTab === "shared" ? "lb-editor-tab--active" : ""}`}
                onClick={() => setActiveTab("shared")}
            >
                <span className="material-icons">group</span>
                <span>спільні</span>
                <span className="lb-etab-badge">{sharedCount}</span>
            </button>
            <div className="lb-editor-tabs-fill" />
        </div>
    );
}

// ── File-style project card ────────────────────────────────────────────────────

function ProjectCard({ doc, onOpen, index }) {
    const title = doc.title || "";
    const color = CARD_COLORS[hashTitle(title) % CARD_COLORS.length];
    const cardRef = useRef(null);
    const slug = toSlug(title);

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--cx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--cy", `${e.clientY - rect.top}px`);
    };

    return (
        <div
            ref={cardRef}
            className="lb-file-card"
            style={{ "--accent": color, "--delay": `${index * 60}ms` }}
            onMouseMove={handleMouseMove}
            onClick={() => onOpen(doc.id)}
        >
            <div className="lb-fc-glow" />
            <div className="lb-fc-bar" />

            <div className="lb-fc-path">
                <span className="lb-fc-path-root">~/projects/</span>
                <span className="lb-fc-path-name">{slug}</span>
                <span className="lb-fc-path-ext">.cowrite</span>
            </div>

            <h3 className="lb-fc-title">{doc.title}</h3>

            <div className="lb-fc-lines" aria-hidden="true">
                <span className="lb-fc-line" style={{ width: "70%" }} />
                <span className="lb-fc-line" style={{ width: "45%" }} />
                <span className="lb-fc-line" style={{ width: "58%" }} />
            </div>

            <div className="lb-fc-footer">
                <div className="lb-fc-meta">
                    {doc.is_owner
                        ? <span className="lb-fc-owner-badge"><span className="material-icons">star</span>власник</span>
                        : <span className="lb-fc-owner-badge"><span className="material-icons">person</span>{doc.owner_username}</span>
                    }
                    <span className="lb-fc-date">{formatDate(doc.updated_at)}</span>
                </div>
                <div className="lb-fc-open">
                    <span className="material-icons">arrow_forward</span>
                </div>
            </div>
        </div>
    );
}

// ── Lobby ──────────────────────────────────────────────────────────────────────

export function Lobby() {
    const [docName, setDocName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState("mine");
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const showToast = useToast();
    const { token, username } = useSelector((s) => s.auth);

    const loadProjects = useCallback(async () => {
        if (!token) return;
        setLoadingProjects(true);
        try {
            const res = await fetch(getDocumentsEndpoint(), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setProjects(await res.json());
            } else if (res.status === 401) {
                dispatch(clearAuth());
                navigate("/login");
            }
        } catch (e) {
            console.error("Помилка завантаження проєктів:", e);
        } finally {
            setLoadingProjects(false);
        }
    }, [token, dispatch, navigate]);

    useEffect(() => { loadProjects(); }, [loadProjects]);

    const handleCreate = async () => {
        const name = docName.trim();
        if (!name) { showToast("Введіть назву проєкту"); return; }
        if (!NAME_RE.test(name)) {
            showToast("Назва повинна починатись з літери або цифри");
            return;
        }
        setIsCreating(true);
        try {
            const res = await fetch(createDocEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "text/plain", Authorization: `Bearer ${token}` },
                body: name,
                mode: "cors",
            });
            if (!res.ok) throw new Error();
            const documentId = await res.text();
            showToast("Проєкт створено!");
            await loadProjects();
            setDocName("");
            setTimeout(() => navigate(`/editor?id=${documentId}`), 300);
        } catch {
            showToast("Помилка створення проєкту");
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e) => { if (e.key === "Enter") handleCreate(); };

    const handleLogout = () => {
        dispatch(clearAuth());
        navigate("/login");
    };

    const myProjects = projects.filter((p) => p.is_owner);
    const sharedProjects = projects.filter((p) => !p.is_owner);
    const visible = activeTab === "mine" ? myProjects : sharedProjects;

    return (
        <main className="lb-root">
            <AuroraBackground />

            <header className="lb-header">
                <div className="lb-brand">
                    <div className="lb-brand-icon">
                        <span className="material-icons">code</span>
                    </div>
                    <span className="lb-brand-name">Co-Write</span>
                    <span className="lb-brand-sep">/</span>
                    <span className="lb-brand-path">{username}</span>
                </div>
                <div className="lb-header-right">
                    <div className="lb-header-stats">
                        <StatPill icon="folder" value={myProjects.length} label="проєктів" />
                        <StatPill icon="group" value={sharedProjects.length} label="спільних" />
                    </div>
                    <button className="lb-logout" onClick={handleLogout}>
                        <span className="material-icons">logout</span>
                        <span>вийти</span>
                    </button>
                </div>
            </header>

            <div className="lb-body">
                <section className="lb-hero">
                    <TypewriterGreeting username={username} />
                </section>

                <section className="lb-create-section">
                    <TerminalCreate
                        docName={docName}
                        setDocName={setDocName}
                        onKeyDown={handleKeyDown}
                        onSubmit={handleCreate}
                        isCreating={isCreating}
                    />
                </section>

                <section className="lb-projects-section">
                    <EditorTabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        myCount={myProjects.length}
                        sharedCount={sharedProjects.length}
                    />

                    <div className="lb-projects-body">
                        {loadingProjects ? (
                            <div className="lb-empty">
                                <span className="material-icons lb-spin">sync</span>
                                <span>завантаження...</span>
                            </div>
                        ) : visible.length === 0 ? (
                            <div className="lb-empty">
                                <span className="lb-empty-prompt">
                                    {activeTab === "mine"
                                        ? "$ ls ~/projects → (empty)"
                                        : "$ ls ~/shared → (empty)"}
                                </span>
                                <span className="lb-empty-hint">
                                    {activeTab === "mine"
                                        ? "Створіть перший проєкт вище"
                                        : "Вас ще не запросили до жодного проєкту"}
                                </span>
                            </div>
                        ) : (
                            <div className="lb-grid-cards">
                                {visible.map((doc, i) => (
                                    <ProjectCard
                                        key={doc.id}
                                        doc={doc}
                                        index={i}
                                        onOpen={(id) => navigate(`/editor?id=${id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <footer className="lb-statusbar">
                <div className="lb-sb-left">
                    <span className="lb-sb-branch">
                        <span className="material-icons">merge_type</span>
                        main
                    </span>
                    <span className="lb-sb-sep">|</span>
                    <span>Co-Write Workspace</span>
                </div>
                <div className="lb-sb-right">
                    <span>UTF-8</span>
                    <span className="lb-sb-sep">|</span>
                    <span>Rust</span>
                </div>
            </footer>
        </main>
    );
}
