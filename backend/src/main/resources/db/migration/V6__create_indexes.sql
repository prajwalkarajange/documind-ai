-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS documents_user_idx ON documents (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chunks_doc_idx ON document_chunks (document_id, chunk_index);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON chat_sessions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_session_idx ON chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS user_roles_user_idx ON user_roles (user_id);
