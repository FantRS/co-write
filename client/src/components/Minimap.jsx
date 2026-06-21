import React, { useRef, useEffect, useCallback, useState } from "react";
import { useSelector } from "react-redux";

const MINIMAP_WIDTH = 80;
const LINE_HEIGHT   = 2;       // px на рядок у мінімапі
const CHAR_SCALE    = 0.4;     // px на символ

const BG_COLOR   = "#06070d";
const TEXT_COLOR = "rgba(248,248,242,0.35)";
const KEYWORD_COLOR = "rgba(189,147,249,0.6)";
const COMMENT_COLOR = "rgba(98,114,164,0.5)";
const STRING_COLOR  = "rgba(241,250,140,0.5)";
const VP_COLOR   = "rgba(189,147,249,0.08)";
const VP_BORDER  = "rgba(189,147,249,0.2)";

// Спрощений детектор типу рядку для кольорування мінімапу
function getLineColor(line) {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("/*") || t.startsWith("*")) return COMMENT_COLOR;
    if (/^(fn |pub |struct |enum |impl |trait |mod |use |let |const |type |static )/.test(t)) return KEYWORD_COLOR;
    if (t.includes('"') || t.includes("'")) return STRING_COLOR;
    return TEXT_COLOR;
}

/** Мінімап — canvas-представлення коду з viewport-прямокутником. */
export function Minimap({ cmViewRef }) {
    const canvasRef  = useRef(null);
    const vpRef      = useRef(null);
    const files      = useSelector((s) => s.collab.files);
    const activeFile = useSelector((s) => s.collab.activeFile);
    const isDragging = useRef(false);

    const getContent = useCallback(() => {
        if (activeFile && files[activeFile]) return files[activeFile];
        return cmViewRef?.current?.state.doc.toString() ?? "";
    }, [activeFile, files, cmViewRef]);

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const content = getContent();
        const lines   = content.split("\n");
        const height  = Math.max(lines.length * LINE_HEIGHT, 200);

        canvas.width  = MINIMAP_WIDTH * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width  = `${MINIMAP_WIDTH}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d");
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, MINIMAP_WIDTH, height);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            const w = Math.min(line.length * CHAR_SCALE, MINIMAP_WIDTH - 4);
            if (w <= 0) continue;
            ctx.fillStyle = getLineColor(line);
            ctx.fillRect(2, i * LINE_HEIGHT, w, LINE_HEIGHT - 0.5);
        }
    }, [getContent]);

    const updateViewport = useCallback(() => {
        const view = cmViewRef?.current;
        const vp   = vpRef.current;
        const canvas = canvasRef.current;
        if (!view || !vp || !canvas) return;

        const dom         = view.scrollDOM;
        const scrollTop   = dom.scrollTop;
        const clientHeight = dom.clientHeight;
        const scrollHeight = dom.scrollHeight;

        if (scrollHeight === 0) return;

        const canvasH  = canvas.offsetHeight;
        const ratio    = canvasH / scrollHeight;
        const vpTop    = scrollTop * ratio;
        const vpHeight = Math.max(clientHeight * ratio, 20);

        vp.style.top    = `${vpTop}px`;
        vp.style.height = `${vpHeight}px`;
    }, [cmViewRef]);

    // Перемальовуємо canvas при зміні контенту
    useEffect(() => {
        drawCanvas();
        // Оновлюємо viewport після перемальовки
        requestAnimationFrame(updateViewport);
    }, [activeFile, files, drawCanvas, updateViewport]);

    // Підписуємось на scroll
    useEffect(() => {
        const view = cmViewRef?.current;
        if (!view) return;
        const dom = view.scrollDOM;
        dom.addEventListener("scroll", updateViewport, { passive: true });
        updateViewport();
        return () => dom.removeEventListener("scroll", updateViewport);
    }, [cmViewRef, updateViewport, activeFile]);

    const scrollTo = useCallback((y) => {
        const view   = cmViewRef?.current;
        const canvas = canvasRef.current;
        if (!view || !canvas) return;
        const canvasH = canvas.offsetHeight;
        const dom = view.scrollDOM;
        const ratio = dom.scrollHeight / canvasH;
        dom.scrollTop = y * ratio;
    }, [cmViewRef]);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) scrollTo(e.clientY - rect.top);
    };

    useEffect(() => {
        const onMove = (e) => {
            if (!isDragging.current) return;
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) scrollTo(e.clientY - rect.top);
        };
        const onUp = () => { isDragging.current = false; };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [scrollTo]);

    return (
        <div className="minimap-container" onMouseDown={handleMouseDown}>
            <canvas ref={canvasRef} className="minimap-canvas" />
            <div ref={vpRef} className="minimap-viewport" />
        </div>
    );
}
