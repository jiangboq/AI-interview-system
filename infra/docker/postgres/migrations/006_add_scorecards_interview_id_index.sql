-- Migration: add missing index on scorecards.interview_id (foreign key, used for lookups by interview)

CREATE INDEX IF NOT EXISTS idx_scorecards_interview_id ON scorecards(interview_id);
