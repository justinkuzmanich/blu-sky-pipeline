-- ============================================================
-- Migration: extend_prospect_value_check
-- Purpose: Add listing-video and social-video to the anon
--          Prospect insert policy — new deal types introduced
--          for the Bluskyfilms contact form.
--
-- Extends:
--   deal_type allowlist  → + 'listing-video', 'social-video'
--   value allowlist      → + listing-video = 999, social-video = 2250
--
-- Backward-compat: original 'video' + 'social' clauses retained.
--
-- Apply via: Supabase Dashboard → SQL Editor, or `supabase db push`
-- ============================================================

drop policy if exists "allow_public_prospect_insert" on public.deals;

create policy "allow_public_prospect_insert"
  on public.deals
  for insert
  to anon
  with check (
    -- Must land in Prospect (stage 0) — never skip ahead
    stage = 0

    -- Must target the pipeline owner's account
    and user_id = '48218afa-906b-44ed-903c-fb4dcc6473aa'

    -- Status must be active (default) — can't pre-close a deal
    and (status is null or status = 'active')

    -- Value allowlist: zero/null for custom, or known service prices
    and (
      value is null
      or value = 0
      or (deal_type = 'video'         and value = 999)
      or (deal_type = 'listing-video' and value = 999)
      or (deal_type = 'social'        and value = 2250)
      or (deal_type = 'social-video'  and value = 2250)
    )

    -- next_step must be null — only the owner sets follow-ups
    and next_step is null

    -- deal_type must be one of the known pipeline keys (or null)
    and (
      deal_type is null
      or deal_type in (
        'video', 'listing-video', 'social-video',
        'website', 'social', 'ads', 'photo', 'consult', 'techsupport', 'other'
      )
    )

    -- Field length caps — prevent abuse / oversized payloads
    and (name     is null or char_length(name)     <= 200)
    and (email    is null or char_length(email)    <= 254)
    and (phone    is null or char_length(phone)    <= 30)
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
