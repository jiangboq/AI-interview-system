-- Migration: add resume_blobs table
-- Run once against an existing database that was initialized before this table was added.

CREATE TABLE IF NOT EXISTS resume_blobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id),
  file_url TEXT NOT NULL,
  file_ext TEXT,
  raw_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_blobs_file_url ON resume_blobs(file_url);
CREATE INDEX IF NOT EXISTS idx_resume_blobs_candidate ON resume_blobs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resume_blobs_status ON resume_blobs(status);
