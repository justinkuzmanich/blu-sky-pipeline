// Orchestrates one check: scrape -> normalize -> diff against last run ->
// write deals.json for the web app -> email alerts for newly-on-sale items.
//
// Usage:
//   node scraper/run.js            # real run (sends email if configured)
//   DRY_RUN=1 node scraper/run.js  # scrape + write, but only print emails

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRIMARY_STORE } from '../src/data/config.js'
import { scrapeStore } from './scrape.js'
import { toDeals } from './match.js'
import { notify } from './notify.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DEALS_OUT = join(ROOT, 'public', 'data', 'deals.json')
const STATE_FILE = join(__dirname, '.state.json')

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return fallback
  }
}

async function main() {
  const store = PRIMARY_STORE
  console.log(`🍦 Checking ${store.name} (loc=${store.locId || 'UNSET'})…`)

  const raw = await scrapeStore(store)
  const deals = toDeals(raw)
  console.log(`Found ${deals.length} tracked-brand products, ${deals.filter((d) => d.onSale).length} on sale.`)

  // Diff: which items are on sale now that were NOT on sale last time?
  const prevState = await readJson(STATE_FILE, { onSaleIds: [] })
  const prevOnSale = new Set(prevState.onSaleIds || [])
  const nowOnSale = deals.filter((d) => d.onSale)
  const newlyOnSale = nowOnSale.filter((d) => !prevOnSale.has(d.id))

  // Write deals.json for the web app.
  await mkdir(dirname(DEALS_OUT), { recursive: true })
  await writeFile(
    DEALS_OUT,
    JSON.stringify(
      {
        isSample: false,
        store: { id: store.id, name: store.name, address: store.address },
        checkedAt: new Date().toISOString(),
        deals,
      },
      null,
      2
    )
  )
  console.log(`✓ Wrote ${DEALS_OUT}`)

  // Alert on newly-on-sale items.
  if (newlyOnSale.length) {
    console.log(`🎉 ${newlyOnSale.length} newly on sale — sending alert.`)
    await notify(store, newlyOnSale)
  } else {
    console.log('No newly-on-sale items since last check.')
  }

  // Save state for next diff.
  await writeFile(
    STATE_FILE,
    JSON.stringify({ onSaleIds: nowOnSale.map((d) => d.id) }, null, 2)
  )
}

main().catch((err) => {
  console.error('✗ Scrape failed:', err.message)
  process.exit(1)
})
