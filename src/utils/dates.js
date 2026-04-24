export const isOverdue = (iso) => iso && new Date(iso) < new Date()

export const isDueToday = (iso) => {
  if (!iso) return false
  const d = new Date(iso)
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end   = new Date(); end.setHours(23, 59, 59, 999)
  return d >= start && d <= end
}
