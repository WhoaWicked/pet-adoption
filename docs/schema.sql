-- การออกแบบ schema ตั้งต้นของโปรเจกต์ (เอกสารอ้างอิง)
-- schema ปัจจุบันของ database ให้ดูจาก api/migrations/ ไฟล์นี้ไม่ถูกอัปเดตตามอัตโนมัติ

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  species      TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
  age_months   INT  NOT NULL CHECK (age_months >= 0),
  province     TEXT NOT NULL,
  description  TEXT NOT NULL,
  requirements TEXT NOT NULL,
  image_url    TEXT,
  status       TEXT NOT NULL DEFAULT 'available'
               CHECK (status IN ('available', 'adopted', 'closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pets_browse ON pets (status, species, province);
CREATE INDEX idx_pets_owner  ON pets (owner_id);

CREATE TABLE adoption_applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id       UUID NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  answers      JSONB NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at   TIMESTAMPTZ,
  UNIQUE (pet_id, applicant_id)
);
CREATE INDEX idx_applications_applicant ON adoption_applications (applicant_id);

CREATE TABLE ai_summaries (
  application_id UUID PRIMARY KEY
                 REFERENCES adoption_applications(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts       INT  NOT NULL DEFAULT 0,
  summary        JSONB,
  last_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE saved_pets (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id     UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pet_id)
);
CREATE INDEX idx_saved_pets_user ON saved_pets (user_id, created_at DESC);

CREATE TABLE notifications (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  entity_id  UUID NOT NULL,
  message    TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);