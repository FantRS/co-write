# Co-Write Client - Automerge Integration

Клієнтська частина синхронного редактора з використанням Automerge CRDT.

## 🚀 Швидкий старт

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Запуск dev сервера

```bash
npx vite --host
```

Сервер запуститься на `http://localhost:5173` (або іншому порту, якщо зайнятий).

## 🧪 Тестування синхронізації

### Підготовка

1. Переконайтеся, що backend сервер запущений:
   ```bash
   cd ../server
   cargo run
   ```

2. Backend має бути доступний на `http://localhost:8080`

### Тестування multi-user синхронізації

1. Відкрийте `http://localhost:5173/client/index.html` в браузері
2. Створіть новий документ
3. Скопіюйте посилання на документ
4. Відкрийте те саме посилання в **2-3 нових вкладках** браузера
5. Почніть одночасно редагувати текст у різних вкладках
6. Спостерігайте за **миттєвою синхронізацією** між всіма клієнтами!

### Що очікувати

- ✅ Зміни синхронізуються в реальному часі
- ✅ Автоматичне розв'язання конфліктів через CRDT
- ✅ Позиція курсора зберігається при оновленнях
- ✅ Мінімальний мережевий трафік (тільки дельти)

## 🛠 Технічні деталі

### Технології

- **Automerge** - CRDT бібліотека для розв'язання конфліктів
- **WebSocket** - бінарний протокол для sync messages
- **Vite** - швидкий dev сервер з підтримкою WASM

### Структура

```
client/
├── editor.html           # Сторінка редактора
├── index.html           # Головна сторінка
├── scripts/
│   ├── pages/
│   │   └── editor.js    # Основна логіка з Automerge
│   ├── core/
│   │   └── paths.js     # API endpoints
│   └── other/
│       └── showToast.js # UI utilities
├── styles.css           # Стилі
└── vite.config.js       # Конфігурація Vite + WASM
```

### Automerge Flow

1. При підключенні клієнт створює Automerge документ з `Text` полем
2. Ініціалізується `syncState` для відстеження синхронізації
3. При введенні тексту:
   - Обчислюється diff через common prefix/suffix алгоритм
   - Застосовуються зміни: `doc.content.deleteAt()` / `insertAt()`
   - Генерується sync message через `generateSyncMessage()`
   - Відправляється на сервер як бінарне повідомлення
4. При отриманні змін:
   - Парситься бінарне sync message
   - Застосовується через `receiveSyncMessage()`
   - Оновлюється UI зі збереженням курсора

## 📦 Залежності

### Production
- `@automerge/automerge` - CRDT sync engine
- `ws` - WebSocket library

### Development
- `vite` - Dev server
- `vite-plugin-wasm` - WASM підтримка для Vite
- `vite-plugin-top-level-await` - Top-level await для WASM

## 🐛 Troubleshooting

### WASM помилка в Vite

Якщо бачите помилку "ESM integration proposal for Wasm is not supported":

```bash
npm install -D vite-plugin-wasm vite-plugin-top-level-await
```

Переконайтеся, що `vite.config.js` містить правильні плагіни.

### WebSocket не підключається

Перевірте:
1. Backend сервер запущений на порту 8080
2. В `scripts/core/paths.js` правильний URL
3. В консолі браузера немає CORS помилок

### Текст не синхронізується

1. Відкрийте DevTools → Network → WS
2. Перевірте, чи відправляються binary messages
3. Перегляньте Console на наявність помилок Automerge

## 📝 Примітки

- Сервер використовує Rust + Actix для обробки sync messages
- Зміни зберігаються в PostgreSQL
- Merge daemon на сервері консолідує зміни кожні 5 хвилин

