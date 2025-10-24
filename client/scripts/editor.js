import { get_snapshot_ep } from "./paths.js";
import socket from "./socket.js";

class Editor {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.setupWebSocket();
        this.loadDocument();

        this.timeout = null;
        this.lastSync = Date.now();
    }

    // == INIT ELEMENTS BY ID ==
    initializeElements() {
        this.editorArea = document.getElementById("editorArea");
        this.documentTitle = document.getElementById("documentTitle");
        this.connectionStatus = document.getElementById("connectionStatus");
        this.connectedUsers = document.getElementById("connectedUsers");
        this.syncStatus = document.getElementById("syncStatus");
        this.copyLinkBtn = document.getElementById("copyLink");
        this.backToLobbyBtn = document.getElementById("backToLobby");
        this.toast = document.getElementById("toast");

        // Get document ID from URL
        this.documentId = new URL(window.location.href).searchParams.get("id");
        if (!this.documentId) {
            this.showToast("Документ не знайдено", 3000);
            setTimeout(() => {
                window.location.href = "/";
            }, 3000);
        }
    }

    // == INIT EVENT LISTENERS ==
    initializeEventListeners() {
        this.editorArea.addEventListener("input", () => {
            this.updateSyncStatus("Синхронізація...");
            clearTimeout(this.timeout);

            // If last sync was more than 500ms ago, sync immediately
            if (Date.now() - this.lastSync > 500) {
                this.syncContent();
            } else {
                // Otherwise, wait for 500ms of no typing
                this.timeout = setTimeout(() => this.syncContent(), 500);
            }
        });

        this.copyLinkBtn.addEventListener("click", () => {
            const url = window.location.href;
            navigator.clipboard
                .writeText(url)
                .then(() => this.showToast("Посилання скопійовано"))
                .catch(() => this.showToast("Помилка копіювання посилання"));
        });

        this.backToLobbyBtn.addEventListener("click", () => {
            window.location.href = "/client/index.html";
        });

        window.addEventListener("beforeunload", () => {
            socket.close();
        });
    }

    // SETUP WEBSOCKET LISTENERS
    setupWebSocket() {
        socket.onopen = () => {
            this.updateConnectionStatus("connected");
            this.showToast("Підключено до сервера");
        };

        socket.onclose = () => {
            this.updateConnectionStatus("disconnected");
            this.showToast("Втрачено з'єднання з сервером");

            // Try to reconnect after 5 seconds
            setTimeout(() => {
                this.setupWebSocket();
            }, 5000);
        };

        socket.onerror = () => {
            this.updateConnectionStatus("error");
            this.showToast("Помилка з'єднання з сервером");

            // Try to reconnect after 5 seconds
            setTimeout(() => {
                this.setupWebSocket();
            }, 5000);
        }

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case "content":
                    this.handleContentUpdate(data);
                    break;
                case "users":
                    this.updateConnectedUsers(data.count);
                    break;
                case "error":
                    this.showToast(data.message);
                    break;
            }
        };
    }

    async loadDocument() {
        try {
            const response = await fetch(get_snapshot_ep(this.documentId));
            if (!response.ok) throw new Error("Помилка завантаження документа");

            const data = await response.json();
            this.documentTitle.textContent = data.title;
            this.editorArea.value = data.content;

            // Enable editor after content is loaded
            this.editorArea.disabled = false;
        } catch (error) {
            this.showToast("Помилка завантаження документа");
            console.error("Load document error:", error);
        }
    }

    syncContent() {
        const content = this.editorArea.value;

        socket.send(
            JSON.stringify({
                type: "update",
                documentId: this.documentId,
                content: content,
            })
        );

        this.lastSync = Date.now();
        this.updateSyncStatus("Синхронізовано");
    }

    handleContentUpdate(data) {
        // Only update if the content is different to prevent cursor jumping
        if (this.editorArea.value !== data.content) {
            const start = this.editorArea.selectionStart;
            const end = this.editorArea.selectionEnd;

            this.editorArea.value = data.content;

            // Restore cursor position
            this.editorArea.setSelectionRange(start, end);
        }
    }

    updateConnectionStatus(status) {
        this.connectionStatus.className = "connection-status " + status;
        switch (status) {
            case "connected":
                this.connectionStatus.textContent = "Підключено";
                break;
            case "disconnected":
                this.connectionStatus.textContent = "Відключено";
                break;
            case "connecting":
                this.connectionStatus.textContent = "Підключення...";
                break;
        }
    }

    updateConnectedUsers(count) {
        this.connectedUsers.textContent = `Користувачів онлайн: ${count}`;
    }

    updateSyncStatus(status) {
        this.syncStatus.textContent = status;
    }

    showToast(message, duration = 2500) {
        this.toast.textContent = message;
        this.toast.hidden = false;

        setTimeout(() => {
            this.toast.hidden = true;
        }, duration);
    }
}

// Initialize editor when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new Editor();
});
