-- Migration: Replace old LeadStatus enum with new 10-stage pipeline
-- Run via: psql $DATABASE_URL -f prisma/migrate_lead_status.sql
-- OR paste into Neon console SQL editor

BEGIN;

-- Step 1: Add new enum type
CREATE TYPE "LeadStatus_new" AS ENUM (
  'NEW_LEAD',
  'CONTACTED',
  'ENGAGED',
  'QUALIFIED',
  'OPTIONS_SENT',
  'SHORTLISTED',
  'HOT_LEAD',
  'QUOTE_SENT',
  'DECISION_PENDING',
  'DEPOSIT_PAID',
  'LOST'
);

-- Step 2: Map old values to new values in Lead table
ALTER TABLE "Lead"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LeadStatus_new"
    USING (
      CASE "status"::text
        WHEN 'INQUIRY'     THEN 'NEW_LEAD'
        WHEN 'DEMO'        THEN 'QUALIFIED'
        WHEN 'NEGOTIATION' THEN 'DECISION_PENDING'
        WHEN 'WON'         THEN 'DEPOSIT_PAID'
        WHEN 'LOST'        THEN 'LOST'
        ELSE 'NEW_LEAD'
      END
    )::"LeadStatus_new",
  ALTER COLUMN "status" SET DEFAULT 'NEW_LEAD';

-- Step 3: Drop old enum type
DROP TYPE "LeadStatus";

-- Step 4: Rename new enum to the final name
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";

COMMIT;
