# co-write

### Objective of the project
Develop a website that functions as a synchronous 
text editor. A document of a given format can be edited simultaneously by several
users, and changes are visible in real time. Simple authorization is provided.

<br>

### Basic functionality
* Authorization with login and password;
* Using PostgreSQL to store different data;
* Opening/saving a file of a given format;
* Simultaneous editing of a text file (sharing an invitation link for editing).

<br>

### Scope of work
Frontend

* Authorization;
* Menu;
* Editor.

Backend

* Server (using `actix_web`);
* DB and pool connections (using `sqlx` and `PostgreSQL`);
* Auth with JWT (using `bcript` and `jsonwebtoken`);
* Error handling (using `thiserror` and `anyhow`);
* Layered API architecture;
* Editing with real-time changes (using `CRDT` and WebSocket).

<br>

### API architecture
<img width="845" height="597" alt="image" src="https://github.com/user-attachments/assets/28130406-b104-4ee6-b779-9bc3d0184717" />

<br>

### Q&A

Q: How will the file content be segmented for parallelization?<br>
A: With CRDT, segmentation occurs character by character because each character is assigned an ID.

Q: How to resolve an attempt to edit the same place?<br>
A: CRDT uses its own algorithms that automatically resolve conflicts.

Q: How and in what form will the intermediate content of the file be stored while the editing session is in progress?<br>
A: Server as a repeater and storage device. The server stores the ‘current state of the document’ in memory. 
At the same time, the server keeps an event log in the database.

<br>

### Database tables

`users` documents
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  state BYTEA NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

`projects` document_updates
```sql
CREATE TABLE document_updates (
  id UUID PRIMARY KEY uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  update BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

<br>

### 👨‍💻 Authors
**Rostyslav Kashper and Mariia Kaduk**  
GitHub: [FantRS](https://github.com/FantRS) and [MashaKaduk](https://github.com/MashaKaduk)

