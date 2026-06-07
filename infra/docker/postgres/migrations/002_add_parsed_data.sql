-- Migration: add parsed_data column to resume_blobs
ALTER TABLE resume_blobs ADD COLUMN IF NOT EXISTS parsed_data JSONB;

CREATE INDEX IF NOT EXISTS idx_resume_blobs_parsed_data ON resume_blobs USING GIN (parsed_data);
