# Co-Write

**Co-Write** is a high-performance web application for real-time collaborative code editing without conflicts.

At the core of the project is **CRDT (Conflict-free Replicated Data Type)** technology implemented via the **Automerge** library, which ensures seamless merging of changes from different users. Real-time communication between the client and server is handled instantly via **WebSockets**.

---

## Key Features

- **Real-time Editing:** Collaborative code editing with instant synchronization.
- **Painless Conflict Resolution:** Using Automerge guarantees that all document replicas eventually converge to the same state without freezing the UI.
- **Syntax Highlighting:** A powerful built-in code editor using **CodeMirror 6** (supporting Rust syntax, One Dark theme, etc.).
- **API Documentation (Swagger):** Integrated interactive Swagger UI documentation for developers.
- **Full Containerization:** Easy setup and launch of the entire stack using Docker and Docker Compose.

---

## Tech Stack

### Backend
- **Language:** [Rust](https://www.rust-lang.org/) — guarantees memory safety, high performance, and reliability.
- **Web Framework:** [Actix-web](https://actix.rs/) and `Actix-ws` for WebSocket handling.
- **Database:** [PostgreSQL](https://www.postgresql.org/) (asynchronous interaction via [SQLx](https://github.com/launchbadge/sqlx)).
- **Cache & Pub/Sub:** [Redis](https://redis.io/) for temporary room storage and message brokering.
- **Documentation:** [Utoipa](https://github.com/juhakg/utoipa) for generating OpenAPI specification and Swagger UI.

### Frontend
- **Framework:** React 19 + Vite (fast build times).
- **State Management:** Redux Toolkit + React Redux.
- **Editor:** CodeMirror 6 (One Dark theme, Rust syntax highlighting).
- **Synchronization:** `@automerge/automerge` (handling CRDT binary sync messages).

---

## Setup and Local Run

You can run the project in two ways: the simplest way is via **Docker Compose**, or by running each component **manually** for active development.

### Prerequisites
Make sure you have the following installed on your machine:
- **Docker** and **Docker Compose** (for the first method)
- **Node.js** (v18+) & **npm** (for manual client setup)
- **Rust (rustc & cargo v1.80+)** (for manual server setup)

The easiest way to run the entire stack (Backend + Frontend + DB + Redis) with a single command:

1. Verify the existence of the `.env` file in the project root. It already contains basic development settings.
2. Spin up the containers:
   ```bash
   docker compose up --build -d
   ```
3. Once running, the application will be available at the following addresses:
   - **Frontend (Client):** [http://localhost:3000](http://localhost:3000)
   - **Backend (API Server):** [http://localhost:8080](http://localhost:8080)
   - **Swagger UI (API Docs):** [http://localhost:8080/swagger-ui/](http://localhost:8080/swagger-ui/)

*To stop the containers, run:*
```bash
docker compose down
```

---

## How Synchronization Works (Automerge CRDT)

1. **Initialization:** Upon creating or opening a document, the client establishes a persistent connection to the server via WebSocket.
2. **Making Changes:** When a user types in the CodeMirror editor, the frontend captures these changes and applies them to the local **Automerge** document.
3. **Message Exchange:** Automerge generates a binary sync message. This message is sent to the server over the WebSocket connection.
4. **Server Processing:** The Rust backend receives the binary packet, applies it to its own copy of the Automerge document, persists the changes in the database, and broadcasts these updates to all other clients connected to the same room using Redis Pub/Sub.
5. **Conflict-Free Merge:** Other clients apply the incoming sync message to their Automerge copy. CRDT algorithms ensure that conflicts are resolved automatically (for example, typing at the same position simultaneously will not overwrite changes but will merge both texts).
