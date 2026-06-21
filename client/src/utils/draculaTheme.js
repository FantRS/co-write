import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// ── Dracula Theme UI Colors ──────────────────────────────────────────────────
export const draculaTheme = EditorView.theme(
  {
    "&": {
      color: "#f8f8f2",
      backgroundColor: "#282a36",
    },
    ".cm-content": {
      caretColor: "#f8f8f0",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#f8f8f0",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "#44475a !important",
    },
    ".cm-panels": {
      backgroundColor: "#1e1f29",
      color: "#f8f8f2",
    },
    ".cm-panels.cm-panels-top": {
      borderBottom: "1px solid #343746",
    },
    ".cm-panels.cm-panels-bottom": {
      borderTop: "1px solid #343746",
    },
    ".cm-searchMatch": {
      backgroundColor: "#ffb86c55",
      outline: "1px solid #ffb86c",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#ff79c655",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(68, 71, 90, 0.15)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent !important",
      color: "#bd93f9 !important", /* Highlight line number in purple */
    },
    ".cm-selectionMatch": {
      backgroundColor: "#44475a77",
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "#bd93f940 !important",
      outline: "1px solid #bd93f9aa !important",
    },
    ".cm-gutters": {
      backgroundColor: "#282a36",
      color: "#6272a4",
      borderRight: "1px solid #343746",
    },
    ".cm-gutterElement": {
      paddingLeft: "12px !important",
      paddingRight: "12px !important",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "transparent",
      border: "none",
      color: "#bd93f9",
    },
    ".cm-tooltip": {
      border: "1px solid #343746",
      backgroundColor: "#1e1f29",
      color: "#f8f8f2",
      borderRadius: "6px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "#1e1f29",
      borderBottomColor: "#1e1f29",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul": {
        maxHeight: "280px !important",
      },
      "& > ul > li": {
        display: "flex !important",
        justifyContent: "space-between !important",
        alignItems: "center !important",
        gap: "24px !important",
        padding: "4px 10px !important",
        fontSize: "13px !important",
        fontFamily: "var(--font-code) !important",
      },
      "& > ul > li[aria-selected]": {
        backgroundColor: "#44475a !important",
        color: "#f8f8f2 !important",
      },
    },
    ".cm-completionIcon": {
      display: "inline-block !important",
      width: "16px !important",
      marginRight: "6px !important",
      opacity: "0.8 !important",
    },
    ".cm-completionLabel": {
      fontFamily: "var(--font-code) !important",
      fontSize: "13px !important",
      color: "#f8f8f2 !important",
    },
    ".cm-completionDetail": {
      marginLeft: "auto !important",
      opacity: "0.55 !important",
      fontSize: "11px !important",
      fontStyle: "normal !important",
      paddingLeft: "10px !important",
      color: "#bd93f9 !important", /* Nice Dracula Purple for kind label */
    },
    ".cm-matchedWord": {
      color: "#8be9fd !important", /* Dracula Cyan matched characters */
      fontWeight: "bold !important",
    },
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo": {
      top: "0 !important",
      maxHeight: "350px !important",
      overflowY: "auto !important",
      padding: "16px !important",
      backgroundColor: "#1e1f29 !important",
      borderLeft: "1px solid #343746 !important",
      borderTop: "none !important",
      fontFamily: "var(--font-sans) !important", /* Regular MD font */
      fontSize: "13px !important",
      lineHeight: "1.6 !important",
      color: "#f8f8f2 !important",
      whiteSpace: "normal !important", /* Allow standard HTML wrapping */
      width: "420px !important",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3) !important",
    },
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo p": {
      margin: "0 0 10px 0 !important",
      lineHeight: "1.6 !important",
    },
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo h1, .cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo h2, .cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo h3": {
      fontFamily: "var(--font-sans) !important",
      color: "#f8f8f2 !important", /* Regular MD white headers */
      fontWeight: "bold !important",
      margin: "14px 0 8px 0 !important",
    },
    /* Only elements in backticks or code blocks use Markdown code block styling */
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo pre": {
      backgroundColor: "rgba(0, 0, 0, 0.22) !important",
      border: "1px solid rgba(255, 255, 255, 0.08) !important",
      padding: "8px 12px !important",
      borderRadius: "4px !important",
      margin: "8px 0 12px 0 !important",
      overflowX: "auto !important",
    },
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo code": {
      fontFamily: "var(--font-code) !important", /* Monospace code */
      fontSize: "12px !important",
      color: "#f8f8f2 !important",
      backgroundColor: "rgba(255, 255, 255, 0.08) !important", /* Subtle gray background for inline code */
      padding: "2px 5px !important",
      borderRadius: "3px !important",
    },
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo pre code": {
      backgroundColor: "transparent !important", /* No bg for code block inside pre */
      padding: "0 !important",
      borderRadius: "0 !important",
    },
    /* Custom Scrollbar for Info Box */
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo::-webkit-scrollbar": {
      width: "6px !important",
      height: "6px !important",
    },
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo::-webkit-scrollbar-track": {
      background: "transparent !important",
    },
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo::-webkit-scrollbar-thumb": {
      background: "#44475a !important",
      borderRadius: "3px !important",
    },
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo::-webkit-scrollbar-thumb:hover": {
      background: "#6272a4 !important",
    },
    /* Hover Tooltip - Styled identical to autocomplete side box */
    ".cm-tooltip .cm-hover-tooltip-docs": {
      maxHeight: "350px !important",
      overflowY: "auto !important",
      padding: "16px !important",
      fontFamily: "var(--font-sans) !important",
      fontSize: "13px !important",
      lineHeight: "1.6 !important",
      color: "#f8f8f2 !important",
      whiteSpace: "normal !important",
      width: "450px !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs p": {
      margin: "0 0 10px 0 !important",
      lineHeight: "1.6 !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs h1, .cm-tooltip .cm-hover-tooltip-docs h2, .cm-tooltip .cm-hover-tooltip-docs h3": {
      fontFamily: "var(--font-sans) !important",
      color: "#f8f8f2 !important", /* Regular MD white headers */
      fontWeight: "bold !important",
      margin: "14px 0 8px 0 !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs pre": {
      backgroundColor: "rgba(0, 0, 0, 0.22) !important",
      border: "1px solid rgba(255, 255, 255, 0.08) !important",
      padding: "8px 12px !important",
      borderRadius: "4px !important",
      margin: "8px 0 12px 0 !important",
      overflowX: "auto !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs code": {
      fontFamily: "var(--font-code) !important",
      fontSize: "12px !important",
      color: "#f8f8f2 !important",
      backgroundColor: "rgba(255, 255, 255, 0.08) !important", /* Subtle gray background for inline code */
      padding: "2px 5px !important",
      borderRadius: "3px !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs pre code": {
      backgroundColor: "transparent !important", /* No bg for code block inside pre */
      padding: "0 !important",
      borderRadius: "0 !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs::-webkit-scrollbar": {
      width: "6px !important",
      height: "6px !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs::-webkit-scrollbar-track": {
      background: "transparent !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs::-webkit-scrollbar-thumb": {
      background: "#44475a !important",
      borderRadius: "3px !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs::-webkit-scrollbar-thumb:hover": {
      background: "#6272a4 !important",
    },
    /* Standard MD list styling */
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo ul, .cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo ol": {
      paddingLeft: "20px !important",
      margin: "0 0 10px 0 !important",
    },
    ".cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo li": {
      marginBottom: "4px !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs ul, .cm-tooltip .cm-hover-tooltip-docs ol": {
      paddingLeft: "20px !important",
      margin: "0 0 10px 0 !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs li": {
      marginBottom: "4px !important",
    },
    /* Link styling for both completion info and hover tooltip docs */
    ".cm-tooltip .cm-hover-tooltip-docs a, .cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo a": {
      color: "#58a6ff !important",
      textDecoration: "none !important",
    },
    ".cm-tooltip .cm-hover-tooltip-docs a:hover, .cm-tooltip.cm-tooltip-autocomplete .cm-completionInfo a:hover": {
      color: "#58a6ff !important",
      textDecoration: "underline !important",
    },
  },
  { dark: true }
);

// ── Dracula Theme Highlight Rules ─────────────────────────────────────────────
export const draculaHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#ff79c6" },
  { tag: [t.controlKeyword, t.moduleKeyword, t.operatorKeyword], color: "#ff79c6" },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: "#50fa7b" },
  { tag: [t.propertyName, t.propertyName], color: "#66d9ef" },
  { tag: [t.variableName, t.self], color: "#f8f8f2" },
  { tag: [t.typeName, t.className, t.number, t.integer], color: "#bd93f9" },
  { tag: [t.bool, t.null, t.special(t.number)], color: "#bd93f9" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.propertyName)], color: "#50fa7b" },
  { tag: [t.string, t.regexp, t.special(t.string)], color: "#f1fa8c" },
  { tag: [t.escape, t.character], color: "#ff79c6" },
  { tag: t.url, color: "#8be9fd" },
  { tag: [t.meta, t.comment], color: "#6272a4", fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.heading, fontWeight: "bold", color: "#bd93f9" },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#bd93f9" },
  { tag: t.processingInstruction, color: "#ffb86c" },
  { tag: t.annotation, color: "#ffb86c" },
  { tag: t.invalid, color: "#ff5555" },
]);

// ── Full Dracula Extension Pack ───────────────────────────────────────────────
export const dracula = [draculaTheme, syntaxHighlighting(draculaHighlightStyle)];
