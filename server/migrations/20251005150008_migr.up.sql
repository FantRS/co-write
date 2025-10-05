CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
    documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        title TEXT NOT NULL,
        state BYTEA NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE TABLE
    document_updates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        document_id UUID NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
        update BYTEA NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );