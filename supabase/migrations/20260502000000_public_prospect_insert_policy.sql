-- ============================================================
-- Migration: allow_public_prospect_insert
-- Purpose: Let the anon role (unauthenticated contact form
--          requests) insert a single Prospect deal (stage = 0)
--          into the pipeline owner's account.
--
-- BEFORE applying: replace 48218afa-906b-44ed-903c-fb4dcc6473aa with the
-- actual UUID of the Bluskyfilms Supabase account.
-- Find it in: Supabase Dashboard → Authentication → Users.
--
-- Apply via: Supabase Dashboard → SQL Editor, or `supabase db push`
-- ============================================================

-- Grant the anon role INSERT privilege on the deals table.
-- (RLS still applies — this just makes the table reachable.)
grant insert on public.deals to anon;

-- Allow anon to read the sequence so gen_random_uuid() works
-- (Supabase grants this by default, but included for completeness)
grant usage on schema public to anon;

create policy "allow_public_prospect_insert"
  on public.deals
  for insert
  to anon
  with check (
    -- Must land in Prospect (stage 0) — never skip ahead
    stage = 0

    -- Must target the pipeline owner's account
    -- Replace the placeholder with the real UUID before applying
    and user_id = '48218afa-906b-44ed-903c-fb4dcc6473aa'

    -- Status must be active (default) — can't pre-close a deal
    and (status is null or status = 'active')

    -- Value must be zero/null — contact form doesn't set price
    and (value is null or value = 0)

    -- next_step must be null — only the owner sets follow-ups
    and next_step is null

    -- deal_type must be one of the known pipeline keys (or null)
    and (
      deal_type is null
      or deal_type in ('video','website','social','ads','photo','consult','techsupport','other')
    )

    -- Field length caps — prevent abuse / oversized payloads
    and (name    is null or char_length(name)     <= 200)
    and (email   is null or char_length(email)    <= 254)
    and (phone   is null or char_length(phone)    <= 30)
    and (business is null or char_length(business) <= 200)

    -- Notes: max 1 entry (the contact message), max 2 000 chars
    and (
      notes is null
      or (
        jsonb_typeof(notes) = 'array'
        and jsonb_array_length(notes) <= 1
        and (
          jsonb_array_length(notes) = 0
          or char_length(notes -> 0 ->> 'text') <= 2000
        )
      )
    )
  );

-- ============================================================
-- No SELECT / UPDATE / DELETE granted to anon.
-- Authenticated users keep their existing policies unchanged.
-- ============================================================
