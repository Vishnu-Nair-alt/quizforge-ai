-- Run this once against the deployed PostgreSQL database after deploying the
-- application refactor. Existing quizzes, questions, sessions, and history are
-- preserved; only obsolete source-PDF data is removed.

BEGIN;

DROP TABLE IF EXISTS uploaded_documents;
ALTER TABLE quizzes DROP COLUMN IF EXISTS filename;

COMMIT;
