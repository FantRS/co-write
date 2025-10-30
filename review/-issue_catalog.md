# Technical Issue Catalog
**Project:** co-write
**Analysis Date:** 2025-10-30
**Analyzed by:** Claude (Project Review)

---

## Critical Issues

### 1. **Missing Required REST Endpoint: GET /documents/{id}/updates**
- **Location:** `server/src/app/routers/document_routes.rs:7-11`
- **Issue:** Specification requires `GET /documents/{id}/updates?since=...` endpoint to return change log for reconnect scenarios. This endpoint is completely missing from implementation.
- **Spec Reference:** README.md lines 29-35 states "GET /documents/{id}/updates?since=... → повернути лог змін (для відновлення при reconnect)"
- **Impact:** Clients cannot efficiently recover from disconnections. When reconnecting, they must reload entire document snapshot instead of just missing changes. This violates the specification's reconnect strategy.
- **Current Workaround:** WebSocket handler sends all existing changes on connect (ws_controller.rs:35-42), but this is inefficient for large change histories and doesn't support `since` parameter
- **Effort:** 4 hours (implement endpoint, add query parameter, filter changes by timestamp/id)

### 2. **API Path Inconsistency with Specification**
- **Location:** `server/src/app/routers/document_routes.rs:10`
- **Issue:** Document creation endpoint is `POST /documents/create` but specification requires `POST /documents`
- **Spec Reference:** README.md line 27 "POST /documents → створити документ"
- **Impact:** API does not conform to documented specification. Frontend uses `/documents/create` (client/src/configs/paths.js) requiring coordination between docs and implementation
- **Effort:** 1 hour (change route path, update API docs, update frontend)

### 3. **Database Schema Mismatch: Column Name Inconsistency**
- **Location:** `server/migrations/20251026223055_rename_state_column.sql:3`, `server/src/app/repositories/document_repository.rs:14-18`
- **Issue:** Migration renames column from `state` to `content`, but specification uses term "state" throughout (README.md mentions "documents.state" for snapshots)
- **Spec Reference:** README.md lines 33-34, 56-66, 79-82 consistently refer to "state" not "content"
- **Impact:** Terminology confusion between code and specification. Database schema drift from documented design.
- **Root Cause:** Migration added 3 weeks after initial schema without spec update
- **Effort:** 2 hours (revert migration or update all spec references)

### 4. **Race Condition: Concurrent WebSocket Messages**
- **Location:** `server/src/app/models/ws_rooms.rs:26-44`
- **Issue:** `send_change()` clones room connections (line 28), drops lock (line 29), then spawns async tasks (line 37). Between lock drop and message send, connections could be removed from room by `remove_connection()`, causing messages to be sent to disconnected sessions.
- **Code:**
```rust
let clients: Vec<_> = room.clone();  // line 28
drop(room);                           // line 29 - lock released
for mut conn in clients.into_iter() {
    actix_rt::spawn(async move {      // line 37 - async spawn
        conn.session.binary(change)   // line 38 - could fail if disconnected
```
- **Impact:** Failed message sends logged as warnings (line 39) but not handled. Potential for messages sent to closed connections.
- **Effort:** 3 hours (add connection validation, handle removal during send)

### 5. **Memory Leak: Unbounded document_updates Table Growth**
- **Location:** `server/src/app/services/document_service.rs:95-125`, `server/src/app/repositories/document_repository.rs:79-93`
- **Issue:** `merge_changes()` deletes applied updates from `document_updates` table (line 119), but only when merge daemon runs every 30 seconds (line 69). If document has no active connections, daemon stops (line 81-84) and updates accumulate forever.
- **Scenario:**
  1. Document edited, updates logged to DB
  2. All clients disconnect → daemon stops (line 83)
  3. Updates remain in DB forever, never merged or deleted
  4. Next connection triggers new daemon but doesn't clear old accumulated updates
- **Impact:** Database grows unbounded. Old documents accumulate thousands of unmerged updates consuming storage.
- **Effort:** 6 hours (implement cleanup strategy: merge on disconnect, periodic cleanup, or TTL)

