ALTER TABLE document_members
    ADD COLUMN role TEXT NOT NULL DEFAULT 'reader'
        CHECK (role IN ('reader', 'editor', 'manager'));
