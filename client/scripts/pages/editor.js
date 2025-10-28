import { showToast } from "../other/showToast.js";
import { webSocketUrl } from "../core/paths.js";

console.log("editor.js module loaded");

class Editor {
    constructor() {
        console.log("Editor constructor called");
        this.socket = null;
        this.doc = null;
        this.syncState = null;
        this.isLocalChange = false;
        this.Automerge = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadAutomerge();
        console.log("Editor initialized successfully");
    }

    // == LOAD AUTOMERGE ASYNCHRONOUSLY ==
    async loadAutomerge() {
        try {
            console.log("Loading Automerge...");
            const AutomergeModule = await import("@automerge/automerge");
            this.Automerge = AutomergeModule;
            console.log("Automerge loaded successfully", Object.keys(AutomergeModule));
            
            this.initializeAutomerge();
            this.setupWebSocket();
        } catch (error) {
            console.error("Failed to load Automerge:", error);
            showToast("Помилка завантаження Automerge: " + error.message);
        }
    }

    // == INIT AUTOMERGE DOCUMENT ==
    initializeAutomerge() {
        try {
            console.log("Initializing Automerge document...");
            // Create a new Automerge document with a text field
            this.doc = this.Automerge.from({
                content: ""
            });
            
            // Initialize sync state
            this.syncState = this.Automerge.initSyncState();
            
            console.log("Automerge initialized", this.doc);
        } catch (error) {
            console.error("Error initializing Automerge:", error);
            showToast("Помилка ініціалізації документа");
        }
    }

    // == INIT ELEMENTS BY ID ==
    initializeElements() {
        console.log("Initializing elements...");
        this.editorArea = document.getElementById("editorArea");
        this.documentTitle = document.getElementById("documentTitle");
        this.connectionStatus = document.getElementById("connectionStatus");
        this.connectedUsers = document.getElementById("connectedUsers");
        this.syncStatus = document.getElementById("syncStatus");
        this.copyLinkBtn = document.getElementById("copyLink");
        this.backToLobbyBtn = document.getElementById("backToLobby");
        this.toast = document.getElementById("toast");

        console.log("Elements found:", {
            editorArea: !!this.editorArea,
            copyLinkBtn: !!this.copyLinkBtn,
            backToLobbyBtn: !!this.backToLobbyBtn
        });

        // Get document ID from URL
        this.documentId = new URL(window.location.href).searchParams.get("id");
        console.log("Document ID:", this.documentId);
        
        if (!this.documentId) {
            showToast("Документ не знайдено", 3000);
            setTimeout(() => {
                window.location.href = "/";
            }, 3000);
        }
    }

    // == INIT EVENT LISTENERS ==
    initializeEventListeners() {
        console.log("Setting up event listeners...");
        
        if (this.editorArea) {
            this.editorArea.addEventListener("input", () => {
                this.handleTextareaInput();
            });
            console.log("✓ Editor area listener added");
        }

        if (this.copyLinkBtn) {
            this.copyLinkBtn.addEventListener("click", () => {
                console.log("Copy link button clicked");
                const url = window.location.href;
                navigator.clipboard
                    .writeText(url)
                    .then(() => showToast("Посилання скопійовано"))
                    .catch(() => showToast("Помилка копіювання посилання"));
            });
            console.log("✓ Copy link listener added");
        }

        if (this.backToLobbyBtn) {
            this.backToLobbyBtn.addEventListener("click", () => {
                console.log("Back to lobby button clicked");
                window.location.href = "/client/index.html";
            });
            console.log("✓ Back to lobby listener added");
        }

        window.addEventListener("beforeunload", () => {
            if (this.socket) {
                this.socket.close();
            }
        });
        
        console.log("All event listeners initialized");
    }

    // == SETUP WEBSOCKET LISTENERS ==
    setupWebSocket() {
        if (!this.Automerge) {
            console.error("Cannot setup WebSocket: Automerge not loaded");
            return;
        }

        console.log("Setting up WebSocket...");
        this.socket = new WebSocket(webSocketUrl(this.documentId));
        this.socket.binaryType = "arraybuffer";

        console.log("Connecting to:", webSocketUrl(this.documentId));

        this.socket.onopen = () => {
            console.log("✓ WebSocket connected");
            console.log("📡 Ready to sync with other clients in room:", this.documentId);
            this.updateConnectionStatus("connected");
            showToast("Підключено до сервера");
            this.sendSyncMessage();
        };

        this.socket.onclose = () => {
            console.log("✗ WebSocket closed");
            this.updateConnectionStatus("disconnected");
            showToast("Втрачено з'єднання з сервером");

            setTimeout(() => {
                this.setupWebSocket();
            }, 5000);
        };

        this.socket.onerror = (error) => {
            console.error("✗ WebSocket error:", error);
            this.updateConnectionStatus("error");
            showToast("Помилка з'єднання з сервером");
        };

        this.socket.onmessage = (event) => {
            console.log("← WebSocket message received", typeof event.data);
            if (event.data instanceof ArrayBuffer) {
                this.handleBinarySyncMessage(event.data);
            } else {
                try {
                    const data = JSON.parse(event.data);
                    this.handleJsonMessage(data);
                } catch (e) {
                    console.error("Failed to parse message:", e);
                }
            }
        };
    }