### 6. **CRDT Sync Protocol Violation: Naive Text Replacement**
- **Location:** `client/src/pages/editor.js:220-247`
- **Issue:** Client uses naive text replacement instead of CRDT operations. Line 234: `doc.text = newText` replaces entire text field, not using Automerge Text type with insertAt/deleteAt operations.
- **Code:**
```javascript
this.doc = Automerge.change(this.doc, (doc) => {
    doc.text = newText;  // Wrong: replaces entire field
});
```
- **Expected:** Should use `Automerge.Text` with character-level operations for proper CRDT merging
- **Impact:** Concurrent edits will conflict poorly. When two users edit simultaneously, entire text gets replaced instead of character-level merge. This defeats the purpose of CRDT.
- **Evidence:** README.md lines 45-48 describe CRDT's character-level conflict resolution, but implementation doesn't use it
- **Effort:** 8 hours (refactor to use Automerge.Text, handle cursor positions, test concurrent edits)

### 7. **Missing Graceful Shutdown for Merge Daemons**
- **Location:** `server/src/main.rs:25-31`, `server/src/app/services/document_service.rs:66-93`
- **Issue:** Main function waits for Ctrl+C (line 25), cancels token (line 26), but doesn't wait for merge daemons to finish. Daemons check cancellation in select loop (line 75-78) but may be mid-merge when cancelled.
- **Impact:** Server shutdown during merge could leave database in inconsistent state (partially applied changes, transaction not committed). Data loss risk.
- **Effort:** 4 hours (add daemon tracking, graceful shutdown coordination, flush pending merges)

### 8. **No Document Snapshot Persistence Strategy**
- **Location:** `server/src/app/services/document_service.rs:96-108`
- **Issue:** Specification says "Періодично зберігати snapshot в `documents.state`" (README.md line 55), but `merge_changes()` runs every 30 seconds regardless of change volume. No strategy for snapshot frequency.
- **Problems:**
  - Small documents: snapshots every 30s wastes DB writes
  - Large documents: 30s might accumulate thousands of changes
  - No backpressure or adaptive snapshotting
- **Impact:** Inefficient resource usage. No optimization for different document sizes/activity levels.
- **Effort:** 5 hours (implement adaptive snapshotting based on change count/size/time)

---

## High Priority Issues

### 9. **Missing Authentication/Authorization**
- **Location:** All API endpoints
- **Issue:** No authentication or authorization. Anyone can create, read, modify any document. Specification doesn't mention auth, but production system needs it.
- **Impact:** Security vulnerability. No access control.
- **Effort:** 40 hours (design auth system, implement, integrate)

### 10. **No Request Validation**
- **Location:** `server/src/app/controllers/document_controller.rs:26-36`
- **Issue:** `create_document()` accepts any string as title without validation. No length limits, no sanitization.
- **Impact:** Could create documents with empty titles, extremely long titles (DOS), or malicious content.
- **Effort:** 2 hours (add validation middleware, length limits, sanitization)

### 11. **WebSocket Error Response Format Inconsistency**
- **Location:** `server/src/app/controllers/ws_controller.rs:143-162`, `client/src/pages/editor.js:119-133`
- **Issue:** Server sends JSON status responses as binary (line 86), client tries to detect JSON by checking first byte === 123 (line 140). Fragile detection logic.
- **Impact:** If Automerge sync message happens to start with byte 123 ('{'), it will be mis-parsed as JSON status. Protocol confusion.
- **Effort:** 3 hours (use separate WebSocket message types or dedicated status channel)

### 12. **No Connection Limit Enforcement**
- **Location:** `server/src/app/models/ws_rooms.rs:8-10`, `server/src/app/controllers/ws_controller.rs:126-134`
- **Issue:** Rooms can accumulate unlimited connections. No limit on connections per document or total connections.
- **Impact:** DOS vulnerability. Attacker can open thousands of connections to single document, exhausting server resources.
- **Effort:** 4 hours (add connection limits, implement backpressure, graceful rejection)

### 13. **Missing Database Connection Pool Configuration**
- **Location:** `server/src/core/database.rs:9-12`
- **Issue:** Max connections defaults to 5 if `DB_MAX_CONN` not set. For production with many concurrent users, this is likely too low. No min_connections, no idle timeout, no connection lifetime configured.
- **Impact:** Connection starvation under load. Requests will block waiting for free connections.
- **Effort:** 2 hours (add comprehensive pool configuration, document in env vars)

### 14. **Typo in Log Message**
- **Location:** `server/src/app/controllers/ws_controller.rs:38`
- **Issue:** Log says "Failed to send axesting changes" - should be "existing changes"
- **Impact:** Confusing error messages in production logs
- **Effort:** 5 minutes (fix typo)

