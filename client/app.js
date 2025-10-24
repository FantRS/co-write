import { create_doc_ep } from "./paths.js";

class LobbyManager {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.createBtn = document.getElementById("createBtn");
        this.joinBtn = document.getElementById("joinBtn");
        this.docNameInput = document.getElementById("docName");
        this.joinLinkInput = document.getElementById("joinLink");
        this.toast = document.getElementById("toast");
    }

    initializeEventListeners() {
        // Create document
        if (this.createBtn) {
            this.createBtn.addEventListener("click", () => this.handleCreateDocument());
        }

        // Join document
        if (this.joinBtn) {
            this.joinBtn.addEventListener("click", () => this.handleJoinDocument());
        }

        // Enter key handling (guard inputs)
        if (this.docNameInput) {
            this.docNameInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") this.handleCreateDocument();
            });
        }

        if (this.joinLinkInput) {
            this.joinLinkInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") this.handleJoinDocument();
            });
        }
    }

    async handleCreateDocument() {
        const name = this.docNameInput.value.trim();

        if (!name) {
            this.showToast("Введіть назву документу");
            return;
        }

        try {
            const response = await fetch(create_doc_ep(), {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain",
                },
                body: name,
                mode: "cors",
            });

            // if (!response.ok) {
            //     throw new Error("Помилка створення документа");
            // }

            // const documentId = await response.text();
            const documentId = name;
            this.showToast("Документ створено");
            
            // Redirect to editor page
            setTimeout(() => {
                window.location.href = `./editor.html?id=${documentId}`;
            }, 500);

        } catch (error) {
            this.showToast("Помилка створення документа");
            console.error("Create document error:", error);
        }
    }

    handleJoinDocument() {
        const url = this.joinLinkInput.value.trim();
        
        if (!url) {
            this.showToast("Вставте посилання або id документа");
            return;
        }

        try {
            // If URL is just an ID, construct full URL
            const documentId = this.extractDocumentId(url);
            if (documentId) {
                window.location.href = `/editor.html?id=${documentId}`;
                return;
            }

            // Otherwise try to parse as full URL
            const parsedUrl = new URL(url, window.location.origin);
            this.showToast("Перенаправляємо...");
            
            setTimeout(() => {
                window.location.href = parsedUrl.href;
            }, 350);

        } catch (error) {
            this.showToast("Неправильний URL");
            console.error("Join document error:", error);
        }
    }

    extractDocumentId(input) {
        // Check if input is just an ID (alphanumeric string)
        if (/^[a-zA-Z0-9-_]+$/.test(input)) {
            return input;
        }
        
        // Try to extract ID from URL
        try {
            const url = new URL(input);
            return url.searchParams.get("id");
        } catch {
            return null;
        }
    }

    showToast(message, duration = 2500) {
        this.toast.textContent = message;
        this.toast.hidden = false;
        
        setTimeout(() => {
            this.toast.hidden = true;
        }, duration);
    }
}

// Initialize lobby when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new LobbyManager();
});