    // == HANDLE BINARY SYNC MESSAGES ==
    handleBinarySyncMessage(arrayBuffer) {
        try {
            const message = new Uint8Array(arrayBuffer);
            console.log("📥 Received binary sync message from another client, length:", message.length);
            
            const [newDoc, newSyncState, patch] = this.Automerge.receiveSyncMessage(
                this.doc,
                this.syncState,
                message
            );

            if (newDoc) {
                this.doc = newDoc;
                this.syncState = newSyncState;
                console.log("✓ Document updated from remote client, patches:", patch?.length || 0);
                console.log("📄 New document content:", this.doc.content);
                
                if (patch && patch.length > 0) {
                    this.updateTextareaFromDoc();
                    this.updateSyncStatus("Отримано зміни від іншого користувача");
                    setTimeout(() => {
                        this.updateSyncStatus("Синхронізовано");
                    }, 2000);
                }
                
                this.sendSyncMessage();
            } else if (newSyncState) {
                this.syncState = newSyncState;
                console.log("✓ Sync state updated (no doc changes)");
            }
        } catch (error) {
            console.error("✗ Error handling sync message:", error);
            showToast("Помилка синхронізації");
        }
    }

    // == HANDLE JSON MESSAGES ==
    handleJsonMessage(data) {
        console.log("← Handling JSON message", data);
        
        // Server sends { status: 200, message: "Ok" } as acknowledgment
        if (data.status === 200) {
            console.log("✓ Server acknowledged sync message");
            return;
        }
        
        switch (data.type) {
            case "users":
                this.updateConnectedUsers(data.count);
                break;
            case "error":
                showToast(data.message);
                break;
            default:
                console.log("Unknown message type:", data.type, data);
        }
    }

    // == SEND SYNC MESSAGE ==
    sendSyncMessage() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.log("✗ Cannot send sync message, socket not ready");
            return;
        }

        if (!this.Automerge) {
            console.log("✗ Cannot send sync message, Automerge not loaded");
            return;
        }

        try {
            const [nextSyncState, syncMessage] = this.Automerge.generateSyncMessage(
                this.doc,
                this.syncState
            );

            if (syncMessage) {
                this.syncState = nextSyncState;
                console.log("→ Sending sync message, length:", syncMessage.length);
                this.socket.send(syncMessage);
            } else {
                console.log("○ No sync message to send");
            }
        } catch (error) {
            console.error("✗ Error sending sync message:", error);
        }
    }

    // == HANDLE TEXTAREA INPUT ==
    handleTextareaInput() {
        if (this.isLocalChange) {
            console.log("○ Skipping input (local change)");
            return;
        }

        if (!this.Automerge) {
            console.log("✗ Cannot handle input: Automerge not loaded");
            return;
        }

        console.log("✎ Handling textarea input");
        this.updateSyncStatus("Синхронізація...");

        try {
            const textareaContent = this.editorArea.value;
            const docContent = this.doc.content || "";

            this.applyTextChanges(docContent, textareaContent);
            this.sendSyncMessage();
            this.updateSyncStatus("Синхронізовано");
        } catch (error) {
            console.error("✗ Error syncing content:", error);
            this.updateSyncStatus("Помилка синхронізації");
        }
    }

    // == APPLY TEXT CHANGES TO AUTOMERGE DOC ==
    applyTextChanges(oldText, newText) {
        console.log("✎ Applying text changes");
        this.doc = this.Automerge.change(this.doc, (doc) => {
            doc.content = newText;
        });
        console.log("✓ Document content updated");
    }

    // == UPDATE TEXTAREA FROM AUTOMERGE DOC ==
    updateTextareaFromDoc() {
        this.isLocalChange = true;

        try {
            const newContent = this.doc.content || "";
            console.log("← Updating textarea from doc, length:", newContent.length);
            
            if (this.editorArea.value !== newContent) {
                const start = this.editorArea.selectionStart;
                const end = this.editorArea.selectionEnd;

                this.editorArea.value = newContent;

                const newLength = newContent.length;
                const newStart = Math.min(start, newLength);
                const newEnd = Math.min(end, newLength);
                this.editorArea.setSelectionRange(newStart, newEnd);
                
                console.log("✓ Textarea updated");
            }
        } finally {
            this.isLocalChange = false;
        }
    }

    // == UPDATE INFO ==
    updateConnectionStatus(status) {
        if (!this.connectionStatus) return;
        
        this.connectionStatus.className = "status-chip connection-status " + status;
        const statusText = this.connectionStatus.querySelector(".status-text");
        if (!statusText) return;
        
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

    updateConnectedUsers(count) {
        if (!this.connectedUsers) return;
        const statusText = this.connectedUsers.querySelector(".status-text");
        if (statusText) {
            statusText.textContent = `Користувачів онлайн: ${count}`;
        }
    }

    updateSyncStatus(status) {
        if (!this.syncStatus) return;
        const statusText = this.syncStatus.querySelector(".status-text");
        if (statusText) {
            statusText.textContent = status;
        }
    }
}

// Initialize editor when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("=== DOMContentLoaded event fired ===");
    try {
        const editor = new Editor();
        window.editor = editor; // For debugging
        console.log("=== Editor instance created successfully ===");
    } catch (error) {
        console.error("=== ERROR creating Editor instance ===");
        console.error("Error:", error);
        console.error("Stack:", error.stack);
    }
});
