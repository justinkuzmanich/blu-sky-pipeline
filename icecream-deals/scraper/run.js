// Orchestrates one check across all configured stores:
//   scrape -> normalize -> diff against last run -> write deals.json for the
//   web app -> email alerts for newly-on-sale items.
//
// Usage:
//   node scraper/run.js            # real run (sends email if configured)
//   DRY_RUN=1 node scraper/run.js  # scrape + write, but only print emails

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STORES } from '../src/data/config.js'
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

async function checkStore(store, prevOnSaleByStore) {
  console.log(`\n🍦 Checking ${store.name} (loc=${store.locId || 'UNSET'})…`)
  const raw = await scrapeStore(store)
  const deals = toDeals(raw)
  const nowOnSale = deals.filter((d) => d.onSale)
  console.log(
    `   ${deals.length} tracked products, ${nowOnSale.length} on sale.`
  )

  const prev = new Set(prevOnSaleByStore[store.id] || [])
  const newlyOnSale = nowOnSale.filter((d) => !prev.has(d.id))

  return {
    storeOut: {
      id: store.id,
      name: store.name,
      address: store.address,
      deals,
    },
    onSaleIds: nowOnSale.map((d) => d.id),
    newlyOnSale,
    store,
  }
}

async function main() {
  const prevState = await readJson(STATE_FILE, { onSaleByStore: {} })
  const prevOnSaleByStore = prevState.onSaleByStore || {}

  const storesOut = []
  const nextOnSaleByStore = {}
  let failures = 0

  for (const store of STORES) {
    if (!store.locId) {
      console.warn(`   Skipping ${store.name}: no locId set.`)
      continue
    }
    try {
      const r = await checkStore(store, prevOnSaleByStore)
      storesOut.push(r.storeOut)
      nextOnSaleByStore[store.id] = r.onSaleIds
      if (r.newlyOnSale.length) {
        console.log(`   🎉 ${r.newlyOnSale.length} newly on sale — alerting.`)
        await notify(r.store, r.newlyOnSale)
      }
    } catch (err) {
      failures++
      console.error(`   ✗ ${store.name} failed: ${err.message}`)
    }
  }

  if (!storesOut.length) {
    throw new Error('No stores scraped successfully — nothing written.')
  }

  await mkdir(dirname(DEALS_OUT), { recursive: true })
  await writeFile(
    DEALS_OUT,
    JSON.stringify(
      { isSample: false, checkedAt: new Date().toISOString(), stores: storesOut },
      null,
      2
    )
  )
  console.log(`\n✓ Wrote ${DEALS_OUT} (${storesOut.length} store(s))`)

  await writeFile(
    STATE_FILE,
    JSON.stringify({ onSaleByStore: nextOnSaleByStore }, null, 2)
  )

  if (failures) console.warn(`⚠️  ${failures} store(s) failed to scrape.`)
}

main().catch((err) => {
  console.error('✗ Scrape failed:', err.message)
  process.exit(1)
})
