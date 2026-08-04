-- Migration: seed v1 consent_records entry

INSERT INTO consent_records (consent, version)
VALUES (
  'This interview is conducted by an AI system.

Your voice and responses may be processed to generate interview feedback.

This is a research beta and is not an employment decision system.

By clicking Continue, you consent to this interview.',
  'v1'
)
ON CONFLICT (consent, version) DO NOTHING;
