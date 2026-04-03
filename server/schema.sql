DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE IF NOT EXISTS public.users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role        VARCHAR(20)   NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'player')),
  created_at  TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  type        VARCHAR(20)   NOT NULL CHECK (type IN ('daily', 'sunday')),
  location    VARCHAR(255)  NOT NULL,
  date        TIMESTAMPTZ   NOT NULL,
  max_players INT           NOT NULL CHECK (max_players > 0),
  created_by  INT           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id  INT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted')),
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, session_id)
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id  INT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  present     BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, session_id)
);
