# co-write

## Мета проекту
Розробити веб-сайт, який функціонує як синхронний текстовий редактор. 
Документ можуть редагувати одночасно кілька користувачів,
а зміни видно в режимі реального часу.

<br>


## Потік роботи з документом

1. Користувач відкриває документ → клієнт робить **REST запит**, отримує snapshot стану.
2. Клієнт підключається по **WebSocket** → починає отримувати всі нові зміни.
3. Коли користувач вносить зміни → вони відправляються на сервер (WebSocket повідомлення).
4. Сервер застосовує зміни до CRDT-моделі і:
    - розсилає їх всім іншим учасникам,
    - зберігає update в `document_updates`.
5. Періодично або за подією (наприклад, закриття документа) сервер робить snapshot в `documents.state`.

<br>

## Основні завдання

### 1. Робота з документом (REST API)

* `POST /documents` → створити документ.
* `GET /documents/{id}` → повернути snapshot документа.
* `GET /documents/{id}/updates?since=...` → повернути лог змін (для відновлення при reconnect).


> [! NOTE]
> snapshot зберігається в `documents.state` (серіалізований CRDT).
> логи зберігаються в `document_updates`.
> при reconnect клієнт може отримати всі зміни, яких у нього немає.


### 2. WebSocket + CRDT синхронізація

* Підняти WebSocket endpoint `/ws/{document_id}`.
* Клієнт відправляє операції у форматі CRDT update.
* Сервер застосовує update до документа в базі даних, розсилає іншим.

> [! NOTE]
> CRDT забезпечує унікальні ідентифікатори для кожного символу.
> При вставці двох символів в одне місце → порядок визначається їх ID (за часом + випадковий компонент).
> При видаленні сервер просто позначає символ як «видалений» (але зберігає ID для консистентності).
> Таким чином, конфліктів «чий символ залишився» не виникає.


### 3. Зберігання стану

* Підтримувати документ у базі даних (модель CRDT).
* Логувати зміни в `document_updates`.
* Періодично зберігати snapshot в `documents.state`.

Таблиця `documents` для зберігання стану (snapshot).

```
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    state BYTEA NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Таблиця `document_updates` для зберігання логів змін.
  
```
CREATE TABLE document_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    update BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> [! NOTE]
> При запуску редагування сервер піднімає модель CRDT зі snapshot + логів.
> Всі нові зміни записуються в базу даних.
> Snapshot потрібен для швидкого завантаження (щоб не накочувати 10k змін кожен раз).


### 4. Обробка помилок і відмовостійкість

* Якщо клієнт відключився → при reconnect він відправляє `last_known_update_id`.
* Сервер повертає всі зміни після цього ID.
* Якщо сервер падає → після рестарту CRDT відновлюється з snapshot + останніх змін.

> [! NOTE] 
> Такий підхід гарантує, що ніхто не втратить дані, навіть якщо сервер «впав» прямо в момент редагування.

<br>

## План завдань по кроках

1. **Базовий бекенд**

   * Налаштувати сервер за допомогою `actix_web`.
   * Додати необхідні ендпоінти.

2. **База даних**

   * Створити базу даних psql.
   * Створити міграції з таблицями `documents`, `document_updates`.
   * Додати необхідні CRUD-операції для документів та відповідні ендпоінти.

3. **WebSocket шар**

   * Реалізувати підключення до `/ws/{document_id}`.

4. **CRDT модель**

   * Підключити бібліотеку CRDT.
   * Налаштувати серіалізацію/десеріалізацію стану.
   * Додати необхідні методи для застосування змін і їх відправки.

5. **Frontend**

   * Інтерфейс з редактором (наприклад, CodeMirror з CRDT адаптером).
   * Підключення по WebSocket і оновлення стану редактора.

6. **Збереження стану**

   * При кожній зміні → лог в `document_updates`.
   * Snapshot в `documents.state` раз в N секунд або при закритті документа.

<br>

## API architecture
<img width="845" height="597" alt="image" src="https://github.com/user-attachments/assets/28130406-b104-4ee6-b779-9bc3d0184717" />

<br>


## 👨‍💻 Authors
**Rostyslav Kashper and Mariia Kaduk**  
GitHub: [FantRS](https://github.com/FantRS) and [MashaKaduk](https://github.com/MashaKaduk)
