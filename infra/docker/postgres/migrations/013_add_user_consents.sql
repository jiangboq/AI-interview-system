-- Migration: add user_consents table

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id),
  consent_id UUID REFERENCES consent_records(id),
  interview_id UUID REFERENCES interviews(id),
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_consents_candidate ON user_consents(candidate_id);
CREATE INDEX idx_user_consents_consent ON user_consents(consent_id);
CREATE INDEX idx_user_consents_interview ON user_consents(interview_id);
