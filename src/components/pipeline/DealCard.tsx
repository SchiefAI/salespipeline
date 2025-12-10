import { useState } from 'react'
import type { Deal } from '../../types/deal'
import { STAGES, type StageId } from '../../types/stage'

interface DealCardProps {
  deal: Deal
  onStageChange: (dealId: string, newStageId: StageId) => void
  onEdit: (deal: Deal) => void
}

export function DealCard({ deal, onStageChange, onEdit }: DealCardProps) {
  const [isChangingStage, setIsChangingStage] = useState(false)

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

  return (
    <div className="card card-hover p-4 cursor-default">
      {/* Header: Organization name + type badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-slate-800 leading-tight">
          {deal.organization}
        </h3>
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
            deal.deal_type === 'partner'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {deal.deal_type === 'partner' ? 'Partner' : 'Klant'}
        </span>
      </div>

      {/* Amount (only if set) */}
      {deal.amount !== null && (
        <p className="text-lg font-medium text-amber-600 mb-2">
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

      {/* Footer: date, edit and stage selector */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {formatDate(deal.last_activity_at)}
        </span>

        <div className="flex items-center gap-1">
          {/* Edit button */}
          <button
            onClick={() => onEdit(deal)}
            className="text-xs text-slate-500 hover:text-slate-700 py-1 px-2 rounded hover:bg-slate-100 transition-colors"
            title="Bewerken"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* Stage dropdown */}
          <div className="relative">
          <button
            onClick={() => setIsChangingStage(!isChangingStage)}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-100 transition-colors"
          >
            Verplaats
            <svg
              className={`w-3 h-3 transition-transform ${isChangingStage ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isChangingStage && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsChangingStage(false)} />
              <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-lg shadow-dropdown border border-slate-200 py-1 z-20">
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageChange(stage.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                      stage.id === deal.stage_id ? 'text-amber-600 font-medium' : 'text-slate-700'
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
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
