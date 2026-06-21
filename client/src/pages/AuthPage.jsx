import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/slices/authSlice.js";
import { authLoginEndpoint, authRegisterEndpoint } from "../configs/paths.js";
import "../styles/Auth.css";

// ── Floating code particles ────────────────────────────────────────────────────

const RUST_TOKENS = [
    "fn main()", "let mut", "impl Trait", "&self", "Vec<T>",
    "match x {", "-> Result", "use std::", "struct Co {", "pub fn",
    "async fn", "await?", "Arc::new", "Box<dyn>", "Option<T>",
    "|x| x + 1", "unwrap()", "HashMap", "#[derive]", "Rc::clone",
    "tokio::spawn", "serde::Serialize", "String::new()", "::<>",
];

function CodeParticles() {
    const count = 18;
    const particles = useRef(
        Array.from({ length: count }, (_, i) => ({
            id: i,
            token: RUST_TOKENS[i % RUST_TOKENS.length],
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 11 + Math.random() * 5,
            speed: 0.008 + Math.random() * 0.014,
            opacity: 0.12 + Math.random() * 0.19,
            phase: Math.random() * Math.PI * 2,
            drift: (Math.random() - 0.5) * 0.018,
        }))
    );

    const frameRef = useRef(null);
    const containerRef = useRef(null);
    const timeRef = useRef(0);

    useEffect(() => {
        const items = containerRef.current?.querySelectorAll(".cp-token");
        if (!items) return;

        const animate = () => {
            timeRef.current += 0.016;
            particles.current.forEach((p, i) => {
                p.y -= p.speed;
                p.x += Math.sin(timeRef.current * p.speed * 40 + p.phase) * p.drift;
                if (p.y < -5) { p.y = 105; p.x = Math.random() * 100; }
                if (p.x < -10) p.x = 110;
                if (p.x > 110) p.x = -10;
                const el = items[i];
                if (el) {
                    el.style.transform = `translate(${p.x}vw, ${p.y}vh)`;
                    el.style.opacity = p.opacity;
                }
            });
            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    return (
        <div ref={containerRef} className="code-particles" aria-hidden="true">
            {particles.current.map((p) => (
                <span
                    key={p.id}
                    className="cp-token"
                    style={{
                        fontSize: `${p.size}px`,
                        transform: `translate(${p.x}vw, ${p.y}vh)`,
                        opacity: p.opacity,
                    }}
                >
                    {p.token}
                </span>
            ))}
        </div>
    );
}

// ── Animated input field ───────────────────────────────────────────────────────

function AnimatedInput({ id, type, placeholder, value, onChange, disabled, icon, autoFocus }) {
    const [focused, setFocused] = useState(false);
    const lineRef = useRef(null);

    return (
        <div className={`ai-wrapper ${focused ? "ai-wrapper--focused" : ""}`}>
            <div className="ai-icon">
                <span className="material-icons">{icon}</span>
            </div>
            <input
                id={id}
                className="ai-input"
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                autoFocus={autoFocus}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete={
                    type === "password"
                        ? id.includes("confirm") ? "new-password" : "current-password"
                        : "username"
                }
            />
            <div className="ai-line">
                <div ref={lineRef} className={`ai-line-fill ${focused ? "ai-line-fill--active" : ""}`} />
            </div>
        </div>
    );
}

// ── Liquid tab indicator ───────────────────────────────────────────────────────

function LiquidTabs({ mode, setMode, setError }) {
    return (
        <div className="liquid-tabs">
            <div
                className="liquid-indicator"
                style={{ transform: `translateX(${mode === "login" ? "0%" : "100%"})` }}
            />
            <button
                id="auth-tab-login"
                className={`liquid-tab ${mode === "login" ? "liquid-tab--active" : ""}`}
                onClick={() => { setMode("login"); setError(""); }}
            >
                Увійти
            </button>
            <button
                id="auth-tab-register"
                className={`liquid-tab ${mode === "register" ? "liquid-tab--active" : ""}`}
                onClick={() => { setMode("register"); setError(""); }}
            >
                Реєстрація
            </button>
        </div>
    );
}

// ── Main AuthPage ──────────────────────────────────────────────────────────────

export function AuthPage() {
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const cardRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // ── 3D tilt on mouse move ────────────────────────────────────────────────
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMove = (e) => {
            const rect = card.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            const rx = dy * -6;   // max ±6°
            const ry = dx * 6;
            card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;

            // Move highlight spot
            const px = ((e.clientX - rect.left) / rect.width) * 100;
            const py = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty("--mx", `${px}%`);
            card.style.setProperty("--my", `${py}%`);
        };

        const handleLeave = () => {
            card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseleave", handleLeave);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseleave", handleLeave);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!username.trim() || !password.trim()) {
            setError("Заповніть всі поля");
            return;
        }
        if (mode === "register" && password !== confirmPassword) {
            setError("Паролі не збігаються");
            return;
        }

        setLoading(true);
        try {
            const endpoint = mode === "login" ? authLoginEndpoint() : authRegisterEndpoint();
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password }),
                mode: "cors",
            });

            if (!res.ok) {
                const msg = await res.text();
                setError(msg || "Помилка авторизації");
                return;
            }

            const data = await res.json();
            setSuccess(true);
            setTimeout(() => {
                dispatch(setAuth(data));
                navigate("/");
            }, 600);
        } catch (err) {
            setError("Помилка підключення до сервера");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            {/* Animated mesh background */}
            <div className="auth-mesh" aria-hidden="true">
                <div className="auth-orb auth-orb--1" />
                <div className="auth-orb auth-orb--2" />
                <div className="auth-orb auth-orb--3" />
                <div className="auth-grid" />
            </div>

            {/* Floating Rust code particles */}
            <CodeParticles />

            {/* Card */}
            <div
                ref={cardRef}
                className={`auth-card ${success ? "auth-card--success" : ""}`}
                style={{ "--mx": "50%", "--my": "50%" }}
            >
                {/* Spotlight overlay */}
                <div className="auth-card-spotlight" />

                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <span className="material-icons">code</span>
                        <div className="auth-logo-ring" />
                    </div>
                    <h1 className="auth-brand">Co-Write</h1>
                </div>

                {/* Liquid tabs */}
                <LiquidTabs mode={mode} setMode={setMode} setError={setError} />

                {/* Form */}
                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                    key={mode}   /* remount + animate fields on mode change */
                >
                    <div className="auth-fields">
                        <AnimatedInput
                            id="auth-username"
                            type="text"
                            placeholder="Ім'я користувача"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            icon="person"
                            autoFocus
                        />

                        <AnimatedInput
                            id="auth-password"
                            type="password"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            icon="lock"
                        />

                        {mode === "register" && (
                            <AnimatedInput
                                id="auth-confirm-password"
                                type="password"
                                placeholder="Підтвердіть пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                icon="lock_reset"
                            />
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="auth-error">
                            <span className="material-icons">error_outline</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        id="auth-submit-btn"
                        type="submit"
                        className={`auth-submit-btn ${loading ? "auth-submit-btn--loading" : ""} ${success ? "auth-submit-btn--success" : ""}`}
                        disabled={loading || success}
                    >
                        <span className="auth-submit-content">
                            {success ? (
                                <>
                                    <span className="material-icons">check_circle</span>
                                    <span>Готово!</span>
                                </>
                            ) : loading ? (
                                <>
                                    <span className="material-icons auth-spin">autorenew</span>
                                    <span>Завантаження...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-icons">
                                        {mode === "login" ? "login" : "person_add"}
                                    </span>
                                    <span>{mode === "login" ? "Увійти" : "Зареєструватися"}</span>
                                </>
                            )}
                        </span>
                        <span className="auth-submit-shimmer" />
                    </button>
                </form>
            </div>
        </div>
    );
}
