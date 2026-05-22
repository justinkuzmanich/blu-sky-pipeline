-- Add gmail_draft_id column to deals for Gmail draft tracking
-- Stores the Gmail message ID so the UI can deep-link to the draft and the
-- Edge Function can skip re-creating it on retry.
alter table public.deals add column if not exists gmail_draft_id text;
