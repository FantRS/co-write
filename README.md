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
* Profile (UI) [optional]

Backend

* Server (actix_web crate);
* DB and pool connections (sqlx crate);
* Auth with JWT (jsonwebtoken crate);
* Error handling (thiserror crate);
* API architecture;
* Synchronous editor.

<br>

### API architecture
<img width="845" height="597" alt="image" src="https://github.com/user-attachments/assets/28130406-b104-4ee6-b779-9bc3d0184717" />

