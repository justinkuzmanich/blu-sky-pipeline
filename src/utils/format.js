export const fmt$ = (val) => {
  const n = parseFloat(val)
  if (!n || isNaN(n)) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso), now = new Date()
  const diff = Math.ceil((d - now) / 86400000)
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  if (diff === 0) return `Today ${time}`
  if (diff === 1) return `Tomorrow ${time}`
  if (diff < 0)  return `${Math.abs(diff)}d overdue`
  if (diff < 7)  return `${date} ${time}`
  return date
}

export const noteFmt = (ts) =>
  new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }) +
  ' · ' +
  new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export const uid = () => Math.random().toString(36).slice(2, 10)
