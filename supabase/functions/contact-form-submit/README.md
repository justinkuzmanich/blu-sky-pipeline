# contact-form-submit Edge Function

Accepts a POST from the Bluskyfilms contact form, inserts a new Prospect deal into the pipeline, and fires an SMS notification via Twilio.

## Deploy

### Option A — Supabase Dashboard

1. Go to **Edge Functions → New Function**
2. Name it `contact-form-submit`
3. Paste the contents of `index.ts`
4. Click **Deploy**

### Option B — Supabase CLI

```bash
supabase functions deploy contact-form-submit
```

## Environment Variables

Set these in **Dashboard → Edge Functions → contact-form-submit → Secrets** (or via CLI with `supabase secrets set KEY=value`):

| Variable | Where to get it |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info |
| `TWILIO_FROM_NUMBER` | Twilio Console → Phone Numbers (E.164 format, e.g. `+18005551234`) |
| `TWILIO_TO_NUMBER` | Justin's cell in E.164 format: `+14152257151` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do not set them manually.

## Request Format

```
POST https://<project>.supabase.co/functions/v1/contact-form-submit
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "(415) 555-0000",
  "service_label": "Listing Video — $999",
  "service_value": "listing-video",
  "shootDate": "2026-06-15",
  "address": "123 Main St, Mill Valley, CA",
  "message": "Looking for a quick turnaround"
}
```

**Required:** `name`, `email`, `phone`, `service_value`

**`service_value` must be one of:** `listing-video` · `social-retainer` · `paid-ads` · `bundle`

## Service → Pipeline Mapping

| service_value | deal_type | value |
|---|---|---|
| `listing-video` | `listing-video` | 999 |
| `social-retainer` | `social-video` | 2250 |
| `paid-ads` | `ads` | 0 |
| `bundle` | `ads` | 0 |

## Response

```json
{ "ok": true }
```

On validation error: `400` with `{ "ok": false, "error": "..." }`  
On insert failure: `500` with `{ "ok": false, "error": "Failed to save inquiry" }`  
SMS failures are logged but do **not** affect the response — deal is always saved first.
