CREATE TABLE IF NOT EXISTS interaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  profile_id INTEGER,
  session_id TEXT,
  event_type TEXT NOT NULL,
  content_id TEXT,
  skill_ids TEXT[],
  success BOOLEAN,
  score NUMERIC,
  duration_ms INTEGER,
  payload JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_interaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_interaction_profile FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_interaction_events_user ON interaction_events(user_id);
CREATE INDEX IF NOT EXISTS idx_interaction_events_profile ON interaction_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_interaction_events_type ON interaction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_interaction_events_occurred_at ON interaction_events(occurred_at);
