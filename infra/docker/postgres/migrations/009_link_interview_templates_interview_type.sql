-- Migration: convert interview_templates.interview_type into a foreign key
-- referencing interview_type(id). Existing text values are matched against
-- interview_type.name; anything without a match becomes NULL.

ALTER TABLE interview_templates ADD COLUMN interview_type_id UUID;

UPDATE interview_templates it
SET interview_type_id = lut.id
FROM interview_type lut
WHERE lut.name = it.interview_type;

ALTER TABLE interview_templates DROP COLUMN interview_type;
ALTER TABLE interview_templates RENAME COLUMN interview_type_id TO interview_type;

ALTER TABLE interview_templates
  ADD CONSTRAINT fk_interview_templates_interview_type
  FOREIGN KEY (interview_type) REFERENCES interview_type(id);
