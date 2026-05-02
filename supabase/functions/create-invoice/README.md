# create-invoice Edge Function

Fires when a deal moves to the Invoiced stage (stage index 3). Creates a Square customer, order, and invoice, then saves the public payment link back to the deal and sends a Telegram notification.

## Deploy

### Option A — Supabase Dashboard
1. Go to **Edge Functions → New Function**
2. Name it `create-invoice`
3. Paste the contents of `index.ts`
4. Click **Deploy**

### Option B — CLI
```bash
supabase functions deploy create-invoice
```

## Secrets

Set these in **Dashboard → Settings → Edge Functions → Add secret**:

| Variable | Where to get it |
|---|---|
| `SQUARE_ACCESS_TOKEN` | Square Developer Dashboard → Applications → your app → Production Access Token |
| `SQUARE_LOCATION_ID` | Square Developer Dashboard → your app → Locations |

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` are already set from the previous function.

## Database Webhook

After deploying, wire the trigger in **Dashboard → Database → Webhooks → Create a new hook**:

| Field | Value |
|---|---|
| Name | `invoice-on-invoiced-stage` |
| Table | `public.deals` |
| Events | `UPDATE` |
| Type | `HTTP Request` |
| URL | `https://xhuumecxmvwphtxanlai.supabase.co/functions/v1/create-invoice` |
| HTTP method | `POST` |
| Headers | `Content-Type: application/json` |

The function ignores updates that aren't a transition to stage 3, so it's safe to fire on all deal updates.

## What it does

1. Checks the deal transitioned TO stage 3 (Invoiced) — skips all other updates
2. Finds or creates a Square customer by email
3. Creates a Square order: deal name as line item, deal value, 3.4% Tax
4. Creates + publishes a Square invoice (due 7 days out, delivery: Share Manually)
5. Saves `public_url` back to `deals.invoice_url`
6. Sends Telegram notification with the invoice link

## Notes

- If a deal already has an `invoice_url`, the function skips creation (idempotent on re-moves)
- Deal must have an email address — function returns 422 if missing
- Invoice delivery is set to `SHARE_MANUALLY` — Square does NOT email the customer automatically
- Line item name = deal's `name` field as shown on the card
