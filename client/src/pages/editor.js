console.log("=== EDITOR SCRIPT LOADING ===");

import { showToast } from "../utils/showToast.js";
import { webSocketUrl } from "../configs/paths.js";

console.log("=== IMPORTS LOADED, LOADING AUTOMERGE ===");

import * as Automerge from "@automerge/automerge";

console.log("=== AUTOMERGE LOADED ===", Automerge);

class Editor {
    constructor() {
        console.log("Editor initializing...");
        this.socket = null;
        
        // Automerge state
        try {
            console.log("Initializing Automerge document...");
            this.doc = Automerge.from({ text: "" });
            this.syncState = Automerge.initSyncState();
            console.log("Automerge initialized successfully", this.doc);
        } catch (error) {
            console.error("Failed to initialize Automerge:", error);
            // Continue anyway to test other functionality
            this.doc = { text: "" };
            this.syncState = null;
        }
        
        this.initializeElements();
        this.initializeEventListeners();
        this.setupWebSocket();

        this.timeout = null;
        this.isUpdatingFromRemote = false;
    }

    // == INIT ELEMENTS BY ID ==
    initializeElements() {
        this.editorArea = document.getElementById("editorArea");
        this.documentTitle = document.getElementById("documentTitle");
        this.connectionStatus = document.getElementById("connectionStatus");
        this.syncStatus = document.getElementById("syncStatus");
        this.copyLinkBtn = document.getElementById("copyLink");
        this.backToLobbyBtn = document.getElementById("backToLobby");
        this.toast = document.getElementById("toast");

        // Get document ID from URL
        this.documentId = new URL(window.location.href).searchParams.get("id");
        if (!this.documentId) {
            showToast("Документ не знайдено", 3000);
            console.error("No document ID in URL");
            setTimeout(() => {
                window.location.href = "/";
            }, 3000);
        } else {
            console.log("Document ID:", this.documentId);
        }
    }

    // == INIT EVENT LISTENERS ==
    initializeEventListeners() {
        console.log("Setting up event listeners...");
        
        this.editorArea.addEventListener("input", () => {
            console.log("Text input detected");
            this.handleTextChange();
        });

        this.copyLinkBtn.addEventListener("click", () => {
            console.log("Copy link clicked");
            const url = window.location.href;
            navigator.clipboard
                .writeText(url)
                .then(() => showToast("Посилання скопійовано"))
                .catch(() => showToast("Помилка копіювання посилання"));
        });

        this.backToLobbyBtn.addEventListener("click", () => {
            console.log("Back to lobby clicked");
            window.location.href = "/";
        });

        window.addEventListener("beforeunload", () => {
            if (this.socket) {
                this.socket.close();
            }
        });
        
        console.log("Event listeners set up successfully");
    }

    // == SETUP WEBSOCKET LISTENERS ==
    setupWebSocket() {
        console.log("Setting up WebSocket for document:", this.documentId);
        const wsUrl = webSocketUrl(this.documentId);
        console.log("WebSocket URL:", wsUrl);
        
        this.socket = new WebSocket(wsUrl);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = () => {
            console.log("WebSocket connected");
            this.updateConnectionStatus("connected");
            showToast("Підключено до сервера");
        };

        this.socket.onclose = (event) => {
            console.log("WebSocket closed:", event.code, event.reason);
            this.updateConnectionStatus("disconnected");
            showToast("Втрачено з'єднання з сервером");

            // Try to reconnect after 5 seconds
            setTimeout(() => {
                console.log("Attempting to reconnect...");
                this.setupWebSocket();
            }, 5000);
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.updateConnectionStatus("error");
            showToast("Помилка з'єднання з сервером");
        };

        this.socket.onmessage = (event) => {
            console.log("WebSocket message received, type:", typeof event.data);
            
            // Handle binary messages (Automerge sync)
            if (event.data instanceof ArrayBuffer) {
                console.log("Binary message received, size:", event.data.byteLength);
                this.handleBinaryMessage(event.data);
            } 
            // Handle text messages (JSON status/errors)
            else if (typeof event.data === "string") {
                console.log("Text message received:", event.data);
                try {
                    const data = JSON.parse(event.data);
                    if (data.status && data.status !== 200) {
                        showToast(`Помилка: ${data.message}`);
                    }
                } catch (e) {
                    console.error("Failed to parse JSON message:", e);
                }
            }
        };
    }

