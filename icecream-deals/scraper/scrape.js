import { SAFEWAY_ORIGIN, ICE_CREAM_AISLE_PATH } from '../src/data/config.js'

// Build the store-scoped ice cream aisle URL.
export function aisleUrl(locId) {
  return `${SAFEWAY_ORIGIN}${ICE_CREAM_AISLE_PATH}?loc=${encodeURIComponent(locId)}`
}

// JSON schema we ask the scraper to extract.
const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'string' },
          regularPrice: { type: 'string' },
          dealText: { type: 'string' },
        },
      },
    },
  },
}

const EXTRACT_PROMPT =
  'List every ice cream product shown on this page. For each, return the full ' +
  'product name, the current/sale price, the regular (struck-through) price if ' +
  'shown, and any member / Safeway-for-U / sale / coupon text shown on the card. ' +
  'Only include real products actually present on the page.'

// --- Adapter 1: Firecrawl (recommended; handles Safeway's bot blocking) ------
async function scrapeWithFirecrawl(url, apiKey) {
  const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: [
        { type: 'json', prompt: EXTRACT_PROMPT, schema: EXTRACT_SCHEMA },
      ],
      waitFor: 10000,
      proxy: 'auto',
    }),
  })
  if (!res.ok) {
    throw new Error(`Firecrawl HTTP ${res.status}: ${await res.text()}`)
  }
  const body = await res.json()
  const products = body?.data?.json?.products
  if (!Array.isArray(products)) {
    throw new Error('Firecrawl returned no products array')
  }
  return products
}

// --- Adapter 2: direct fetch (best-effort; Safeway usually returns 403) -------
async function scrapeDirect(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) {
    throw new Error(
      `Direct fetch HTTP ${res.status} (Safeway blocks bots — set FIRECRAWL_API_KEY)`
    )
  }
  // Safeway renders products client-side, so raw HTML rarely contains prices.
  // We return [] here rather than guessing; Firecrawl is the supported path.
  return []
}

// Public: scrape one store's ice cream aisle -> array of raw products.
export async function scrapeStore(store) {
  if (!store.locId) {
    throw new Error(
      `Store "${store.id}" has no locId set. See src/data/config.js for how to find it.`
    )
  }
  const url = aisleUrl(store.locId)
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (apiKey) return scrapeWithFirecrawl(url, apiKey)

  console.warn(
    '⚠️  No FIRECRAWL_API_KEY set — attempting a direct fetch that Safeway will likely block.'
  )
  return scrapeDirect(url)
}
