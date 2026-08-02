-- Migration: add is_global column to interview_templates

ALTER TABLE interview_templates ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN interview_templates.is_global IS 'If true, template applies globally across all organizations rather than a single organization';
