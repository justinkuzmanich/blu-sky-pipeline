# 🍦 Scoop Alert

Tracks when **Häagen-Dazs** and **Ben & Jerry's** ice cream go on sale at the
**Safeway in Mill Valley (Marin County)** — and emails you when they do.

- **Web app** (React + Vite): a fun, modern dashboard showing each brand's
  current prices and which are on sale.
- **Scraper** (Node): pulls Safeway's ice cream aisle for the Mill Valley store,
  detects sales, and emails an alert when something newly drops in price.

> ⚠️ Not affiliated with Safeway. Prices come from Safeway's public shop pages.

---

## Quick start (web app)

```bash
cd icecream-deals
npm install
npm run dev
```

Open the printed URL. The app ships with clearly-labeled **SAMPLE DATA** so you
can see the UI immediately. Running the scraper replaces it with real data.

---

## How the data works (important)

Safeway has **no public API**. The reliable data source is the store-scoped
shop aisle page:

```
https://www.safeway.com/shop/aisles/frozen-foods/ice-cream-novelties.html?loc=<storeId>
```

Two things to know:

1. **Safeway blocks plain bots** (returns HTTP 403). The scraper therefore
   defaults to **Firecrawl** (a scraping API with stealth proxies). Set
   `FIRECRAWL_API_KEY` in `.env`. Without it, the scraper attempts a direct
   fetch that will almost certainly be blocked.
2. **Stores are pre-configured.** Both Mill Valley Safeways are wired up in
   `src/data/config.js` with their `loc` ids:
   - **Camino Alto** (1 Camino Alto) — `loc=788`
   - **Strawberry Village** (800 Redwood Hwy Frontage Rd #110) — `loc=2718`

   If a store ever returns no products, re-confirm its id: set the store on
   safeway.com, open any aisle page, and read `loc=...` from the URL.

---

## Running the scraper

```bash
cp .env.example .env   # then fill in values
npm run scrape:dry     # scrape + write deals.json, print (don't send) emails
npm run scrape         # real run: sends email if a provider is configured
```

The scraper writes `public/data/deals.json` (what the web app reads) and tracks
state in `scraper/.state.json` so it only emails about *newly* on-sale items.

---

## Email alerts

Alerts are **pluggable** (`scraper/notify.js`). Out of the box:

- **No provider configured** → "console mode": the email is printed, not sent.
- **Resend** (recommended, easy free tier): set `RESEND_API_KEY`, `ALERT_FROM`,
  `ALERT_TO` in `.env`.

Adding another provider (SendGrid, SES, Gmail API, etc.) is a single function in
`notify.js`.

The web app's "Alert me" form currently just stores the address in the browser —
connect it to your mailing list/provider when you pick one.

---

## Automating the checks (later)

When you're ready to run checks automatically, a free option is a GitHub Actions
cron job that runs `npm run scrape` daily and commits the updated
`public/data/deals.json`. (Not set up yet — you chose "web app first".)

---

## Project layout

```
icecream-deals/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── public/data/deals.json        # data the web app reads (sample until scraped)
├── src/
│   ├── main.jsx / App.jsx / index.css
│   ├── data/config.js            # STORES + BRANDS (shared with scraper)
│   ├── lib/deals.js              # load + format helpers
│   └── components/               # StatusBanner, BrandSection, DealCard, AlertSignup
└── scraper/
    ├── scrape.js                 # Firecrawl + direct-fetch adapters
    ├── match.js                  # brand matching + sale detection
    ├── notify.js                 # pluggable email sender
    └── run.js                    # orchestrator (scrape → diff → write → alert)
```

---

## Note on this repo

This project currently lives in a subfolder of `blu-sky-pipeline` only because
of a tooling constraint (GitHub access was scoped to that repo). It is fully
self-contained — to move it to its own repo, copy the `icecream-deals/` folder
out, `git init`, and push.
