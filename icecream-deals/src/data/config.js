// Shared configuration for both the web app and the scraper.
// Plain ESM with no dependencies so Node (scraper) and Vite (web) can both import it.

// ---------------------------------------------------------------------------
// STORES
// ---------------------------------------------------------------------------
// Safeway scopes prices per store using the `loc` query param on shop pages,
// e.g. https://www.safeway.com/shop/aisles/frozen-foods/ice-cream-novelties.html?loc=3132
//
// The `loc` id is the store's number (from local.safeway.com). The two Mill
// Valley stores below are pre-filled. If a store ever returns no products,
// re-confirm its id: set the store on safeway.com, open any aisle page, and
// read the `loc=...` value from the URL.
export const STORES = [
  {
    id: 'camino-alto',
    name: 'Safeway — Camino Alto (Mill Valley)',
    address: '1 Camino Alto, Mill Valley, CA 94941',
    locId: '788',
    primary: true,
  },
  {
    id: 'strawberry',
    name: 'Safeway — Strawberry Village (Mill Valley)',
    address: '800 Redwood Hwy Frontage Rd #110, Mill Valley, CA 94941',
    locId: '2718',
  },
]

export const PRIMARY_STORE = STORES.find((s) => s.primary) || STORES[0]

// ---------------------------------------------------------------------------
// BRANDS WE CARE ABOUT
// ---------------------------------------------------------------------------
// `match` strings are lowercased substrings tested against the product name.
export const BRANDS = [
  {
    id: 'haagen-dazs',
    name: 'Häagen-Dazs',
    emoji: '🍨',
    color: '#7b1d3a', // deep burgundy
    accent: '#f3d9c6',
    match: ['haagen-dazs', 'haagen dazs', 'häagen-dazs', 'häagen dazs'],
  },
  {
    id: 'ben-jerrys',
    name: "Ben & Jerry's",
    emoji: '🐄',
    color: '#1f6fb2', // sky blue
    accent: '#d7eccf',
    match: ['ben & jerry', "ben and jerry", 'ben&jerry'],
  },
]

// The aisle to scrape for each store.
export const ICE_CREAM_AISLE_PATH =
  '/shop/aisles/frozen-foods/ice-cream-novelties.html'

export const SAFEWAY_ORIGIN = 'https://www.safeway.com'
