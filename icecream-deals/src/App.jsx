import { useEffect, useState } from 'react'
import { BRANDS } from './data/config.js'
import {
  loadDeals,
  dealsForBrand,
  onSaleBrands,
  fmtDateTime,
} from './lib/deals.js'
import StatusBanner from './components/StatusBanner.jsx'
import BrandSection from './components/BrandSection.jsx'
import AlertSignup from './components/AlertSignup.jsx'

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDeals().then(setData).catch((e) => setError(e.message))
  }, [])

  const deals = data?.deals || []
  const saleBrands = onSaleBrands(deals)

  return (
    <div className="wrap">
      <header className="hero">
        <div className="logo">🍦</div>
        <h1>Scoop Alert</h1>
        <p className="tag">
          Tracking Häagen-Dazs &amp; Ben &amp; Jerry's deals at Safeway in Marin
        </p>
      </header>

      {error && (
        <div className="banner off">
          <span className="big">⚠️</span>
          <div>
            <h2>Couldn't load deals</h2>
            <div className="sub">{error}</div>
          </div>
        </div>
      )}

      {data && (
        <>
          <StatusBanner saleBrands={saleBrands} />

          <div className="meta">
            <span>📍 {data.store?.name || 'Mill Valley'}</span>
            <span>
              {data.isSample && <span className="pill-sample">SAMPLE DATA</span>}{' '}
              {data.checkedAt && <>Last checked {fmtDateTime(data.checkedAt)}</>}
            </span>
          </div>

          {BRANDS.map((brand) => (
            <BrandSection
              key={brand.id}
              brand={brand}
              deals={dealsForBrand(deals, brand.id)}
            />
          ))}

          <AlertSignup />
        </>
      )}

      {!data && !error && (
        <div className="empty" style={{ marginTop: 40 }}>
          Scooping up the latest deals… 🍨
        </div>
      )}

      <footer>
        Made with 🍨 for Marin · Prices from Safeway, not affiliated with Safeway
      </footer>
    </div>
  )
}