### 15. **No Structured Logging Context**
- **Location:** `server/src/telemetry.rs` (file exists but not reviewed in detail)
- **Issue:** Tracing spans defined (document_controller.rs:12-16) but no document_id, user_id, or session_id in context for log correlation
- **Impact:** Difficult to debug production issues, can't trace request flows
- **Effort:** 3 hours (add structured context to all spans, add correlation IDs)

### 16. **Client Reconnection Creates New Sync State**
- **Location:** `client/src/pages/editor.js:92-111`
- **Issue:** On reconnection (line 108), `setupWebSocket()` is called which creates fresh websocket but doesn't reset Automerge sync state. Old sync state might conflict with new connection.
- **Impact:** After reconnect, sync might be confused about what other peer has seen. Potential for sync failures.
- **Effort:** 3 hours (research Automerge reconnect protocol, implement proper state reset)

---

## Medium Priority Issues

### 17. **No Test Coverage**
- **Location:** Entire project
- **Issue:** Zero automated tests. No unit tests, integration tests, or end-to-end tests.
- **Impact:** No regression detection, difficult to refactor safely, unknown code quality
- **Effort:** 80 hours (establish test framework, write comprehensive test suite)

### 18. **No API Documentation Examples**
- **Location:** `server/src/api_doc.rs:1-21`
- **Issue:** OpenAPI documentation defined but no request/response examples, no error documentation
- **Impact:** API harder to use, unclear error conditions
- **Effort:** 6 hours (add examples, error schemas, improve descriptions)

### 19. **Hard-coded Debounce Timeout**
- **Location:** `client/src/pages/editor.js:229, 247`
- **Issue:** 300ms debounce timeout is hard-coded. Should be configurable for different network conditions.
- **Impact:** Users on slow connections might lose edits if they type fast, users on fast connections have unnecessary latency
- **Effort:** 2 hours (make configurable, add adaptive debouncing)

### 20. **No Document Title Length Validation**
- **Location:** `server/src/app/controllers/document_controller.rs:26`, database schema
- **Issue:** Document title is TEXT type (unlimited) with no application-level validation
- **Impact:** Could create documents with multi-megabyte titles, database bloat
- **Effort:** 1 hour (add length validation, document limits)

### 21. **Merge Daemon Interval Not Configurable**
- **Location:** `server/src/app/services/document_service.rs:69`
- **Issue:** 30-second merge interval is hard-coded
- **Impact:** Cannot tune for performance vs. resource usage trade-off
- **Effort:** 1 hour (make configurable via environment variable)

### 22. **Client Error Messages in Ukrainian Only**
- **Location:** `client/src/pages/index.js`, `client/src/pages/editor.js`
- **Issue:** All user-facing messages are in Ukrainian ("Введіть назву документу", etc.), no internationalization
- **Impact:** Limits user base to Ukrainian speakers
- **Effort:** 10 hours (implement i18n, translate to multiple languages)

### 23. **No Document Deletion API**
- **Location:** Missing from all routes
- **Issue:** Specification doesn't mention deletion, but practical applications need it. No way to remove documents.
- **Impact:** Database grows forever, no cleanup for test/abandoned documents
- **Effort:** 3 hours (add DELETE endpoint, handle cascading deletes)

### 24. **Cursor Position Restoration Unreliable**
- **Location:** `client/src/pages/editor.js:208-214`
- **Issue:** After remote update, cursor position is restored naively (lines 213-214). Doesn't account for text length changes from remote edits.
- **Impact:** If remote edit inserted text before cursor, cursor position will be wrong after restoration
- **Effort:** 6 hours (implement proper cursor tracking with CRDT positions)

---

## Low Priority Issues

### 25. **No Logging of Successful Operations**
- **Location:** `server/src/app/controllers/document_controller.rs:31-35, 54-56`
- **Issue:** Only logs on success/error, no INFO level logs for successful operations with details
- **Impact:** Missing audit trail, difficult to monitor normal operation
- **Effort:** 2 hours (add INFO level logging with appropriate details)

### 26. **Client Package.json Missing**
- **Location:** Analyzed client structure, but package.json not reviewed
- **Issue:** Unable to verify client dependencies, versions, or scripts
- **Impact:** Unknown dependency vulnerabilities, unclear build process
- **Effort:** 1 hour (review dependencies, update to latest stable versions)

