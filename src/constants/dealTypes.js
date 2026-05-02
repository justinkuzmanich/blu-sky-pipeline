export const DEAL_TYPES = [
  { key: 'video',         label: 'Video',          icon: '🎬', color: '#B45309', bg: '#FEF3C7' },
  { key: 'listing-video', label: 'Listing Video',   icon: '🏠', color: '#9A3412', bg: '#FFEDD5' },
  { key: 'social-video',  label: 'Social Video',    icon: '📲', color: '#BE185D', bg: '#FCE7F3' },
  { key: 'website',       label: 'Website',         icon: '🌐', color: '#1D4ED8', bg: '#DBEAFE' },
  { key: 'social',      label: 'Social Media', icon: '📱', color: '#6D28D9', bg: '#EDE9FE' },
  { key: 'ads',         label: 'Paid Ads',     icon: '📢', color: '#B91C1C', bg: '#FEE2E2' },
  { key: 'photo',       label: 'Photography',  icon: '📷', color: '#065F46', bg: '#D1FAE5' },
  { key: 'consult',     label: 'Consulting',   icon: '💡', color: '#92400E', bg: '#FDE68A' },
  { key: 'techsupport', label: 'Tech Support', icon: '🔧', color: '#0E7490', bg: '#CFFAFE' },
  { key: 'other',       label: 'Other',        icon: '·',  color: '#57534E', bg: '#F5F5F4' },
]

const OTHER = DEAL_TYPES.find(t => t.key === 'other')

export const isCustomDealType = (v) => !!v && v !== 'other' && !DEAL_TYPES.find(t => t.key === v)

export const isOtherLikeActive = (v) => v === 'other' || isCustomDealType(v)

export function getDealType(key) {
  if (!key) return null
  return DEAL_TYPES.find(t => t.key === key) || { ...OTHER, label: key }
}
