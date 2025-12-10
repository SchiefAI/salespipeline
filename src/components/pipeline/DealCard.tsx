import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Deal } from '../../types/deal'
import { STAGES, type StageId } from '../../types/stage'

interface DealCardProps {
  deal: Deal
  onStageChange: (dealId: string, newStageId: StageId) => void
  onEdit: (deal: Deal) => void
}

export function DealCard({ deal, onStageChange, onEdit }: DealCardProps) {
  const [isChangingStage, setIsChangingStage] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('dealId', deal.id)
    e.dataTransfer.setData('fromStage', deal.stage_id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isChangingStage && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.right - 176, // 176px = w-44
      })
    }
  }, [isChangingStage])

  // Format amount as euros with thousands separator
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date as relative or short date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Vandaag'
    if (diffDays === 1) return 'Gisteren'
    if (diffDays < 7) return `${diffDays} dagen geleden`

    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    })
  }

  // Format next action date
  const formatNextAction = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    })
  }

  // Check if next action is overdue
  const isOverdue = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return date < now
  }

  const handleStageChange = (newStageId: StageId) => {
    setIsChangingStage(false)
    if (newStageId !== deal.stage_id) {
      onStageChange(deal.id, newStageId)
    }
  }

  // Get current stage index and check if we can move
  const currentStageIndex = STAGES.findIndex((s) => s.id === deal.stage_id)
  const canMoveBack = currentStageIndex > 0
  const canMoveForward = currentStageIndex < STAGES.length - 1

  const handleMoveBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canMoveBack) {
      onStageChange(deal.id, STAGES[currentStageIndex - 1].id as StageId)
    }
  }

  const handleMoveForward = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canMoveForward) {
      onStageChange(deal.id, STAGES[currentStageIndex + 1].id as StageId)
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`card card-hover p-4 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 scale-95' : ''}`}
    >
      {/* Header: Organization name + type badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-[#1a1a1a] leading-tight">
          {deal.organization}
        </h3>
        <span
          className={`tag shrink-0 ${
            deal.deal_type === 'partner'
              ? 'bg-[#082B3B] text-white border-[#082B3B]'
              : 'bg-[#e05a28] text-white border-[#e05a28]'
          }`}
        >
          {deal.deal_type === 'partner' ? '// Partner' : '// Klant'}
        </span>
      </div>

      {/* Amount (only if set) */}
      {deal.amount !== null && (
        <p className="text-lg font-semibold text-[#1a1a1a] mb-2">
          {formatAmount(deal.amount)}
        </p>
      )}

      {/* Next action (if set) */}
      {deal.next_action_at && (
        <p
          className={`text-xs mb-2 flex items-center gap-1 ${
            isOverdue(deal.next_action_at)
              ? 'text-red-600 font-medium'
              : 'text-slate-500'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Actie: {formatNextAction(deal.next_action_at)}
          {isOverdue(deal.next_action_at) && ' (te laat)'}
        </p>
      )}

      {/* Prospects count (alleen voor partners met prospects) */}
      {deal.deal_type === 'partner' && deal.prospects && deal.prospects.length > 0 && (
        <p className="text-xs text-[#3EBDE4] mb-2 flex items-center gap-1 font-medium">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {deal.prospects.length} prospect{deal.prospects.length !== 1 && 's'}
        </p>
      )}

      {/* Footer: date, edit and stage navigation */}
      <div className="flex items-center justify-between pt-2 border-t-2 border-[#1a1a1a]/10">
        <span className="text-xs text-slate-400">
          {formatDate(deal.last_activity_at)}
        </span>

        <div className="flex items-center gap-1">
          {/* Quick stage navigation */}
          <button
            onClick={handleMoveBack}
            disabled={!canMoveBack}
            className={`p-1 transition-colors ${canMoveBack ? 'text-slate-400 hover:text-[#1a1a1a] hover:bg-slate-100' : 'text-slate-200 cursor-not-allowed'}`}
            title={canMoveBack ? `Naar ${STAGES[currentStageIndex - 1].name}` : undefined}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleMoveForward}
            disabled={!canMoveForward}
            className={`p-1 transition-colors ${canMoveForward ? 'text-slate-400 hover:text-[#e05a28] hover:bg-orange-50' : 'text-slate-200 cursor-not-allowed'}`}
            title={canMoveForward ? `Naar ${STAGES[currentStageIndex + 1].name}` : undefined}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          {/* Edit button */}
          <button
            onClick={() => onEdit(deal)}
            className="text-xs text-slate-500 hover:text-slate-700 p-1 hover:bg-slate-100 transition-colors"
            title="Bewerken"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* Stage dropdown */}
          <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsChangingStage(!isChangingStage)}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 p-1 hover:bg-slate-100 transition-colors"
            title="Alle stages"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {isChangingStage && createPortal(
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsChangingStage(false)} />
              <div
                className="fixed w-44 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] py-1 z-50"
                style={{ top: dropdownPos.top, left: dropdownPos.left }}
              >
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageChange(stage.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[#f5f1eb] flex items-center gap-2 ${
                      stage.id === deal.stage_id ? 'text-[#e05a28] font-medium' : 'text-[#1a1a1a]'
                    }`}
                  >
                    {stage.id === deal.stage_id && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className={stage.id === deal.stage_id ? '' : 'ml-6'}>{stage.name}</span>
                  </button>
                ))}
              </div>
            </>,
            document.body
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
