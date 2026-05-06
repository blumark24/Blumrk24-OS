-- Safe migration: add sort_order to strategy_phases if not present
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE public.strategy_phases
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill: set sort_order = id for rows that have sort_order = 0
UPDATE public.strategy_phases
SET sort_order = id
WHERE sort_order = 0;
