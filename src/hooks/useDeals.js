import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_STAGES } from '../constants/stageColors'
import { uid } from '../utils/format'

/**
 * useDeals
 * Manages all deal data and pipeline config for the logged-in user.
 * Replace localStorage calls with Supabase queries here.
 */
export function useDeals(userId) {
  const [deals, setDeals]   = useState([])
  const [stages, setStages] = useState(DEFAULT_STAGES)
  const [loaded, setLoaded] = useState(false)

  // ── Load data on mount ──────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    Promise.all([fetchDeals(), fetchConfig()]).then(() => setLoaded(true))
  }, [userId])

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error && data) setDeals(data)
  }

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('pipeline_config')
      .select('stages')
      .eq('user_id', userId)
      .single()
    if (data?.stages) {
      const migrated = data.stages.map(s => s === 'Negotiation' ? 'Invoiced' : s)
      if (migrated.some((s, i) => s !== data.stages[i])) {
        await supabase.from('pipeline_config').upsert({ user_id: userId, stages: migrated, updated_at: new Date().toISOString() })
      }
      setStages(migrated)
    }
  }

  // ── Save stage names ─────────────────────────────────────────
  const saveStages = async (newStages) => {
    setStages(newStages)
    await supabase
      .from('pipeline_config')
      .upsert({ user_id: userId, stages: newStages, updated_at: new Date().toISOString() })
  }

  // ── Add deal ─────────────────────────────────────────────────
  const addDeal = async (dealData) => {
    const newDeal = {
      ...dealData,
      user_id: userId,
      notes: [],
      next_step: null,
    }
    const { data, error } = await supabase
      .from('deals')
      .insert(newDeal)
      .select()
      .single()
    if (!error && data) setDeals(prev => [data, ...prev])
    return { error }
  }

  // ── Update deal ───────────────────────────────────────────────
  const updateDeal = async (id, patch) => {
    // Optimistic update
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d))
    const { error } = await supabase
      .from('deals')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
    if (error) fetchDeals() // revert on error
    return { error }
  }

  // ── Delete deal ───────────────────────────────────────────────
  const deleteDeal = async (id) => {
    setDeals(prev => prev.filter(d => d.id !== id))
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) fetchDeals()
    return { error }
  }

  // ── Move deal to stage ───────────────────────────────────────
  const moveDeal = (id, dir) => {
    const deal = deals.find(d => d.id === id)
    if (!deal) return
    const newStage = Math.max(0, Math.min(stages.length - 1, deal.stage + dir))
    updateDeal(id, { stage: newStage })
  }

  // ── Add note ─────────────────────────────────────────────────
  const addNote = (dealId, text, stageName) => {
    const deal = deals.find(d => d.id === dealId)
    if (!deal) return
    const note = { id: uid(), text, ts: Date.now(), stage: stageName }
    const notes = [note, ...(deal.notes || [])]
    updateDeal(dealId, { notes })
  }

  const deleteNote = (dealId, noteId) => {
    const deal = deals.find(d => d.id === dealId)
    if (!deal) return
    const notes = (deal.notes || []).filter(n => n.id !== noteId)
    updateDeal(dealId, { notes })
  }

  return {
    deals, stages, loaded,
    addDeal, updateDeal, deleteDeal, moveDeal,
    addNote, deleteNote, saveStages,
  }
}
