-- Migration: convert interview_templates.interview_type into a foreign key
-- referencing interview_type(id). Existing text values are matched against
-- interview_type.name; anything without a match becomes NULL.

ALTER TABLE interview_templates
  ALTER COLUMN interview_type TYPE UUID USING (
    (SELECT it.id FROM interview_type it WHERE it.name = interview_templates.interview_type)
  );

ALTER TABLE interview_templates
  ADD CONSTRAINT fk_interview_templates_interview_type
  FOREIGN KEY (interview_type) REFERENCES interview_type(id);
