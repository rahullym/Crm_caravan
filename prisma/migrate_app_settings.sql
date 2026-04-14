-- Migration: Add AppSetting table for storing key/value app configuration
-- Run via: psql $DATABASE_URL -f prisma/migrate_app_settings.sql
-- OR paste into Neon console SQL editor

CREATE TABLE IF NOT EXISTS "AppSetting" (
  "key"       TEXT        NOT NULL,
  "value"     TEXT        NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);
