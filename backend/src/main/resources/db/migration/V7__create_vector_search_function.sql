-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_document_chunks(
  _document_id UUID,
  _query vector(768),
  _match_count INT DEFAULT 6
) RETURNS TABLE (
  id UUID,
  content TEXT,
  page_number INT,
  similarity DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT c.id, c.content, c.page_number, 1 - (c.embedding <=> _query) AS similarity
  FROM document_chunks c
  WHERE c.document_id = _document_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> _query
  LIMIT GREATEST(1, LEAST(_match_count, 20));
$$;
