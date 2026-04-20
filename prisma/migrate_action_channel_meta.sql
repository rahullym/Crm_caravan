-- Migration: Add META_PAID and META_ORGANIC to ActionChannel enum
-- Run via: psql $DATABASE_URL -f prisma/migrate_action_channel_meta.sql
-- OR paste into Neon console SQL editor

ALTER TYPE "ActionChannel" ADD VALUE IF NOT EXISTS 'META_PAID';
ALTER TYPE "ActionChannel" ADD VALUE IF NOT EXISTS 'META_ORGANIC';
