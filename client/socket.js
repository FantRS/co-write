import { websocket_url } from "./paths.js";

class WebSocketClient {
    constructor() {
        this.connect();
        this.handlers = {
            open: [],
            close: [],
            message: [],
            error: []
        };
    }

    connect() {
        this.ws = new WebSocket(websocket_url());
        
        this.ws.onopen = () => {
            console.log("WebSocket connected");
            this.handlers.open.forEach(handler => handler());
        };

        this.ws.onclose = () => {
            console.log("WebSocket disconnected");
            this.handlers.close.forEach(handler => handler());
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.handlers.error.forEach(handler => handler(error));
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handlers.message.forEach(handler => handler(data));
            } catch (error) {
                console.error("Failed to parse message:", error);
            }
        };
    }

    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
        } else {
            console.warn("WebSocket is not connected. Message not sent:", data);
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }

    onopen(handler) {
        this.handlers.open.push(handler);
    }

    onclose(handler) {
        this.handlers.close.push(handler);
    }

    onmessage(handler) {
        this.handlers.message.push(handler);
    }

    onerror(handler) {
        this.handlers.error.push(handler);
    }
}

// Create and export a singleton instance
const socket = new WebSocketClient();
export default socket;
