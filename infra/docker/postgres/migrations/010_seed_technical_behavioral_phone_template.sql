-- Migration: seed global "technical and behavioral phone interview" template

INSERT INTO interview_templates (name, is_global, interview_type, duration_minutes, config_json)
VALUES (
  'technical and behavioral phone interview',
  TRUE,
  'f5c7f230-a256-4e25-86b8-4ef78ad0a393',
  NULL,
  '{
    "steps": [
      {
        "order": 1,
        "key": "introduction",
        "title": "Introduction",
        "description": "Interviewer and candidate introductions; overview of the interview format.",
        "duration_minutes": 5
      },
      {
        "order": 2,
        "key": "project_in_resume",
        "title": "Project in Resume",
        "description": "Deep dive into a project from the candidate resume, probing technical decisions and contributions.",
        "duration_minutes": 15
      },
      {
        "order": 3,
        "key": "behavioral",
        "title": "Behavioral",
        "description": "Behavioral questions assessing collaboration, communication, and past experience.",
        "duration_minutes": 15
      },
      {
        "order": 4,
        "key": "qa",
        "title": "Q&A",
        "description": "Open floor for the candidate to ask questions.",
        "duration_minutes": 5
      }
    ]
  }'::jsonb
);
