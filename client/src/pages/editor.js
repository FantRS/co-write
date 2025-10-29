import { showToast } from "../utils/showToast.js";
import { webSocketUrl } from "../configs/paths.js";
import * as Automerge from "@automerge/automerge";

class Editor {
    constructor() {
        this.socket = null;
        
        // Automerge state
        try {
            this.doc = Automerge.from({ text: "" });
            this.syncState = Automerge.initSyncState();
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

        this.documentId = new URL(window.location.href).searchParams.get("id");
        if (!this.documentId) {
            showToast("Документ не знайдено", 3000);
            console.error("No document ID in URL");
            setTimeout(() => {
                window.location.href = "/";
            }, 3000);
        }
    }

    // == INIT EVENT LISTENERS ==
    initializeEventListeners() {
        this.editorArea.addEventListener("input", () => {
            this.handleTextChange();
        });

        this.copyLinkBtn.addEventListener("click", () => {
            const url = window.location.href;
            navigator.clipboard
                .writeText(url)
                .then(() => showToast("Посилання скопійовано"))
                .catch(() => showToast("Помилка копіювання посилання"));
        });

        this.backToLobbyBtn.addEventListener("click", () => {
            window.location.href = "/";
        });

        window.addEventListener("beforeunload", () => {
            if (this.socket) {
                this.socket.close();
            }
        });
    }

    // == SETUP WEBSOCKET LISTENERS ==
    setupWebSocket() {
        const wsUrl = webSocketUrl(this.documentId);
        
        this.socket = new WebSocket(wsUrl);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = () => {
            this.updateConnectionStatus("connected");
            showToast("Підключено до сервера");
        };

        this.socket.onclose = (event) => {
            this.updateConnectionStatus("disconnected");
            showToast("Втрачено з'єднання з сервером");

            // Try to reconnect after 5 seconds
            setTimeout(() => {
                this.setupWebSocket();
            }, 5000);
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.updateConnectionStatus("error");
            showToast("Помилка з'єднання з сервером");
        };

        this.socket.onmessage = (event) => {
            // Handle binary messages (Automerge sync)
            if (event.data instanceof ArrayBuffer) {
                this.handleBinaryMessage(event.data);
            } 
            else if (typeof event.data === "string") {
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
        try {
            const message = new Uint8Array(data);
            
            if (message[0] === 123) {
                // This is a JSON status response, not an Automerge sync message
                const text = new TextDecoder().decode(message);
                try {
                    const statusData = JSON.parse(text);
                    if (statusData.status && statusData.status !== 200) {
                        showToast(`Помилка: ${statusData.message}`);
                    }
                } catch (e) {
                    console.error("Failed to parse JSON status:", e);
                }
                return;
            }
            
            if (message.length < 2) {
                console.warn("Binary message too short to be Automerge sync");
                return;
            }
            
            // Apply received sync message to our document
            const [nextDoc, nextSyncState] = Automerge.receiveSyncMessage(
                this.doc,
                this.syncState,
                message
            );
            
            this.doc = nextDoc;
            this.syncState = nextSyncState;
            
            this.updateEditorFromDoc();
            this.sendSyncMessage();
            this.updateSyncStatus("Синхронізовано");
        } catch (error) {
            console.error("Failed to handle sync message:", error);
            showToast("Помилка синхронізації");
        }
    }

    // == SEND SYNC MESSAGE ==
    sendSyncMessage() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const [nextSyncState, message] = Automerge.generateSyncMessage(
                this.doc,
                this.syncState
            );
            
            this.syncState = nextSyncState;
            
            if (message) {
                this.socket.send(message);
            }
        } catch (error) {
            console.error("Failed to generate/send sync message:", error);
        }
    }

    // == UPDATE EDITOR FROM DOC ==
    updateEditorFromDoc() {
        this.isUpdatingFromRemote = true;
        
        const text = this.doc.text || "";
        
        // Only update if content is different to prevent cursor jumping
        if (this.editorArea.value !== text) {
            const start = this.editorArea.selectionStart;
            const end = this.editorArea.selectionEnd;
            
            this.editorArea.value = text;
            
            // Restore cursor position
            this.editorArea.setSelectionRange(start, end);
        }
        
        this.isUpdatingFromRemote = false;
    }

    // == HANDLE TEXT CHANGE ==
    handleTextChange() {
        if (this.isUpdatingFromRemote) {
            return;
        }

        this.updateSyncStatus("Синхронізація...");
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            const newText = this.editorArea.value;
            
            try {
                // Update Automerge document
                this.doc = Automerge.change(this.doc, (doc) => {
                    doc.text = newText;
                });
                
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

// == INITIALIZING EDITOR ==
function initEditor() {
    try {
        const editor = new Editor();
        window.editor = editor;
    } catch (error) {
        console.error("Failed to create editor:", error);
    }
}

// == CHECKING IF DOM LOADED ==
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initEditor);
} else {
    initEditor();
}
