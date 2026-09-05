-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============ SAAS LIMITS ============
-- Add credits to workspaces
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS credits INT NOT NULL DEFAULT 5;

-- ============ RAG INFRASTRUCTURE ============
-- Create documents table for embeddings
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Users can only read documents from their workspaces
CREATE POLICY "Users can read their workspace documents" ON public.documents
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
  );

-- Only admins/owners can upload documents
CREATE POLICY "Admins can insert documents" ON public.documents
  FOR INSERT WITH CHECK (
    public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "Admins can update documents" ON public.documents
  FOR UPDATE USING (
    public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "Admins can delete documents" ON public.documents
  FOR DELETE USING (
    public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
  );

-- Create an index for vector similarity search (HNSW)
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON public.documents 
USING hnsw (embedding vector_ip_ops);

-- ============ RAG MATCH FUNCTION ============
-- Function to find nearest documents
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_workspace_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE d.workspace_id = p_workspace_id
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
