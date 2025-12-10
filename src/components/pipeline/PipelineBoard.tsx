import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { STAGES, type StageId } from '../../types/stage'
import type { Deal, CreateDealData, UpdateDealData } from '../../types/deal'
import { StageColumn } from './StageColumn'
import { DealForm } from './DealForm'
import { DealDetailModal } from './DealDetailModal'

export function PipelineBoard() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDealForm, setShowDealForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [barsAnimated, setBarsAnimated] = useState(false)
  const [donutAnimated, setDonutAnimated] = useState(false)
  const barsRef = useRef<HTMLDivElement>(null)
  const donutRef = useRef<HTMLDivElement>(null)

  // Fetch deals from Supabase (inclusief prospects)
  const fetchDeals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*, prospects:deal_prospects(*)')
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

  // Keyboard shortcut: N voor nieuwe deal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alleen als we niet in een input/textarea zitten
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !showDealForm) {
        e.preventDefault()
        setShowDealForm(true)
      }
      if (e.key === 'Escape' && showDealForm) {
        setShowDealForm(false)
        setEditingDeal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDealForm])

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
      notes: data.notes,
      company_url: data.company_url,
      contact_url: data.contact_url,
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

  // Open detail view
  const handleViewDeal = (deal: Deal) => {
    setViewingDeal(deal)
  }

  // Edit from detail view
  const handleEditFromDetail = () => {
    if (viewingDeal) {
      setEditingDeal(viewingDeal)
      setViewingDeal(null)
      setShowDealForm(true)
    }
  }

  // Close form
  const handleCloseForm = () => {
    setShowDealForm(false)
    setEditingDeal(null)
  }

  // Add prospect to deal
  const handleAddProspect = async (dealId: string, name: string, notes: string | null) => {
    const { error } = await supabase.from('deal_prospects').insert({
      deal_id: dealId,
      name,
      notes,
    })
    if (error) throw error
    await fetchDeals()
  }

  // Delete prospect
  const handleDeleteProspect = async (prospectId: string) => {
    const { error } = await supabase.from('deal_prospects').delete().eq('id', prospectId)
    if (error) throw error
    await fetchDeals()
  }

  // Filter deals by search query
  const filteredDeals = searchQuery
    ? deals.filter((deal) =>
        deal.organization.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : deals

  // Group deals by stage (use filtered deals for display)
  const dealsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = filteredDeals.filter((deal) => deal.stage_id === stage.id)
      return acc
    },
    {} as Record<StageId, Deal[]>
  )

  // Calculate funnel data (percentages based on all deals, not filtered)
  const totalDeals = deals.filter((d) => d.stage_id !== 'won').length
  const funnelData = STAGES.filter((s) => s.id !== 'won').map((stage) => ({
    id: stage.id,
    name: stage.name,
    count: deals.filter((d) => d.stage_id === stage.id).length,
    percentage: totalDeals > 0
      ? Math.round((deals.filter((d) => d.stage_id === stage.id).length / totalDeals) * 100)
      : 0,
  }))

  // Calculate total pipeline value (alleen deals met bedrag, exclusief won)
  const pipelineValue = deals
    .filter((deal) => deal.stage_id !== 'won')
    .reduce((sum, deal) => sum + (deal.amount ?? 0), 0)

  // Calculate won value
  const wonValue = deals
    .filter((deal) => deal.stage_id === 'won')
    .reduce((sum, deal) => sum + (deal.amount ?? 0), 0)

  // Count overdue actions
  const overdueCount = deals.filter((deal) => {
    if (!deal.next_action_at) return false
    const date = new Date(deal.next_action_at)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return date < now
  }).length

  // Count stale deals (no activity for 14+ days, not in Won)
  const staleDeals = deals.filter((deal) => {
    if (deal.stage_id === 'won') return false
    const lastActivity = new Date(deal.last_activity_at)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 14
  })

  // Get deals with next actions, sorted by date
  const dealsWithActions = deals
    .filter((deal) => deal.next_action_at)
    .sort((a, b) => new Date(a.next_action_at!).getTime() - new Date(b.next_action_at!).getTime())

  // Check if date is overdue
  const isOverdue = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return date < now
  }

  // Check if date is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    return date.toDateString() === now.toDateString()
  }

  // Format date for action list
  const formatActionDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === now.toDateString()) return 'Vandaag'
    if (date.toDateString() === tomorrow.toDateString()) return 'Morgen'

    return date.toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  // Get stage name by id
  const getStageName = (stageId: string) => {
    return STAGES.find((s) => s.id === stageId)?.name ?? stageId
  }

  // Reset animation state when loading
  useEffect(() => {
    if (loading) {
      setBarsAnimated(false)
      setDonutAnimated(false)
    }
  }, [loading])

  // Intersection Observer for donut animation
  useEffect(() => {
    if (!donutRef.current || loading || donutAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setDonutAnimated(true), 100)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(donutRef.current)
    return () => observer.disconnect()
  }, [loading, donutAnimated])

  // Intersection Observer for bars animation
  useEffect(() => {
    if (!barsRef.current || loading || barsAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setBarsAnimated(true), 100)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(barsRef.current)
    return () => observer.disconnect()
  }, [loading, barsAnimated])

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
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm font-mono">
            <span className="text-[#1a1a1a]/70">
              {deals.length} deal{deals.length !== 1 && 's'}
            </span>
            <span className="text-[#1a1a1a]/70">
              Pipeline{' '}
              <span className="text-[#1a1a1a] font-semibold">
                {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(pipelineValue)}
              </span>
            </span>
            {wonValue > 0 && (
              <span className="text-[#1a1a1a]/70">
                Won{' '}
                <span className="text-green-600 font-semibold">
                  {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(wonValue)}
                </span>
              </span>
            )}
            {overdueCount > 0 && (
              <span className="text-red-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {overdueCount} te laat
              </span>
            )}
            {staleDeals.length > 0 && (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {staleDeals.length} inactief
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Zoeken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border-2 border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none w-48 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={() => setShowDealForm(true)} className="btn btn-primary" title="Sneltoets: N">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nieuwe deal
            </button>
          </div>
        </div>

        {/* Funnel visualization */}
        {totalDeals > 0 && (
          <div className="flex items-center gap-1 h-6">
            {funnelData.map((stage, i) => (
              <div
                key={stage.id}
                className="relative h-full bg-[#1a1a1a]/10 hover:bg-[#e05a28]/20 transition-colors group"
                style={{ flex: stage.count || 0.5 }}
                title={`${stage.name}: ${stage.count} deal${stage.count !== 1 ? 's' : ''} (${stage.percentage}%)`}
              >
                {stage.count > 0 && (
                  <div
                    className="absolute inset-0 bg-[#e05a28]"
                    style={{ opacity: 0.2 + (i * 0.12) }}
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[#1a1a1a]/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  {stage.count}
                </span>
              </div>
            ))}
          </div>
        )}
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

      {/* Bottom section: Vervolgacties + Stats */}
      {(dealsWithActions.length > 0 || deals.length > 0) && (
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-t-2 border-[#1a1a1a] bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Vervolgacties */}
            <div className="min-w-0">
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">// Vervolgacties</h3>
                <div className="grid gap-2">
                  {dealsWithActions.slice(0, 6).map((deal) => (
                    <div
                      key={deal.id}
                      onClick={() => handleViewDeal(deal)}
                      className={`flex items-center gap-4 p-3 border-2 cursor-pointer transition-all ${
                        isOverdue(deal.next_action_at!)
                          ? 'border-red-500 bg-red-50 hover:shadow-[3px_3px_0_#ef4444]'
                          : isToday(deal.next_action_at!)
                          ? 'border-[#e05a28] bg-orange-50 hover:shadow-[3px_3px_0_#e05a28]'
                          : 'border-[#1a1a1a] bg-white hover:shadow-[3px_3px_0_#1a1a1a]'
                      } hover:translate-x-[-2px] hover:translate-y-[-2px]`}
                    >
                      <div className={`font-mono text-sm font-medium min-w-[80px] ${
                        isOverdue(deal.next_action_at!) ? 'text-red-600' : isToday(deal.next_action_at!) ? 'text-[#e05a28]' : 'text-[#1a1a1a]'
                      }`}>
                        {formatActionDate(deal.next_action_at!)}
                      </div>
                      <div className="flex-1 font-medium text-[#1a1a1a] truncate">
                        {deal.organization}
                      </div>
                      <div className="text-xs font-mono uppercase tracking-wide text-slate-500 hidden sm:block">
                        {getStageName(deal.stage_id)}
                      </div>
                      <span className={`tag text-xs ${
                        deal.deal_type === 'partner'
                          ? 'bg-[#082B3B] text-white border-[#082B3B]'
                          : 'bg-[#e05a28] text-white border-[#e05a28]'
                      }`}>
                        {deal.deal_type === 'partner' ? '// P' : '// K'}
                      </span>
                    </div>
                  ))}
                  {dealsWithActions.length > 6 && (
                    <p className="text-sm text-slate-500 font-mono mt-2">
                      + {dealsWithActions.length - 6} meer...
                    </p>
                  )}
                  {dealsWithActions.length === 0 && (
                    <p className="text-sm text-slate-400 font-mono py-8 text-center border-2 border-dashed border-slate-200">
                      // Geen vervolgacties gepland
                    </p>
                  )}
                </div>
            </div>

            {/* Right: Stats & Charts */}
            <div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">// Statistieken</h3>
                <div className="space-y-6">
                  {/* Top row: Type verdeling + Waarde */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Type verdeling (donut-achtig) */}
                    <div ref={donutRef} className="border-2 border-[#1a1a1a] p-5">
                      <p className="text-xs font-mono uppercase tracking-wide text-slate-500 mb-4">Type verdeling</p>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative w-32 h-32">
                          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#e8e4de" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="14" fill="none"
                              stroke="#e05a28"
                              strokeWidth="3"
                              strokeDasharray={`${donutAnimated ? (deals.filter(d => d.deal_type === 'klant').length / Math.max(deals.length, 1)) * 88 : 0} 88`}
                              className="transition-all duration-1000 ease-out"
                            />
                            <circle
                              cx="18" cy="18" r="14" fill="none"
                              stroke="#082B3B"
                              strokeWidth="3"
                              strokeDasharray={`${donutAnimated ? (deals.filter(d => d.deal_type === 'partner').length / Math.max(deals.length, 1)) * 88 : 0} 88`}
                              strokeDashoffset={`-${(deals.filter(d => d.deal_type === 'klant').length / Math.max(deals.length, 1)) * 88}`}
                              className="transition-all duration-1000 ease-out delay-300"
                            />
                          </svg>
                          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 delay-500 ${donutAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                            <span className="text-2xl font-bold text-[#1a1a1a]">{deals.length}</span>
                            <span className="text-xs text-slate-500">deals</span>
                          </div>
                        </div>
                        <div className={`flex gap-6 transition-all duration-500 delay-700 ${donutAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#e05a28]" />
                            <span className="text-sm font-medium">{deals.filter(d => d.deal_type === 'klant').length} Klant</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#082B3B]" />
                            <span className="text-sm font-medium">{deals.filter(d => d.deal_type === 'partner').length} Partner</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Waarde verdeling */}
                    <div className="border-2 border-[#1a1a1a] p-5">
                      <p className="text-xs font-mono uppercase tracking-wide text-slate-500 mb-4">Waarde overzicht</p>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">In pipeline</p>
                          <p className="font-mono text-xl font-bold text-[#1a1a1a]">
                            {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(pipelineValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Gewonnen</p>
                          <p className="font-mono text-xl font-bold text-green-600">
                            {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(wonValue)}
                          </p>
                        </div>
                        <div className="border-t-2 border-[#1a1a1a]/10 pt-4">
                          <p className="text-xs text-slate-500 mb-1">Totaal potentieel</p>
                          <p className="font-mono text-2xl font-bold text-[#1a1a1a]">
                            {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(pipelineValue + wonValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline per stage (horizontal bars) - full width */}
                  <div ref={barsRef} className="border-2 border-[#1a1a1a] p-5">
                    <p className="text-xs font-mono uppercase tracking-wide text-slate-500 mb-4">Deals per stage</p>
                    <div className="space-y-3">
                      {STAGES.map((stage, index) => {
                        const count = deals.filter(d => d.stage_id === stage.id).length
                        const maxCount = Math.max(...STAGES.map(s => deals.filter(d => d.stage_id === s.id).length), 1)
                        const percentage = (count / maxCount) * 100
                        return (
                          <div key={stage.id} className="flex items-center gap-3">
                            <span className="text-sm w-24 truncate text-slate-600">{stage.name}</span>
                            <div className="flex-1 h-6 bg-[#f5f1eb] overflow-hidden">
                              <div
                                className={`h-full transition-all duration-700 ease-out ${stage.id === 'won' ? 'bg-green-500' : 'bg-[#e05a28]'}`}
                                style={{
                                  width: barsAnimated ? `${percentage}%` : '0%',
                                  opacity: stage.id === 'won' ? 1 : 0.4 + (STAGES.findIndex(s => s.id === stage.id) * 0.1),
                                  transitionDelay: `${index * 80}ms`
                                }}
                              />
                            </div>
                            <span className={`font-mono text-sm w-8 text-right font-bold transition-opacity duration-300 ${barsAnimated ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${200 + index * 80}ms` }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Deal detail modal */}
      {viewingDeal && (
        <DealDetailModal
          deal={viewingDeal}
          onClose={() => setViewingDeal(null)}
          onEdit={handleEditFromDetail}
          onStageChange={(dealId, newStageId) => {
            handleStageChange(dealId, newStageId)
            // Update viewing deal with new stage
            setViewingDeal((prev) => prev ? { ...prev, stage_id: newStageId } : null)
          }}
        />
      )}

      {/* Deal form modal */}
      {showDealForm && (
        <DealForm
          deal={editingDeal ?? undefined}
          onSubmit={editingDeal ? (data) => handleUpdateDeal(data as UpdateDealData) : (data) => handleCreateDeal(data as CreateDealData)}
          onClose={handleCloseForm}
          onDelete={editingDeal ? handleDeleteDeal : undefined}
          onAddProspect={handleAddProspect}
          onDeleteProspect={handleDeleteProspect}
        />
      )}
    </div>
  )
}
