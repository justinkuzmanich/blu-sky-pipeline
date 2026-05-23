import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDeals } from '../hooks/useDeals'
import { DEAL_TYPES, getDealType, isOtherLikeActive } from '../constants/dealTypes'
import { STEP_TYPES } from '../constants/stepTypes'
import { STAGE_COLORS, STAGE_BG } from '../constants/stageColors'
import { fmt$, fmtDate, noteFmt } from '../utils/format'
import { isOverdue, isDueToday } from '../utils/dates'
import ThemeToggle from '../components/ui/ThemeToggle'

const Label = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>{children}</div>
)

const FieldInput = ({ type, value, onChange, placeholder, mono, onKeyDown, inputRef }) => (
  <input ref={inputRef} type={type || 'text'} value={value ?? ''} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
    style={{ width: '100%', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 11px', color: 'var(--text-1)', fontSize: 13, fontFamily: mono ? "'DM Mono',monospace" : 'inherit', boxShadow: 'var(--shadow-sm)' }} />
)

function TodayCard({ d, stages, onOpen, onClear, overdue, noStep }) {
  const ns = d.next_step
  const st = STEP_TYPES.find(t => t.key === ns?.type)
  const dt = getDealType(d.deal_type)
  const stageName = stages[d.stage] || ''
  const stageColor = STAGE_COLORS[d.stage] || STAGE_COLORS[0]
  const stageBg    = STAGE_BG[d.stage]     || STAGE_BG[0]
  return (
    <div style={{ background:'var(--white)', border:`1px solid ${overdue ? '#FECACA' : 'var(--border-light)'}`, borderRadius:10, padding:'13px 16px', marginBottom:8, display:'flex', alignItems:'center', gap:14, boxShadow:'var(--shadow-sm)' }}>
      <div style={{ width:36, height:36, borderRadius:8, background: overdue ? '#FEE2E2' : noStep ? 'var(--cream-dark)' : '#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>
        {noStep ? '·' : st?.icon || '📋'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
          <span style={{ fontWeight:600, fontSize:14, color:'var(--text-1)' }}>{d.name}</span>
          {d.business && <span style={{ fontSize:12, color:'var(--text-3)' }}>{d.business}</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, background:stageBg, color:stageColor, border:`1px solid ${stageColor}33`, borderRadius:20, padding:'1px 7px', fontWeight:600 }}>{stageName}</span>
          {dt && <span style={{ fontSize:12, background:dt.bg, color:dt.color, borderRadius:4, padding:'1px 6px', fontWeight:600 }}>{dt.icon} {dt.label}</span>}
          {d.value > 0 && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:stageColor, fontWeight:600 }}>{fmt$(d.value)}</span>}
          {ns && <span style={{ fontSize:11, color: overdue ? '#B91C1C' : 'var(--text-3)' }}>{overdue ? '⚠ ' : '🕐 '}{fmtDate(ns.reminderAt)}</span>}
          {ns?.note && <span style={{ fontSize:11, color:'var(--text-3)', fontStyle:'italic' }}>"{ns.note}"</span>}
        </div>
      </div>
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={()=>onOpen(d.id,'nextstep')}
          style={{ padding:'5px 11px', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:6, fontSize:12, color:'var(--text-2)', fontWeight:500, cursor:'pointer' }}>
          {noStep ? '+ Add Step' : 'Edit'}
        </button>
        {!noStep && <button onClick={onClear}
          style={{ padding:'5px 11px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:6, fontSize:12, color:'#15803D', fontWeight:600, cursor:'pointer' }}>
          ✓ Done
        </button>}
      </div>
    </div>
  )
}

function ClosedDealRow({ d, stages, onReactivate, type }) {
  const dt = getDealType(d.deal_type)
  const stageName  = stages[d.stage] || ''
  const stageColor = STAGE_COLORS[d.stage] || STAGE_COLORS[0]
  const stageBg    = STAGE_BG[d.stage]     || STAGE_BG[0]
  return (
    <div style={{ background:'var(--white)', border:`1px solid ${type==='won' ? '#BBF7D0' : '#FECACA'}`, borderRadius:10, padding:'13px 16px', marginBottom:8, display:'flex', alignItems:'center', gap:14, boxShadow:'var(--shadow-sm)' }}>
      <div style={{ width:36, height:36, borderRadius:8, background: type==='won' ? '#DCFCE7' : '#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0, color: type==='won' ? '#15803D' : '#B91C1C', fontWeight:700 }}>
        {type === 'won' ? '✓' : '✗'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
          <span style={{ fontWeight:600, fontSize:14, color:'var(--text-1)' }}>{d.name}</span>
          {d.business && <span style={{ fontSize:12, color:'var(--text-3)' }}>{d.business}</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, background:stageBg, color:stageColor, border:`1px solid ${stageColor}33`, borderRadius:20, padding:'1px 7px', fontWeight:600 }}>{stageName}</span>
          {dt && <span style={{ fontSize:12, background:dt.bg, color:dt.color, borderRadius:4, padding:'1px 6px', fontWeight:600 }}>{dt.icon} {dt.label}</span>}
          {d.value > 0 && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color: type==='won' ? '#2D8A5E' : '#B91C1C', fontWeight:600 }}>{fmt$(d.value)}</span>}
        </div>
      </div>
      <button onClick={onReactivate}
        style={{ padding:'5px 12px', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:6, fontSize:12, color:'var(--text-2)', fontWeight:500, cursor:'pointer', flexShrink:0 }}>
        Reactivate
      </button>
    </div>
  )
}

export default function PipelinePage() {
  const { user, profile, signOut } = useAuth()
  const { deals, stages, loaded, addDeal, updateDeal, deleteDeal, moveDeal, addNote, deleteNote, saveStages } = useDeals(user?.id)

  const upd = updateDeal

  const [showForm, setShowForm]         = useState(false)
  const [editingStage, setEditingStage] = useState(null)
  const [stageInput, setStageInput]     = useState('')
  const [panelId, setPanelId]           = useState(null)
  const [activeTab, setActiveTab]       = useState('notes')
  const [form, setForm]                 = useState({ name:'', business:'', phone:'', email:'', value:'' })
  const [formStage, setFormStage]       = useState(0)
  const [formType, setFormType]         = useState('')
  const [newNote, setNewNote]           = useState('')
  const [nsDraft, setNsDraft]           = useState(null)
  const [dragId, setDragId]             = useState(null)
  const [dragOver, setDragOver]         = useState(null)
  const [view, setView]                 = useState('board')
  const [formError, setFormError]       = useState('')
  const [stagesOpen, setStagesOpen]     = useState(true)
  const [statusMenuId, setStatusMenuId] = useState(null)
  const [modalClosing, setModalClosing]  = useState(false)

  const scrollToStage = (si) => {
    setView('board')
    setTimeout(() => {
      document.getElementById(`stage-col-${si}`)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
    }, 60)
  }

  const nameRef = useRef(null)
  const noteRef = useRef(null)
  const boardRef      = useRef(null)
  const closingTimer  = useRef(null)

  useEffect(() => { if (showForm) setTimeout(() => nameRef.current?.focus(), 50) }, [showForm])

  useEffect(() => {
    if (view !== 'board') return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const onWheel = (e) => {
      const board = boardRef.current
      if (!board || !board.contains(e.target)) return
      if (e.deltaX !== 0) return
      if (e.deltaY === 0) return
      e.preventDefault()
      board.scrollLeft += e.deltaY
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [view])

  useEffect(() => {
    if (!statusMenuId) return
    const close = () => setStatusMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [statusMenuId])

  useEffect(() => {
    if (panelId && window.innerWidth <= 640) setStagesOpen(false)
  }, [panelId])

  const deal = deals.find(d => d.id === panelId) || null
  const stageColor = deal ? (STAGE_COLORS[deal.stage] || STAGE_COLORS[0]) : STAGE_COLORS[0]

  const closeDeal = (id, status) => {
    upd(id, { status })
    setStatusMenuId(null)
    if (panelId === id) closeModal()
  }

  // ── Computed sets ──────────────────────────────────────────────
  const activeDeals = deals.filter(d => !d.status || d.status === 'active')
  const wonDeals    = deals.filter(d => d.status === 'won')
  const lostDeals   = deals.filter(d => d.status === 'lost')

  const stageTotal   = (i) => activeDeals.filter(d => d.stage === i).reduce((s, d) => s + Number(d.value || 0), 0)
  const grandTotal   = activeDeals.reduce((s, d) => s + Number(d.value || 0), 0)
  const activeTotal  = activeDeals.filter(d => d.stage < stages.length - 1).reduce((s, d) => s + Number(d.value || 0), 0)
  const wonTotal     = wonDeals.reduce((s, d) => s + Number(d.value || 0), 0)
  const lostTotal    = lostDeals.reduce((s, d) => s + Number(d.value || 0), 0)
  const overdueCount = activeDeals.filter(d => d.next_step && isOverdue(d.next_step.reminderAt)).length
  const totalClosed  = wonDeals.length + lostDeals.length
  const winRate      = totalClosed > 0 ? Math.round(wonDeals.length / totalClosed * 100) : 0

  const overdueDeals = activeDeals.filter(d => d.next_step?.reminderAt && isOverdue(d.next_step.reminderAt))
  const todayDeals   = activeDeals.filter(d => d.next_step?.reminderAt && isDueToday(d.next_step.reminderAt))
  const noStepDeals  = activeDeals.filter(d => !d.next_step && d.stage < stages.length - 1)

  const handleAddDeal = async () => {
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setFormError('')
    const { error } = await addDeal({
      stage: formStage,
      deal_type: formType,
      name: form.name.trim(),
      business: form.business.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      value: parseFloat(form.value) || 0,
    })
    if (error) {
      console.error('addDeal failed:', error)
      setFormError(error.message || 'Failed to save. Check console.')
      return
    }
    setForm({ name:'', business:'', phone:'', email:'', value:'' })
    setFormType('')
    setShowForm(false)
  }

  const handleAddNote = () => {
    if (!newNote.trim() || !deal) return
    addNote(deal.id, newNote.trim(), stages[deal.stage])
    setNewNote('')
    setTimeout(() => noteRef.current?.focus(), 50)
  }

  const saveNs   = () => { if (!deal || !nsDraft?.type) return; upd(deal.id, { next_step: nsDraft }); setNsDraft(null) }
  const clearNs  = () => { upd(deal.id, { next_step: null }); setNsDraft(null) }
  const closeModal = () => {
    if (closingTimer.current) clearTimeout(closingTimer.current)
    setModalClosing(true)
    closingTimer.current = setTimeout(() => {
      setPanelId(null)
      setModalClosing(false)
      closingTimer.current = null
    }, 180)
  }

  const openPanel = (id, tab) => {
    if (closingTimer.current) { clearTimeout(closingTimer.current); closingTimer.current = null; setModalClosing(false) }
    setPanelId(id); setActiveTab(tab || 'notes'); setNsDraft(null); setNewNote('')
  }
  const startEditStage = (i) => { setEditingStage(i); setStageInput(stages[i]) }
  const saveStage = () => {
    if (editingStage === null) return
    const next = stages.map((x, i) => i === editingStage ? (stageInput || x) : x)
    saveStages(next)
    setEditingStage(null)
  }

  if (!loaded) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'DM Sans,sans-serif', color:'var(--text-3)', fontSize:13 }}>
      Loading pipeline…
    </div>
  )

  return (
    <div style={{ height:'100vh', background:'var(--cream)', color:'var(--text-1)', fontFamily:"'DM Sans',sans-serif", display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* ── TOP BAR ── */}
      <div className="topbar" style={{ background:'var(--white)', borderBottom:'1px solid var(--topbar-border)', padding:'0 24px 0 12px', display:'flex', alignItems:'center', justifyContent:'flex-start', height:52, flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <span className="topbar-title" style={{ fontFamily:"'Libre Baskerville',serif", fontWeight:700, fontSize:17, color:'var(--text-1)', letterSpacing:'-0.3px', marginRight:20, paddingLeft:10, marginLeft:-15 }}>
          <span className="topbar-title-line">Blu Sky</span><span className="topbar-title-line"> Pipeline</span>
        </span>
        <button className="topbar-addbtn" onClick={() => { setShowForm(true); setFormStage(0) }}
          style={{ background:'#C96A1F', color:'#FFFFFF', border:'none', borderRadius:7, padding:'6px 14px', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:5, cursor:'pointer', letterSpacing:'0.1px', marginRight:24, boxShadow:'0 1px 4px rgba(201,106,31,0.35)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span className="topbar-addbtn-label">Add Deal</span>
        </button>
        <nav className="topbar-nav" style={{ display:'flex', alignItems:'center', gap:20 }}>
          {[['board','Pipeline'],['today','Today'],['closed','Closed']].map(([v, label]) => (
            <button key={v} className="topbar-nav-btn" onClick={()=>setView(v)}
              style={{ background:'none', border:'none', borderBottom:`2px solid ${view===v ? 'var(--text-1)' : 'transparent'}`, color:'var(--text-1)', fontSize:13, fontWeight: view===v ? 600 : 400, cursor:'pointer', padding:'4px 0', letterSpacing:'0.1px', transition:'border-color 0.15s' }}>
              {label}
              {v === 'closed' && totalClosed > 0 && (
                <span style={{ marginLeft:5, fontSize:10, background:'var(--cream-dark)', color:'var(--text-3)', borderRadius:20, padding:'1px 6px', fontWeight:600 }}>{totalClosed}</span>
              )}
            </button>
          ))}
        </nav>
        {overdueCount > 0 && (
          <span className="topbar-overdue" style={{ fontSize:11, color:'#B91C1C', fontWeight:600, background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:20, padding:'2px 9px', marginLeft:16 }}>⚠ {overdueCount} overdue</span>
        )}

        {/* Right side: account */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
          <span className="topbar-user-name" style={{ fontSize:12, color:'var(--text-3)' }}>{profile?.display_name || user?.email}</span>
          <ThemeToggle />
          <Link to="/account" title="Account settings"
            style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:'50%', background:'var(--cream)', border:'1px solid var(--border)', color:'var(--text-2)', textDecoration:'none', fontSize:13, fontWeight:600, flexShrink:0 }}>
            {(profile?.display_name || user?.email || '?').charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>

      {/* ── SUMMARY BAR ── */}
      <div className="summary-bar" style={{ background:'var(--white)', borderBottom:'1px solid var(--border-light)', padding:'14px 24px', display:'flex', alignItems:'center', gap:0, flexShrink:0 }}>
        <div className="summary-total" style={{ paddingRight:14, flexShrink:0 }}>
          <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, marginBottom:3 }}>Total Pipeline</div>
          <div className="summary-total-val" style={{ fontFamily:"'Libre Baskerville',serif", fontSize:24, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.5px', lineHeight:1 }}>{fmt$(grandTotal)}</div>
          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>{activeDeals.length} deal{activeDeals.length !== 1 ? 's' : ''}</div>
        </div>

        <div className="summary-divider" style={{ width:1, background:'var(--border-light)', alignSelf:'stretch', marginRight:14 }} />

        <div className="summary-stages" style={{ flex:1, minWidth:0 }}>
          <button onClick={() => setStagesOpen(o => !o)}
            style={{ background:'none', border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, padding:0, marginBottom: stagesOpen ? 8 : 0 }}>
            <span style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 }}>By Stage</span>
            <span style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, lineHeight:1 }}>{stagesOpen ? '▾' : '▸'}</span>
          </button>

          {stagesOpen && <>
          {/* Desktop: horizontal progress bar with inline labels */}
          <div className="summary-stages-desktop">
            <div style={{ display:'flex', height:4, borderRadius:4, overflow:'hidden', background:'var(--cream-dark)', marginBottom:10 }}>
              {stages.map((_, si) => {
                const pct = grandTotal > 0 ? (stageTotal(si) / grandTotal) * 100 : 0
                return pct > 0 ? <div key={si} style={{ width:pct+'%', background:STAGE_COLORS[si], transition:'width 0.4s ease' }} /> : null
              })}
            </div>
            <div style={{ position:'relative', height:22 }}>
              {(() => {
                let cumPct = 0
                return stages.map((s, si) => {
                  const pct = grandTotal > 0 ? (stageTotal(si) / grandTotal) * 100 : 0
                  const count = activeDeals.filter(d => d.stage === si).length
                  const left = cumPct
                  cumPct += pct
                  if (!count || pct === 0) return null
                  return (
                    <div key={si} onClick={() => scrollToStage(si)}
                      style={{ position:'absolute', left:left+'%', top:0, display:'flex', alignItems:'center', gap:5, transform: left > 72 && si < stages.length - 1 ? 'translateX(-100%)' : 'none', whiteSpace:'nowrap', cursor:'pointer' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:STAGE_COLORS[si], flexShrink:0 }} />
                      <span style={{ fontSize:11, color:'var(--text-2)' }}>{s}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color: si===stages.length-1 ? '#2D8A5E' : 'var(--text-1)', fontWeight:500 }}>{fmt$(stageTotal(si))}</span>
                      <span style={{ fontSize:10, color:'var(--text-4)' }}>({count})</span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          {/* Mobile: stacked list per stage with a proportional bar */}
          <div className="summary-stages-mobile">
            {stages.map((s, si) => {
              const count = activeDeals.filter(d => d.stage === si).length
              if (!count) return null
              const pct = grandTotal > 0 ? (stageTotal(si) / grandTotal) * 100 : 0
              const isLast = si === stages.length - 1
              return (
                <div key={si} onClick={() => scrollToStage(si)} style={{ marginBottom: 10, cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:STAGE_COLORS[si], flexShrink:0 }} />
                    <span style={{ fontSize:13, color:'var(--text-2)' }}>{s}</span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color: isLast ? '#2D8A5E' : 'var(--text-1)', fontWeight:600 }}>{fmt$(stageTotal(si))}</span>
                    <span style={{ fontSize:11, color:'var(--text-4)' }}>({count})</span>
                  </div>
                  <div style={{ width: pct + '%', height:3, background: STAGE_COLORS[si], borderRadius:2, marginTop:5, transition:'width 0.4s ease' }} />
                </div>
              )
            })}
          </div>
          </>}
        </div>

        <div className="summary-divider" style={{ width:1, background:'var(--border-light)', alignSelf:'stretch', margin:'0 28px' }} />

        <div className="summary-kpis" style={{ display:'flex', gap:28, flexShrink:0 }}>
          {[['Active', fmt$(activeTotal), 'var(--text-1)'], ['Won', fmt$(wonTotal), '#2D8A5E'], ['Win Rate', winRate+'%', winRate > 0 ? '#2D8A5E' : 'var(--text-3)']].map(([label, val, col]) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div className="summary-kpi-label" style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, marginBottom:5 }}>{label}</div>
              <div className="summary-kpi-val" style={{ fontFamily:"'DM Mono',monospace", fontSize:14, color:col, fontWeight:500 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {view === 'today' && (
          <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', background:'var(--cream)' }}>
            <div style={{ maxWidth:680, margin:'0 auto' }}>

              {overdueDeals.length > 0 && (
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#B91C1C', fontFamily:"'Libre Baskerville',serif" }}>⚠ Overdue</span>
                    <span style={{ fontSize:11, background:'#FEE2E2', color:'#B91C1C', border:'1px solid #FECACA', borderRadius:20, padding:'1px 8px', fontWeight:600 }}>{overdueDeals.length}</span>
                  </div>
                  {overdueDeals.map(d => <TodayCard key={d.id} d={d} stages={stages} onOpen={openPanel} onClear={()=>upd(d.id,{ next_step: null })} overdue />)}
                </div>
              )}

              {todayDeals.length > 0 && (
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#92400E', fontFamily:"'Libre Baskerville',serif" }}>☀️ Due Today</span>
                    <span style={{ fontSize:11, background:'#FEF3C7', color:'#92400E', border:'1px solid #FDE68A', borderRadius:20, padding:'1px 8px', fontWeight:600 }}>{todayDeals.length}</span>
                  </div>
                  {todayDeals.map(d => <TodayCard key={d.id} d={d} stages={stages} onOpen={openPanel} onClear={()=>upd(d.id,{ next_step: null })} />)}
                </div>
              )}

              {noStepDeals.length > 0 && (
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text-2)', fontFamily:"'Libre Baskerville',serif" }}>· No Next Step</span>
                    <span style={{ fontSize:11, background:'var(--cream-dark)', color:'var(--text-3)', border:'1px solid var(--border-light)', borderRadius:20, padding:'1px 8px', fontWeight:600 }}>{noStepDeals.length}</span>
                  </div>
                  {noStepDeals.map(d => <TodayCard key={d.id} d={d} stages={stages} onOpen={openPanel} noStep />)}
                </div>
              )}

              {overdueDeals.length === 0 && todayDeals.length === 0 && noStepDeals.length === 0 && (
                <div style={{ textAlign:'center', paddingTop:60 }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
                  <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:17, color:'var(--text-1)', fontWeight:700, marginBottom:6 }}>All clear</div>
                  <div style={{ fontSize:13, color:'var(--text-3)' }}>No overdue or pending next steps today.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'board' && (
        <div ref={boardRef} className="board" style={{ flex:1, minWidth:0, display:'flex', overflowX:'auto', overflowY:'hidden', padding:'18px 14px', scrollPadding:'0 14px', alignItems:'flex-start', background:'var(--board-bg)' }}>
          {stages.map((stage, si) => {
            const dot   = STAGE_COLORS[si] || STAGE_COLORS[0]
            const sbg   = STAGE_BG[si]     || STAGE_BG[0]
            const stDeals = activeDeals.filter(d => d.stage === si)
            const isLast  = si === stages.length - 1
            return (
              <div key={si}
                id={`stage-col-${si}`}
                className={`drop-zone stage-col${dragOver === si ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(si) }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
                onDrop={e => { e.preventDefault(); if (dragId) upd(dragId, { stage: si }); setDragId(null); setDragOver(null) }}
                style={{ flex:'0 0 330px', margin:'0 6px', background:'var(--col-bg)', borderRadius:12, border:'1px solid var(--col-border)', display:'flex', flexDirection:'column', maxHeight:'100%', minHeight:260, boxShadow:'0 2px 8px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.08)' }}>
                <div style={{ padding:'11px 13px 9px', borderBottom:'1px solid var(--col-divider)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                    {editingStage === si ? (
                      <input autoFocus value={stageInput} onChange={e=>setStageInput(e.target.value)} onBlur={saveStage} onKeyDown={e=>e.key==='Enter'&&saveStage()}
                        style={{ background:'transparent', border:'none', color:'var(--text-1)', fontSize:15, fontWeight:700, fontFamily:"'Libre Baskerville',serif", width:'100%' }} />
                    ) : (
                      <div onClick={()=>startEditStage(si)} title="Click to rename"
                        style={{ fontFamily:"'Libre Baskerville',serif", fontWeight:700, fontSize:15, color:'var(--text-1)', cursor:'text', flex:1, userSelect:'none' }}>{stage}</div>
                    )}
                    <span style={{ background:sbg, color:dot, border:`1px solid ${dot}33`, borderRadius:20, padding:'1px 8px', fontSize:12, fontWeight:700, flexShrink:0 }}>{stDeals.length}</span>
                  </div>
                  <div style={{ fontSize:16, fontFamily:"'Libre Baskerville',serif", color:'var(--text-1)', marginTop:4, fontWeight:700, letterSpacing:'-0.2px', visibility: stDeals.length > 0 ? 'visible' : 'hidden' }}>{fmt$(stageTotal(si))}</div>
                </div>

                <div className="stage-cards" style={{ flex:1, overflowY:'auto', padding:'8px 8px 0', background:'var(--col-body-bg)' }}>
                  {stDeals.length === 0 && (
                    <div style={{ textAlign:'center', color:'var(--text-4)', fontSize:11, marginTop:24, fontStyle:'italic' }}>No deals yet</div>
                  )}
                  {stDeals.map(d => {
                    const ns = d.next_step
                    const od = ns?.reminderAt && isOverdue(ns.reminderAt)
                    const st = STEP_TYPES.find(t => t.key === ns?.type)
                    const dt = getDealType(d.deal_type)
                    const menuOpen = statusMenuId === d.id
                    return (
                      <div key={d.id} className="deal-card"
                        draggable="true"
                        onDragStart={e => { setDragId(d.id); e.dataTransfer.effectAllowed = 'move' }}
                        onDragEnd={() => { setDragId(null); setDragOver(null) }}
                        onClick={()=>openPanel(d.id)}
                        style={{ background:'var(--card-bg)', border:`1px solid ${panelId===d.id ? dot : 'var(--card-border)'}`, borderRadius:9, padding:'11px 12px', marginBottom:6, cursor:'grab', opacity: dragId===d.id ? 0.45 : 1, transition:'opacity 0.15s', position:'relative' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', gap:6, alignItems:'flex-start' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:600, fontSize:15.5, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.name}</div>
                            {d.business && <div style={{ fontSize:14, color:'var(--text-3)', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.business}</div>}
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                            {d.value > 0 && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:dot, fontWeight:600 }}>{fmt$(d.value)}</div>}
                            {dt && <span style={{ fontSize:11, background:dt.bg, color:dt.color, borderRadius:4, padding:'1px 5px', fontWeight:600 }}>{dt.icon} {dt.label}</span>}
                          </div>
                        </div>

                        {ns && (
                          <div style={{ marginTop:8 }}>
                            <span style={{ fontSize:10, background: od?'#FEE2E2':'var(--cream)', border:`1px solid ${od?'#FECACA':'var(--border)'}`, borderRadius:4, padding:'2px 7px', color: od?'#B91C1C':'var(--text-2)', display:'inline-flex', alignItems:'center', gap:4 }}>
                              {st?.icon} {st?.label}
                              {ns.reminderAt && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color: od?'#B91C1C':'var(--text-3)' }}>· {fmtDate(ns.reminderAt)}</span>}
                            </span>
                          </div>
                        )}

                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                          <div>
                            {(d.notes||[]).length > 0 && (
                              <span style={{ fontSize:11, color:'var(--text-3)', background:'var(--cream)', borderRadius:4, padding:'1px 6px', border:'1px solid var(--border-light)' }}>📝 {d.notes.length}</span>
                            )}
                          </div>
                          <div style={{ display:'flex', gap:1, alignItems:'center' }} onClick={e=>e.stopPropagation()}>
                            {menuOpen ? (
                              <>
                                <button onClick={()=>closeDeal(d.id,'won')}
                                  style={{ background:'#DCFCE7', border:'1px solid #BBF7D0', color:'#15803D', fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:4, cursor:'pointer' }}>
                                  ✓ Won
                                </button>
                                <button onClick={()=>closeDeal(d.id,'lost')}
                                  style={{ background:'#FEE2E2', border:'1px solid #FECACA', color:'#B91C1C', fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:4, cursor:'pointer', marginLeft:3 }}>
                                  ✗ Lost
                                </button>
                                <button onClick={e=>{ e.stopPropagation(); setStatusMenuId(null) }}
                                  style={{ background:'none', border:'none', color:'var(--text-4)', fontSize:14, padding:'1px 4px', cursor:'pointer', marginLeft:2 }}>×</button>
                              </>
                            ) : (
                              <button className="move-btn" onClick={e=>{ e.stopPropagation(); setStatusMenuId(d.id) }}
                                style={{ background:'none', border:'none', color:'var(--text-3)', fontSize:14, fontWeight:700, padding:'1px 5px', borderRadius:4, cursor:'pointer', letterSpacing:'1px' }}>···</button>
                            )}
                            {si > 0 && <button className="move-btn" onClick={()=>moveDeal(d.id,-1)} style={{ background:'none', border:'none', color:'var(--text-3)', fontSize:14, padding:'1px 5px', borderRadius:4, cursor:'pointer' }}>←</button>}
                            {si < stages.length-1 && <button className="move-btn" onClick={()=>moveDeal(d.id,1)} style={{ background:'none', border:'none', color:dot, fontSize:14, fontWeight:700, padding:'1px 5px', borderRadius:4, cursor:'pointer' }}>→</button>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ padding:'6px 8px 9px', flexShrink:0, background:'var(--col-body-bg)', borderRadius:'0 0 12px 12px' }}>
                  <button className="add-here" onClick={()=>{ setFormStage(si); setShowForm(true) }}
                    style={{ width:'100%', background:'transparent', border:'1px dashed var(--add-here-border)', borderRadius:7, color:'var(--add-here-text)', padding:'6px', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add deal
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        )}

        {view === 'closed' && (
          <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', background:'var(--cream)' }}>
            <div style={{ maxWidth:760, margin:'0 auto' }}>

              {/* Metrics */}
              <div style={{ display:'flex', gap:14, marginBottom:32 }}>
                <div style={{ flex:1, background:'var(--white)', border:'1px solid var(--border-light)', borderRadius:12, padding:'18px 20px', boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, marginBottom:4 }}>Won</div>
                  <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, fontWeight:700, color:'#2D8A5E', letterSpacing:'-0.3px' }}>{fmt$(wonTotal)}</div>
                  <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>{wonDeals.length} deal{wonDeals.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ flex:1, background:'var(--white)', border:'1px solid var(--border-light)', borderRadius:12, padding:'18px 20px', boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, marginBottom:4 }}>Lost</div>
                  <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, fontWeight:700, color:'#B91C1C', letterSpacing:'-0.3px' }}>{fmt$(lostTotal)}</div>
                  <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>{lostDeals.length} deal{lostDeals.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ flex:1, background:'var(--white)', border:'1px solid var(--border-light)', borderRadius:12, padding:'18px 20px', boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, marginBottom:4 }}>Win Rate</div>
                  <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, fontWeight:700, color: winRate > 50 ? '#2D8A5E' : winRate > 0 ? '#92400E' : 'var(--text-3)', letterSpacing:'-0.3px' }}>{winRate}%</div>
                  <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>{totalClosed} closed total</div>
                </div>
              </div>

              {/* Won deals */}
              {wonDeals.length > 0 && (
                <div style={{ marginBottom:32 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#2D8A5E', fontFamily:"'Libre Baskerville',serif" }}>✓ Won</span>
                    <span style={{ fontSize:11, background:'#DCFCE7', color:'#15803D', border:'1px solid #BBF7D0', borderRadius:20, padding:'1px 8px', fontWeight:600 }}>{wonDeals.length}</span>
                  </div>
                  {wonDeals.map(d => (
                    <ClosedDealRow key={d.id} d={d} stages={stages} type="won"
                      onReactivate={()=>upd(d.id, { status:'active' })} />
                  ))}
                </div>
              )}

              {/* Lost deals */}
              {lostDeals.length > 0 && (
                <div style={{ marginBottom:32 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#B91C1C', fontFamily:"'Libre Baskerville',serif" }}>✗ Lost</span>
                    <span style={{ fontSize:11, background:'#FEE2E2', color:'#B91C1C', border:'1px solid #FECACA', borderRadius:20, padding:'1px 8px', fontWeight:600 }}>{lostDeals.length}</span>
                  </div>
                  {lostDeals.map(d => (
                    <ClosedDealRow key={d.id} d={d} stages={stages} type="lost"
                      onReactivate={()=>upd(d.id, { status:'active' })} />
                  ))}
                </div>
              )}

              {totalClosed === 0 && (
                <div style={{ textAlign:'center', paddingTop:60 }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>📁</div>
                  <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:17, color:'var(--text-1)', fontWeight:700, marginBottom:6 }}>No closed deals yet</div>
                  <div style={{ fontSize:13, color:'var(--text-3)' }}>Mark deals as Won or Lost from the Pipeline board.</div>
                </div>
              )}
            </div>
          </div>
        )}


      {/* ── DEAL MODAL ── */}
      {deal && (
        <div className={`deal-modal-overlay${modalClosing ? ' exiting' : ''}`} style={{ position:'absolute', inset:0, background:'rgba(28,25,23,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, backdropFilter:'blur(4px)' }} onClick={closeModal}>
          <div className="deal-modal-box" style={{ width:'100%', maxWidth:560, maxHeight:'90vh', background:'var(--white)', borderRadius:16, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'var(--shadow-lg)', margin:'0 24px' }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:'16px 18px 12px', borderBottom:'1px solid var(--border-light)', flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Libre Baskerville',serif", fontWeight:700, fontSize:17, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{deal.name}</div>
                  <div style={{ color:'var(--text-3)', fontSize:12, marginTop:2 }}>{deal.business || '—'}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, marginLeft:10 }}>
                  {deal.deal_type && (() => { const dt = getDealType(deal.deal_type); return dt ? <span style={{ fontSize:12, background:dt.bg, color:dt.color, borderRadius:5, padding:'2px 8px', fontWeight:600 }}>{dt.icon} {dt.label}</span> : null })()}
                  {deal.value > 0 && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:stageColor, fontWeight:600 }}>{fmt$(deal.value)}</div>}
                  <button onClick={()=>setActiveTab('contact')} title="Edit deal" style={{ background:'none', border:'1px solid var(--border)', borderRadius:6, color:'var(--text-3)', fontSize:13, lineHeight:1, cursor:'pointer', padding:'3px 7px' }}>✏️</button>
                  <button onClick={closeModal} style={{ background:'none', border:'none', color:'var(--text-3)', fontSize:20, lineHeight:1, cursor:'pointer', padding:'0 2px' }}>×</button>
                </div>
              </div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {stages.map((s, i) => {
                  const active = deal.stage === i
                  return (
                    <button key={i} className="stage-pill-btn" onClick={()=>upd(deal.id,{ stage:i })}
                      style={{ padding:'3px 10px', borderRadius:20, border:`1px solid ${active ? STAGE_COLORS[i] : 'var(--border)'}`, background: active ? STAGE_BG[i] : 'transparent', color: active ? STAGE_COLORS[i] : 'var(--text-3)', fontSize:11, fontWeight: active?600:400, cursor:'pointer' }}>
                      {s}
                    </button>
                  )
                })}
              </div>
              {(deal.invoice_url || deal.gmail_draft_id) && (
                <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:12 }}>
                  {deal.invoice_url && (
                    <a href={deal.invoice_url} target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 11px', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:7, color:stageColor, fontSize:13, textDecoration:'none', fontWeight:500, boxShadow:'var(--shadow-sm)' }}>
                      <span>🧾 View Invoice</span>
                      <span style={{ fontSize:11 }}>↗</span>
                    </a>
                  )}
                  {deal.gmail_draft_id && (
                    <a href={`https://mail.google.com/mail/u/0/#drafts/${deal.gmail_draft_id}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 11px', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:7, color:stageColor, fontSize:13, textDecoration:'none', fontWeight:500, boxShadow:'var(--shadow-sm)' }}>
                      <span>✉️ Open Gmail Draft</span>
                      <span style={{ fontSize:11 }}>↗</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div style={{ display:'flex', borderBottom:'1px solid var(--border-light)', flexShrink:0, background:'var(--cream-mid)' }}>
              {[['notes','📝 Notes'],['nextstep','⚡ Next Step'],['contact','👤 Contact']].map(([key,label]) => (
                <button key={key} className="tab-btn" onClick={()=>setActiveTab(key)}
                  style={{ flex:1, background:'none', border:'none', borderBottom:`2px solid ${activeTab===key ? stageColor : 'transparent'}`, color: activeTab===key ? 'var(--text-1)' : 'var(--text-3)', padding:'9px 0', fontSize:12, fontWeight: activeTab===key?600:400, cursor:'pointer' }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', background:'var(--white)' }}>

              {activeTab==='notes' && (
                <div>
                  <textarea ref={noteRef} value={newNote} onChange={e=>setNewNote(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) handleAddNote() }}
                    placeholder="Add a note… (⌘↵ to save)" rows={3}
                    style={{ width:'100%', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, lineHeight:1.55, marginBottom:8 }} />
                  <button onClick={handleAddNote} disabled={!newNote.trim()}
                    style={{ width:'100%', background: newNote.trim() ? 'var(--text-1)' : 'var(--cream-dark)', color: newNote.trim() ? 'var(--white)' : 'var(--text-4)', border:'none', borderRadius:7, padding:'8px', fontSize:12, fontWeight:600, cursor: newNote.trim()?'pointer':'default', marginBottom:18 }}>
                    Save Note
                  </button>
                  {(deal.notes||[]).length===0 && <div style={{ color:'var(--text-4)', fontSize:12, textAlign:'center', marginTop:24, fontStyle:'italic' }}>No notes yet</div>}
                  {(deal.notes||[]).map(note => (
                    <div key={note.id} className="note-row" style={{ marginBottom:8, padding:'10px 12px', background:'var(--cream)', borderRadius:8, border:'1px solid var(--border-light)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--text-3)' }}>{noteFmt(note.ts)}</span>
                          {note.stage && <span style={{ fontSize:9, color:'var(--text-3)', background:'var(--cream-dark)', borderRadius:4, padding:'1px 5px', border:'1px solid var(--border-light)' }}>{note.stage}</span>}
                        </div>
                        <button className="note-del" onClick={()=>deleteNote(deal.id, note.id)}
                          style={{ background:'none', border:'none', color:'var(--text-3)', fontSize:14, cursor:'pointer', padding:'0 2px' }}>×</button>
                      </div>
                      <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.55, whiteSpace:'pre-wrap' }}>{note.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab==='nextstep' && (
                <div>
                  {deal.next_step && !nsDraft ? (
                    <div style={{ padding:'14px', background:'var(--cream)', border:`1px solid ${isOverdue(deal.next_step.reminderAt)?'#FECACA':'var(--border)'}`, borderRadius:10, marginBottom:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:20 }}>{(STEP_TYPES.find(t=>t.key===deal.next_step.type)||{}).icon}</span>
                        <span style={{ fontFamily:"'Libre Baskerville',serif", fontWeight:700, fontSize:15, color:'var(--text-1)' }}>{(STEP_TYPES.find(t=>t.key===deal.next_step.type)||{}).label}</span>
                      </div>
                      {deal.next_step.note && <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:8, lineHeight:1.45 }}>{deal.next_step.note}</div>}
                      {deal.next_step.reminderAt && (
                        <div style={{ fontSize:12, color: isOverdue(deal.next_step.reminderAt)?'#B91C1C':'var(--text-3)', display:'flex', alignItems:'center', gap:5 }}>
                          <span>{isOverdue(deal.next_step.reminderAt)?'⚠':'🕐'}</span>
                          <span>{fmtDate(deal.next_step.reminderAt)}</span>
                        </div>
                      )}
                      <div style={{ display:'flex', gap:7, marginTop:12 }}>
                        <button onClick={()=>setNsDraft({ ...deal.next_step })}
                          style={{ flex:1, background:'var(--white)', border:'1px solid var(--border)', borderRadius:7, padding:'7px', color:'var(--text-2)', fontSize:12, fontWeight:500, cursor:'pointer' }}>Edit</button>
                        <button onClick={clearNs}
                          style={{ padding:'7px 14px', background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:7, color:'#B91C1C', fontSize:12, fontWeight:500, cursor:'pointer' }}>Clear</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>Action Type</Label>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                        {STEP_TYPES.map(t => {
                          const active = (nsDraft || deal.next_step)?.type === t.key
                          return (
                            <button key={t.key} onClick={()=>setNsDraft(d => ({ ...(d || {}), type: t.key }))}
                              style={{ padding:'6px 11px', borderRadius:7, border:`1px solid ${active?stageColor:'var(--border)'}`, background: active?STAGE_BG[deal.stage]||'var(--cream)':'var(--white)', color: active?stageColor:'var(--text-2)', fontSize:12, fontWeight: active?600:400, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                              {t.icon} {t.label}
                            </button>
                          )
                        })}
                      </div>
                      <Label>Details</Label>
                      <textarea value={(nsDraft || {}).note || ''} onChange={e=>setNsDraft(d => ({ ...(d || {}), note: e.target.value }))}
                        placeholder="What needs to happen?" rows={2}
                        style={{ width:'100%', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, lineHeight:1.5, marginBottom:14 }} />
                      <Label>Reminder</Label>
                      <input type="datetime-local" value={(nsDraft || {}).reminderAt || ''}
                        onChange={e=>setNsDraft(d => ({ ...(d || {}), reminderAt: e.target.value }))}
                        style={{ width:'100%', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, marginBottom:16 }} />
                      <div style={{ display:'flex', gap:7 }}>
                        <button onClick={saveNs} disabled={!nsDraft?.type}
                          style={{ flex:1, background: nsDraft?.type?'var(--text-1)':'var(--cream-dark)', color: nsDraft?.type?'var(--white)':'var(--text-4)', border:'none', borderRadius:8, padding:'9px', fontSize:13, fontWeight:600, cursor: nsDraft?.type?'pointer':'default' }}>
                          Save Next Step
                        </button>
                        {nsDraft && deal.next_step && (
                          <button onClick={()=>setNsDraft(null)}
                            style={{ padding:'9px 12px', background:'var(--white)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-2)', fontSize:13, cursor:'pointer' }}>Cancel</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab==='contact' && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {[
                    { label:'Name',       field:'name',     icon:'👤' },
                    { label:'Business',   field:'business', icon:'🏢' },
                    { label:'Phone',      field:'phone',    icon:'📞', type:'tel' },
                    { label:'Email',      field:'email',    icon:'✉️',  type:'email' },
                    { label:'Deal Value', field:'value',    icon:'💰', type:'number', mono:true },
                  ].map(({ label, field, icon, type, mono }) => (
                    <div key={field}>
                      <Label>{icon} {label}</Label>
                      <FieldInput type={type} value={deal[field]} mono={mono}
                        onChange={e=>upd(deal.id, { [field]: field==='value' ? (parseFloat(e.target.value) || 0) : e.target.value })} />
                    </div>
                  ))}
                  <div>
                    <Label>🎯 Deal Type</Label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {DEAL_TYPES.map(t => {
                        const active = t.key === 'other' ? isOtherLikeActive(deal.deal_type) : deal.deal_type === t.key
                        return (
                          <button key={t.key} onClick={()=>upd(deal.id, { deal_type: active ? '' : t.key })}
                            style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${active?t.color:'var(--border)'}`, background: active?t.bg:'var(--white)', color: active?t.color:'var(--text-2)', fontSize:13, fontWeight: active?600:400, cursor:'pointer' }}>
                            {t.icon} {t.label}
                          </button>
                        )
                      })}
                    </div>
                    {isOtherLikeActive(deal.deal_type) && (
                      <input type="text" placeholder="Custom type (e.g. copywriting) — leave blank for Other"
                        value={deal.deal_type === 'other' ? '' : (deal.deal_type || '')}
                        onChange={e => upd(deal.id, { deal_type: e.target.value || 'other' })}
                        style={{ width:'100%', background:'var(--white)', border:'1px solid var(--border)', borderRadius:7, padding:'7px 11px', color:'var(--text-1)', fontSize:12, marginTop:7, boxShadow:'var(--shadow-sm)' }} />
                    )}
                  </div>
                  {(deal.invoice_url || deal.gmail_draft_id) && (
                    <div style={{ borderTop:'1px solid var(--border-light)', paddingTop:14, marginTop:4, display:'flex', flexDirection:'column', gap:7 }}>
                      <Label>🧾 Invoice</Label>
                      {deal.invoice_url && (
                        <a href={deal.invoice_url} target="_blank" rel="noopener noreferrer"
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 11px', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:7, color:stageColor, fontSize:13, textDecoration:'none', fontWeight:500, boxShadow:'var(--shadow-sm)' }}>
                          <span>🧾 View Invoice</span>
                          <span style={{ fontSize:11 }}>↗</span>
                        </a>
                      )}
                      {deal.gmail_draft_id && (
                        <a href={`https://mail.google.com/mail/u/0/#drafts/${deal.gmail_draft_id}`} target="_blank" rel="noopener noreferrer"
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 11px', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:7, color:stageColor, fontSize:13, textDecoration:'none', fontWeight:500, boxShadow:'var(--shadow-sm)' }}>
                          <span>✉️ Open Gmail Draft</span>
                          <span style={{ fontSize:11 }}>↗</span>
                        </a>
                      )}
                    </div>
                  )}
                  <div style={{ borderTop:'1px solid var(--border-light)', paddingTop:14, marginTop:4, display:'flex', justifyContent:'center' }}>
                    <button onClick={()=>{ if (!window.confirm('Delete this deal? This cannot be undone.')) return; deleteDeal(deal.id); setPanelId(null) }}
                      style={{ background:'none', border:'1px solid #FECACA', color:'#B91C1C', borderRadius:6, padding:'5px 14px', fontSize:12, fontWeight:500, cursor:'pointer' }}>
                      Delete Deal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ── ADD LEAD MODAL ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(28,25,23,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, backdropFilter:'blur(6px)' }}>
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:16, padding:'28px 28px 24px', width:400, boxShadow:'var(--shadow-lg)' }}>
            <div style={{ fontFamily:"'Libre Baskerville',serif", fontWeight:700, fontSize:19, marginBottom:20, color:'var(--text-1)', letterSpacing:'-0.3px' }}>New Deal</div>
            {formError && (
              <div style={{ fontSize:12, color:'#B91C1C', background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:7, padding:'8px 12px', marginBottom:14 }}>{formError}</div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { key:'name',     label:'Name *',   placeholder:'Full name',         ref:nameRef },
                { key:'business', label:'Business', placeholder:'Company name' },
                { key:'phone',    label:'Phone',    placeholder:'(415) 000-0000',    type:'tel' },
                { key:'email',    label:'Email',    placeholder:'email@domain.com',  type:'email' },
              ].map(({ key, label, placeholder, type, ref }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <FieldInput inputRef={ref} type={type} value={form[key]} placeholder={placeholder}
                    onChange={e=>setForm(f => ({ ...f, [key]: e.target.value }))}
                    onKeyDown={e=>e.key==='Enter'&&handleAddDeal()} />
                </div>
              ))}
              <div>
                <Label>Deal Value</Label>
                <FieldInput type="number" value={form.value} placeholder="0" mono
                  onChange={e=>setForm(f => ({ ...f, value: e.target.value }))}
                  onKeyDown={e=>e.key==='Enter'&&handleAddDeal()} />
              </div>
              <div>
                <Label>Deal Type</Label>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {DEAL_TYPES.map(t => {
                    const active = t.key === 'other' ? isOtherLikeActive(formType) : formType === t.key
                    return (
                      <button key={t.key} onClick={()=>setFormType(active ? '' : t.key)}
                        style={{ padding:'5px 9px', borderRadius:6, border:`1px solid ${active?t.color:'var(--border)'}`, background: active?t.bg:'var(--white)', color: active?t.color:'var(--text-2)', fontSize:13, fontWeight: active?600:400, cursor:'pointer' }}>
                        {t.icon} {t.label}
                      </button>
                    )
                  })}
                </div>
                {isOtherLikeActive(formType) && (
                  <input type="text" placeholder="Custom type (e.g. copywriting) — leave blank for Other"
                    value={formType === 'other' ? '' : formType}
                    onChange={e => setFormType(e.target.value || 'other')}
                    style={{ width:'100%', background:'var(--white)', border:'1px solid var(--border)', borderRadius:7, padding:'7px 11px', color:'var(--text-1)', fontSize:12, marginTop:7, boxShadow:'var(--shadow-sm)' }} />
                )}
              </div>
              <div>
                <Label>Stage</Label>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {stages.map((s, i) => (
                    <button key={i} onClick={()=>setFormStage(i)}
                      style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${formStage===i?STAGE_COLORS[i]:'var(--border)'}`, background: formStage===i?STAGE_BG[i]:'var(--white)', color: formStage===i?STAGE_COLORS[i]:'var(--text-2)', fontSize:12, fontWeight: formStage===i?600:400, cursor:'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:22 }}>
              <button onClick={handleAddDeal} style={{ flex:1, background:'#C96A1F', color:'#FFFFFF', border:'none', borderRadius:8, padding:'11px', fontSize:13, fontWeight:600, cursor:'pointer', letterSpacing:'0.1px', boxShadow:'0 1px 4px rgba(201,106,31,0.35)' }}>Add Deal</button>
              <button onClick={()=>setShowForm(false)} style={{ padding:'11px 16px', background:'var(--cream)', color:'var(--text-2)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
