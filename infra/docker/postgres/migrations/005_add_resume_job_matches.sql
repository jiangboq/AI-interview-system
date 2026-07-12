-- Migration: add jobs.parsed_requirements and resume_job_matches table for resume-JD match scoring

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS parsed_requirements JSONB;

CREATE TABLE IF NOT EXISTS resume_job_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id),
  job_id UUID REFERENCES jobs(id),
  resume_blob_id UUID REFERENCES resume_blobs(id),

  overall_score NUMERIC(5,2),
  recommendation TEXT,
  matched_skills TEXT[],
  missing_skills TEXT[],
  summary TEXT,
  model TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (candidate_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_resume_job_matches_candidate ON resume_job_matches(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resume_job_matches_job ON resume_job_matches(job_id);
