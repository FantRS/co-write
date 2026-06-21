-- MIGRATION FOR RENAME COLUMN 'state' to 'content' IN 'documents' TABLE

ALTER TABLE documents RENAME COLUMN state TO content;