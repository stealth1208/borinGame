-- Migration: Add impostorsKnowEachOther setting support
-- The settings column is already JSONB, so this migration documents the new field
-- and ensures backward compatibility

-- No schema changes needed - settings is already JSONB
-- New rooms will include impostorsKnowEachOther in settings JSON
-- Existing rooms will continue to work (field defaults to false when missing)

-- This migration serves as documentation of the schema change
-- Application code handles the new optional boolean field: settings.impostorsKnowEachOther

DO $$
BEGIN
  RAISE NOTICE 'Migration complete: impostorsKnowEachOther field added to room settings (JSONB)';
END $$;
