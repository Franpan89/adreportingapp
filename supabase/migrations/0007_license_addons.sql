-- Add addons JSONB column to licenses table
-- Stores feature flags for paid add-ons per agency
-- Example: { "story_engine": true }

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS addons JSONB NOT NULL DEFAULT '{}'::jsonb;
