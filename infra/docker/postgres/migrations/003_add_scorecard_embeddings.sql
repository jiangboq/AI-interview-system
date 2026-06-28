-- Migration: add pgvector extension and scorecard_embeddings table for RAG-based score calibration

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS scorecard_embeddings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scorecard_id UUID NOT NULL REFERENCES scorecards(id) ON DELETE CASCADE,
  job_id       UUID NOT NULL REFERENCES jobs(id),
  embedding    VECTOR(1536),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scorecard_embeddings_job ON scorecard_embeddings(job_id);
CREATE INDEX IF NOT EXISTS idx_scorecard_embeddings_vec ON scorecard_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
