-- =========================================
-- AI Interview System - PostgreSQL Init
-- =========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- users
-- =========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('candidate', 'recruiter', 'admin')) DEFAULT 'candidate',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- organizations
-- =========================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- organization_users
-- =========================================
CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_role TEXT CHECK (org_role IN ('owner', 'recruiter', 'interviewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- =========================================
-- jobs
-- =========================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  title TEXT,
  description TEXT,
  interview_type TEXT CHECK (interview_type IN ('behavioral', 'coding', 'mixed')),
  level TEXT CHECK (level IN ('junior', 'mid', 'senior', 'staff')),
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- candidates
-- =========================================
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  full_name TEXT,
  email TEXT,
  resume_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidate_email ON candidates(email);

-- =========================================
-- interview_templates
-- =========================================
CREATE TABLE interview_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT,
  interview_type TEXT,
  duration_minutes INT,
  config_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- question_bank
-- =========================================
CREATE TABLE question_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  template_id UUID REFERENCES interview_templates(id),
  job_id UUID REFERENCES jobs(id),
  question_type TEXT,
  prompt TEXT,
  expected_skills JSONB,
  difficulty TEXT,
  order_index INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_question_template ON question_bank(template_id);
CREATE INDEX idx_question_job ON question_bank(job_id);

-- =========================================
-- rubrics
-- =========================================
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  job_id UUID REFERENCES jobs(id),
  name TEXT,
  dimensions JSONB,
  scoring_scale JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JSONB GIN index（关键）
CREATE INDEX idx_rubrics_dimensions ON rubrics USING GIN (dimensions);

-- =========================================
-- interviews
-- =========================================
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  candidate_id UUID REFERENCES candidates(id),
  job_id UUID REFERENCES jobs(id),
  template_id UUID REFERENCES interview_templates(id),
  rubric_id UUID REFERENCES rubrics(id),

  status TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  livekit_room_name TEXT,

  final_score NUMERIC(5,2),
  recommendation TEXT,
  summary TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interview_candidate ON interviews(candidate_id);
CREATE INDEX idx_interview_job ON interviews(job_id);

-- =========================================
-- interview_questions
-- =========================================
CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  question_bank_id UUID REFERENCES question_bank(id),
  sequence_no INT,

  displayed_prompt TEXT,

  state TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_interview_questions_interview ON interview_questions(interview_id);

-- =========================================
-- turns（核心表）
-- =========================================
CREATE TABLE turns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  interview_question_id UUID REFERENCES interview_questions(id),

  speaker TEXT,
  turn_index INT,

  text TEXT,

  start_time_ms BIGINT,
  end_time_ms BIGINT,
  latency_ms INT,

  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turns_interview ON turns(interview_id, turn_index);
CREATE INDEX idx_turns_metadata ON turns USING GIN (metadata);

-- =========================================
-- transcript_segments
-- =========================================
CREATE TABLE transcript_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id),
  turn_id UUID REFERENCES turns(id),

  speaker TEXT,
  content TEXT,

  start_offset_ms BIGINT,
  end_offset_ms BIGINT,

  confidence NUMERIC(5,2),
  is_final BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_segments_turn ON transcript_segments(turn_id);

-- =========================================
-- scorecards
-- =========================================
CREATE TABLE scorecards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id),

  overall_score NUMERIC(5,2),
  recommendation TEXT,

  strengths JSONB,
  concerns JSONB,
  raw_evaluation JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- scorecard_dimensions
-- =========================================
CREATE TABLE scorecard_dimensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scorecard_id UUID REFERENCES scorecards(id) ON DELETE CASCADE,

  dimension_name TEXT,
  score NUMERIC(5,2),

  evidence JSONB,
  rationale TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scorecard_dimensions ON scorecard_dimensions(scorecard_id);

-- =========================================
-- scorecard_question_scores
-- =========================================
CREATE TABLE scorecard_question_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id),
  interview_question_id UUID REFERENCES interview_questions(id),

  dimension_scores JSONB,
  evidence JSONB,
  summary TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- artifacts
-- =========================================
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id),

  artifact_type TEXT,
  storage_url TEXT,
  mime_type TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- audit_events（非常关键）
-- =========================================
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT,
  entity_id UUID,

  event_type TEXT,
  payload JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_event ON audit_events(event_type);
CREATE INDEX idx_audit_payload ON audit_events USING GIN (payload);