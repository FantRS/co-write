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

### Database tables

`users` table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`projects` table
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`files` table
```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`roles` table
```sql
CREATE TABLE roles (
    slug VARCHAR(100) PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`members` table
```sql
CREATE TABLE members (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_slug VARCHAR(100) NOT NULL REFERENCES roles(slug) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT members_pk PRIMARY KEY (user_id, role_slug, project_id)
);
```

<br>

### 👨‍💻 Authors
**Rostyslav Kashper and Mariia Kaduk**  
GitHub: [FantRS](https://github.com/FantRS) and [MashaKaduk](https://github.com/MashaKaduk)



zxcvbnm