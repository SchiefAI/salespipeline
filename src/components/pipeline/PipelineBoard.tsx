import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { STAGES, type StageId } from '../../types/stage'
import type { Deal, CreateDealData, UpdateDealData } from '../../types/deal'
import { StageColumn } from './StageColumn'
import { DealForm } from './DealForm'

export function PipelineBoard() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDealForm, setShowDealForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  // Fetch deals from Supabase
  const fetchDeals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeals(data ?? [])
      setError(null)
    } catch (err) {
      console.error('Error fetching deals:', err)
      setError(err instanceof Error ? err.message : 'Kon deals niet ophalen')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  // Create new deal
  const handleCreateDeal = async (data: CreateDealData) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Niet ingelogd')

    const now = new Date().toISOString()

    const { error } = await supabase.from('deals').insert({
      user_id: userData.user.id,
      organization: data.organization,
      deal_type: data.deal_type,
      amount: data.amount,
      stage_id: data.stage_id,
      next_action_at: data.next_action_at,
      last_activity_at: now,
    })

    if (error) throw error
    await fetchDeals()
  }

  // Update deal stage
  const handleStageChange = async (dealId: string, newStageId: StageId) => {
    // Optimistic update
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId
          ? { ...deal, stage_id: newStageId, last_activity_at: new Date().toISOString() }
          : deal
      )
    )

    const { error } = await supabase
      .from('deals')
      .update({
        stage_id: newStageId,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', dealId)

    if (error) {
      console.error('Error updating deal:', error)
      // Revert on error
      await fetchDeals()
    }
  }

  // Update deal
  const handleUpdateDeal = async (data: UpdateDealData) => {
    if (!editingDeal) return

    const { error } = await supabase
      .from('deals')
      .update({
        ...data,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', editingDeal.id)

    if (error) throw error
    await fetchDeals()
  }

  // Delete deal
  const handleDeleteDeal = async () => {
    if (!editingDeal) return

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', editingDeal.id)

    if (error) throw error
    await fetchDeals()
  }

  // Open edit form
  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal)
    setShowDealForm(true)
  }

  // Close form
  const handleCloseForm = () => {
    setShowDealForm(false)
    setEditingDeal(null)
  }

  // Group deals by stage
  const dealsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = deals.filter((deal) => deal.stage_id === stage.id)
      return acc
    },
    {} as Record<StageId, Deal[]>
  )

  // Calculate total pipeline value (alleen deals met bedrag)
  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Deals laden...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button onClick={fetchDeals} className="btn btn-secondary">
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Toolbar */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 bg-white">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Pipeline</h2>
          <p className="text-sm text-slate-500">
            {deals.length} deal{deals.length !== 1 && 's'} · Totaal{' '}
            {new Intl.NumberFormat('nl-NL', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
            }).format(totalValue)}
          </p>
        </div>
        <button onClick={() => setShowDealForm(true)} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe deal
        </button>
      </div>

      {/* Pipeline columns */}
      <div className="p-4 sm:p-6 lg:p-8 overflow-x-auto pipeline-scroll">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id]}
              onStageChange={handleStageChange}
              onEditDeal={handleEditDeal}
            />
          ))}
        </div>
      </div>

      {/* Deal form modal */}
      {showDealForm && (
        <DealForm
          deal={editingDeal ?? undefined}
          onSubmit={editingDeal ? (data) => handleUpdateDeal(data as UpdateDealData) : (data) => handleCreateDeal(data as CreateDealData)}
          onClose={handleCloseForm}
          onDelete={editingDeal ? handleDeleteDeal : undefined}
        />
      )}
    </div>
  )
}
