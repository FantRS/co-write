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

* Authorization (UI + server connection + JWT + error handling);
* Menu (UI with “create/load” buttons);
* Editor (UI + ...);

Backend

* Server;
* DB and pool connections;
* Auth with JWT;
* Error handling;
* API architecture;
* Editor with real-time changes.

<br>

### API architecture
<img width="845" height="597" alt="image" src="https://github.com/user-attachments/assets/28130406-b104-4ee6-b779-9bc3d0184717" />

<br>

### Database table

`users` table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

`projects` table
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

`files` table
```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL
);
```

`roles` table
```sql
CREATE TABLE roles (
    slug TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
);
```

`members` table
```sql
CREATE TABLE members (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_slug TEXT NOT NULL REFERENCES roles(slug) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
);
```

<br>

### 👨‍💻 Authors
**Rostyslav Kashper and Mariia Kaduk**  
GitHub: [FantRS](https://github.com/FantRS) and [MashaKaduk](https://github.com/MashaKaduk)