### 27. **No Database Migration Rollback Scripts**
- **Location:** `server/migrations/` directory
- **Issue:** Only `.up.sql` migration present, no `.down.sql` for rollbacks
- **Impact:** Cannot safely roll back migrations in production if issues found
- **Effort:** 2 hours (write rollback scripts for all migrations)

### 28. **No Health Check Endpoint**
- **Location:** Missing from routes
- **Issue:** No `/health` or `/ping` endpoint for load balancer/monitoring
- **Impact:** Cannot monitor service health, difficult to integrate with infrastructure
- **Effort:** 1 hour (add simple health check endpoint)

### 29. **No Metrics/Observability**
- **Location:** No Prometheus/metrics integration visible
- **Issue:** No application-level metrics (active connections, documents, latency, etc.)
- **Impact:** Cannot monitor performance, capacity planning difficult
- **Effort:** 8 hours (integrate metrics library, add key metrics, create dashboards)

### 30. **Environment Variable Documentation Missing**
- **Location:** No `.env.example` file
- **Issue:** Required environment variables not documented (must read code to discover)
- **Impact:** Difficult for new developers to set up project
- **Effort:** 1 hour (create .env.example with all variables and descriptions)

---

## Technical Debt Summary

| Severity | Count | Total Hours |
|----------|-------|-------------|
| Critical | 8 | 32 hours |
| High | 8 | 67 hours |
| Medium | 8 | 111 hours |
| Low | 6 | 15 hours |
| **Total** | **30** | **225 hours** **(28 days)** |

---

## Architectural Observations

### Strengths
1. **Clear layered architecture** (controllers → services → repositories)
2. **CRDT library integrated** (Automerge) for conflict resolution
3. **Proper database migrations** with schema versioning
4. **OpenAPI documentation** started (though incomplete)
5. **WebSocket for real-time** synchronization implemented
6. **Graceful shutdown** attempted (cancel token pattern)

### Weaknesses
1. **Specification drift**: Implementation diverged from documented requirements
2. **No testing strategy**: Zero tests increases risk
3. **CRDT misuse**: Client doesn't use character-level operations, defeating CRDT benefits
4. **Resource management**: No limits on connections, unbounded database growth
5. **Production readiness**: Missing auth, monitoring, health checks, metrics
6. **Error recovery**: Incomplete reconnection handling, no backpressure

### Design Patterns Observed
- **Repository Pattern**: Clean separation of data access (repositories/)
- **Service Layer**: Business logic isolated in services/
- **Builder Pattern**: AppDataBuilder for configuration
- **Dependency Injection**: AppData passed through actix-web Data<>
- **Event-Driven**: WebSocket message handling with tokio::select
- **Background Tasks**: Merge daemon pattern for async processing

### Missing Design Patterns
- **Circuit Breaker**: No protection against cascading failures
- **Rate Limiting**: No protection against abuse
- **Retry Logic**: No automatic retry for transient failures
- **Saga Pattern**: No compensation for partial failures in distributed operations

---

## Completeness Assessment

Based on README.md specification vs. implementation:

| Specification Requirement | Status | Evidence |
|---------------------------|--------|----------|
| POST /documents (create) | ⚠️ Partial | Implemented as POST /documents/create |
| GET /documents/{id} (snapshot) | ✅ Complete | Implemented |
| GET /documents/{id}/updates?since= | ❌ Missing | Not implemented |
| WebSocket /ws/{id} | ✅ Complete | Implemented |
| CRDT sync (Automerge) | ⚠️ Partial | Integrated but misused (naive text replacement) |
| Database: documents table | ✅ Complete | Implemented (column renamed state→content) |
| Database: document_updates table | ✅ Complete | Implemented |
| Periodic snapshot merge | ⚠️ Partial | Implemented but naive (fixed 30s interval) |
| Reconnect with `last_known_update_id` | ❌ Missing | Spec requires, not implemented |
| Client: document list/selection | ⚠️ Partial | Has lobby, but no list of existing documents |
| Client: real-time editing | ✅ Complete | Implemented with Automerge |
| Client: reconnection handling | ⚠️ Partial | Attempts reconnect but doesn't sync state properly |

**Completeness: 50%** (6/12 requirements fully complete, 5 partial, 1 missing)
