-- Migration: add interview_type lookup table

CREATE TABLE IF NOT EXISTS interview_type (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO interview_type (name)
VALUES ('Phone Technical Interview')
ON CONFLICT (name) DO NOTHING;
