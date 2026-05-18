-- Migration: Add GOOGLE_ADS to LeadSource enum
-- Run via: psql $DATABASE_URL -f prisma/migrate_lead_source_google_ads.sql
-- OR paste into Neon console SQL editor

ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'GOOGLE_ADS';