    async handleBinaryMessage(data) {
        console.log("handleBinaryMessage called");
        
        try {
            const message = new Uint8Array(data);
            console.log("Sync message size:", message.length);
            
            // Apply received sync message to our document
            const [nextDoc, nextSyncState] = Automerge.receiveSyncMessage(
                this.doc,
                this.syncState,
                message
            );
            
            console.log("Sync message applied successfully");
            this.doc = nextDoc;
            this.syncState = nextSyncState;
            
            // Update UI with new document content
            this.updateEditorFromDoc();
            
            // Send back our sync state
            this.sendSyncMessage();
            
            this.updateSyncStatus("Синхронізовано");
        } catch (error) {
            console.error("Failed to handle sync message:", error);
            showToast("Помилка синхронізації");
        }
    }

    sendSyncMessage() {
        console.log("sendSyncMessage called");
        
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.log("WebSocket not ready, state:", this.socket?.readyState);
            return;
        }

        try {
            const [nextSyncState, message] = Automerge.generateSyncMessage(
                this.doc,
                this.syncState
            );
            
            this.syncState = nextSyncState;
            
            if (message) {
                console.log("Sending sync message, size:", message.length);
                this.socket.send(message);
            } else {
                console.log("No sync message to send");
            }
        } catch (error) {
            console.error("Failed to generate/send sync message:", error);
        }
    }

    updateEditorFromDoc() {
        console.log("updateEditorFromDoc called");
        this.isUpdatingFromRemote = true;
        
        const text = this.doc.text || "";
        console.log("Document text:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));
        
        // Only update if content is different to prevent cursor jumping
        if (this.editorArea.value !== text) {
            const start = this.editorArea.selectionStart;
            const end = this.editorArea.selectionEnd;
            
            this.editorArea.value = text;
            
            // Restore cursor position
            this.editorArea.setSelectionRange(start, end);
            console.log("Editor updated with new text");
        }
        
        this.isUpdatingFromRemote = false;
    }

    handleTextChange() {
        if (this.isUpdatingFromRemote) {
            console.log("Ignoring change from remote update");
            return;
        }

        console.log("handleTextChange called");
        this.updateSyncStatus("Синхронізація...");
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            const newText = this.editorArea.value;
            console.log("Updating document with new text, length:", newText.length);
            
            try {
                // Update Automerge document
                this.doc = Automerge.change(this.doc, (doc) => {
                    doc.text = newText;
                });
                
                console.log("Document updated successfully");
                
                // Send sync message
                this.sendSyncMessage();
                
                this.updateSyncStatus("Синхронізовано");
            } catch (error) {
                console.error("Failed to update document:", error);
            }
            
            this.timeout = null;
        }, 300);
    }

    // == UPDATE INFO ==
    updateConnectionStatus(status) {
        this.connectionStatus.className =
            "status-chip connection-status " + status;
        const statusText = this.connectionStatus.querySelector(".status-text");
        switch (status) {
            case "connected":
                statusText.textContent = "Підключено";
                break;
            case "disconnected":
                statusText.textContent = "Відключено";
                break;
            case "connecting":
                statusText.textContent = "Підключення...";
                break;
        }
    }
    updateSyncStatus(status) {
        const statusText = this.syncStatus.querySelector(".status-text");
        statusText.textContent = status;
    }
}

// Initialize editor when DOM is loaded
console.log("=== SETTING UP DOMCONTENTLOADED LISTENER ===");
console.log("Document ready state:", document.readyState);

function initEditor() {
    console.log("=== DOM CONTENT LOADED, CREATING EDITOR ===");
    try {
        const editor = new Editor();
        console.log("=== EDITOR CREATED SUCCESSFULLY ===", editor);
        window.editor = editor; // For debugging
    } catch (error) {
        console.error("=== FAILED TO CREATE EDITOR ===", error);
    }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for it
    document.addEventListener("DOMContentLoaded", initEditor);
} else {
    // DOM is already loaded, initialize immediately
    console.log("=== DOM ALREADY LOADED, INITIALIZING IMMEDIATELY ===");
    initEditor();
}
