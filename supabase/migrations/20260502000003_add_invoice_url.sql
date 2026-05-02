-- Add invoice_url column to deals for Square invoice links
alter table public.deals add column if not exists invoice_url text;
