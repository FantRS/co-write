CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuidv7(),
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE documents
    ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE document_members (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (document_id, user_id)
);

CREATE TABLE project_files (
    id          UUID    PRIMARY KEY DEFAULT uuidv7(),
    document_id UUID    NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    path        TEXT    NOT NULL,
    content     TEXT    NOT NULL DEFAULT '',
    is_dir      BOOLEAN NOT NULL DEFAULT false,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(document_id, path)
);
