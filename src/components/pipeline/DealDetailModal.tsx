import type { Deal } from '../../types/deal'
import { STAGES, type StageId } from '../../types/stage'

interface DealDetailModalProps {
  deal: Deal
  onClose: () => void
  onEdit: () => void
  onStageChange: (dealId: string, newStageId: StageId) => void
}

export function DealDetailModal({ deal, onClose, onEdit, onStageChange }: DealDetailModalProps) {
  // Format amount as euros
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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

  // Check if today
  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    return date.toDateString() === now.toDateString()
  }

  // Get current stage
  const currentStage = STAGES.find((s) => s.id === deal.stage_id)
  const currentStageIndex = STAGES.findIndex((s) => s.id === deal.stage_id)
  const canMoveBack = currentStageIndex > 0
  const canMoveForward = currentStageIndex < STAGES.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0_#1a1a1a] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b-2 border-[#1a1a1a]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold text-[#1a1a1a] truncate">
                {deal.organization}
              </h2>
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
            <p className="text-sm text-slate-500 font-mono">{currentStage?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#f5f1eb] transition-colors border-2 border-transparent hover:border-[#1a1a1a] shrink-0 ml-4"
          >
            <svg className="w-5 h-5 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount */}
          {deal.amount !== null && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wide text-slate-500 mb-1">Dealwaarde</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">{formatAmount(deal.amount)}</p>
            </div>
          )}

          {/* Next action */}
          {deal.next_action_at && (
            <div className={`p-4 border-2 ${
              isOverdue(deal.next_action_at)
                ? 'border-red-500 bg-red-50'
                : isToday(deal.next_action_at)
                ? 'border-[#e05a28] bg-orange-50'
                : 'border-[#1a1a1a] bg-[#f5f1eb]'
            }`}>
              <p className="text-xs font-mono uppercase tracking-wide text-slate-500 mb-1">Volgende actie</p>
              <p className={`text-lg font-semibold ${
                isOverdue(deal.next_action_at) ? 'text-red-600' : isToday(deal.next_action_at) ? 'text-[#e05a28]' : 'text-[#1a1a1a]'
              }`}>
                {formatDate(deal.next_action_at)}
                {isOverdue(deal.next_action_at) && <span className="text-sm font-normal ml-2">(te laat)</span>}
                {isToday(deal.next_action_at) && <span className="text-sm font-normal ml-2">(vandaag)</span>}
              </p>
            </div>
          )}

          {/* URLs */}
          {(deal.company_url || deal.contact_url) && (
            <div className="flex gap-3">
              {deal.company_url && (
                <a
                  href={deal.company_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 border-2 border-[#1a1a1a] hover:bg-[#f5f1eb] transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {deal.contact_url && (
                <a
                  href={deal.contact_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 border-2 border-[#1a1a1a] hover:bg-[#f5f1eb] transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contact
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          {deal.notes && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wide text-slate-500 mb-2">Opmerkingen</p>
              <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap bg-[#f5f1eb] p-4 border-2 border-[#1a1a1a]/10">
                {deal.notes}
              </p>
            </div>
          )}

          {/* Prospects (for partners) */}
          {deal.deal_type === 'partner' && deal.prospects && deal.prospects.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wide text-slate-500 mb-2">
                Prospects ({deal.prospects.length})
              </p>
              <div className="space-y-2">
                {deal.prospects.map((prospect) => (
                  <div key={prospect.id} className="p-3 bg-[#f5f1eb] border-2 border-[#1a1a1a]/10">
                    <p className="font-medium text-[#1a1a1a]">{prospect.name}</p>
                    {prospect.notes && (
                      <p className="text-sm text-slate-500 mt-1">{prospect.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage navigation */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wide text-slate-500 mb-2">Fase</p>
            <div className="flex gap-2">
              <button
                onClick={() => canMoveBack && onStageChange(deal.id, STAGES[currentStageIndex - 1].id as StageId)}
                disabled={!canMoveBack}
                className={`flex-1 py-2 px-3 border-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  canMoveBack
                    ? 'border-[#1a1a1a] hover:bg-[#f5f1eb]'
                    : 'border-slate-200 text-slate-300 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {canMoveBack ? STAGES[currentStageIndex - 1].name : 'Begin'}
              </button>
              <button
                onClick={() => canMoveForward && onStageChange(deal.id, STAGES[currentStageIndex + 1].id as StageId)}
                disabled={!canMoveForward}
                className={`flex-1 py-2 px-3 border-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  canMoveForward
                    ? 'border-[#e05a28] text-[#e05a28] hover:bg-orange-50'
                    : 'border-slate-200 text-slate-300 cursor-not-allowed'
                }`}
              >
                {canMoveForward ? STAGES[currentStageIndex + 1].name : 'Einde'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Meta info */}
          <div className="pt-4 border-t-2 border-[#1a1a1a]/10 flex justify-between text-xs text-slate-400 font-mono">
            <span>Aangemaakt: {new Date(deal.created_at).toLocaleDateString('nl-NL')}</span>
            <span>Laatst actief: {new Date(deal.last_activity_at).toLocaleDateString('nl-NL')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-[#1a1a1a] bg-[#f5f1eb]">
          <button
            onClick={onEdit}
            className="btn btn-primary w-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Bewerken
          </button>
        </div>
      </div>
    </div>
  )
}
