import { createDocEndpoint } from "../core/paths.js";
import { showToast } from "../other/showToast.js";

class LobbyManager {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
    }

    // == INIT ELEMENTS BY ID ==
    initializeElements() {
        this.createBtn = document.getElementById("createBtn");
        this.docNameInput = document.getElementById("docName");
        this.toast = document.getElementById("toast");
    }

    // == INIT EVENT LISTENERS ==
    initializeEventListeners() {
        this.createBtn.addEventListener("click", () =>
            this.handleCreateDocument()
        );

        this.docNameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.handleCreateDocument();
        });
    }

    async handleCreateDocument() {
        const name = this.docNameInput.value.trim();

        if (!name) {
            showToast("Введіть назву документу");
            return;
        }

        try {
            const response = await fetch(createDocEndpoint(), {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain",
                },
                body: name,
                mode: "cors",
            });

            if (!response.ok) {
                throw new Error("Помилка створення документа");
            }

            const documentId = await response.text();
            showToast("Документ створено");

            // Redirect to editor page
            setTimeout(() => {
                window.location.href = `./editor.html?id=${documentId}`;
            }, 500);
        } catch (error) {
            showToast("Помилка створення документа");
            console.error("Create document error:", error);
        }
    }

    extractDocumentId(input) {
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
}

// Initialize lobby when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new LobbyManager();
});
