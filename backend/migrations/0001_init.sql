-- Users table for authentication
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles associated with learner data
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  last_subject TEXT,
  last_chapter TEXT,
  user_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assignments authored by educators
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
