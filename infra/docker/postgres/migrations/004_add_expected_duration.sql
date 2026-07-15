-- Migration: add expected_duration column to interviews (seconds)

ALTER TABLE interviews ADD COLUMN IF NOT EXISTS expected_duration INTEGER;

COMMENT ON COLUMN interviews.expected_duration IS 'Expected interview duration in seconds';
