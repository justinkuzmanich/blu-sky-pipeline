# Gmail Draft Setup — One-Time Guide

This sets up the Gmail API so the Edge Function can create invoice drafts in Justin's Gmail automatically.

---

## Step 1 — Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click the project dropdown at the top → **New Project**
3. Name it `blu-sky-pipeline` → **Create**
4. Make sure the new project is selected in the dropdown

---

## Step 2 — Enable the Gmail API

1. Go to **APIs & Services → Library**
2. Search for `Gmail API`
3. Click it → **Enable**

---

## Step 3 — Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → **Create**
3. Fill in:
   - App name: `Blu Sky Pipeline`
   - User support email: `justin@bluskyfilms.com`
   - Developer contact email: `justin@bluskyfilms.com`
4. Click **Save and Continue** through the remaining steps (no scopes needed here)
5. On the final screen, click **Back to Dashboard**
6. Click **Publish App** → **Confirm** (this allows your own account to authorize it)

---

## Step 4 — Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Desktop app**
4. Name: `blu-sky-pipeline`
5. Click **Create**
6. Copy and save:
   - **Client ID** → this is your `GMAIL_CLIENT_ID`
   - **Client Secret** → this is your `GMAIL_CLIENT_SECRET`

---

## Step 5 — Get Your Refresh Token

1. Go to https://developers.google.com/oauthplayground
2. Click the **gear icon** (Settings) in the top right
3. Check **Use your own OAuth credentials**
4. Enter your **Client ID** and **Client Secret** from Step 4
5. Close settings
6. In the left panel under **Step 1**, find and select:
   `https://mail.google.com/`
7. Click **Authorize APIs**
8. Sign in with `justin@bluskyfilms.com` and allow access
9. Click **Exchange authorization code for tokens**
10. Copy the **Refresh token** → this is your `GMAIL_REFRESH_TOKEN`

---

## Step 6 — Add Secrets to Supabase

Go to https://supabase.com/dashboard/project/xhuumecxmvwphtxanlai/settings/functions and add:

| Name | Value |
|---|---|
| `GMAIL_CLIENT_ID` | From Step 4 |
| `GMAIL_CLIENT_SECRET` | From Step 4 |
| `GMAIL_REFRESH_TOKEN` | From Step 5 |

---

## Step 7 — Redeploy the Function

Paste the updated `index.ts` into **Edge Functions → create-invoice → Edit → Deploy**.

That's it. The next time a deal moves to Invoiced, a Gmail draft will appear in Justin's drafts folder ready to review and send.
