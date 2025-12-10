import { useState } from 'react'
import { STAGES, type StageId } from '../../types/stage'
import type { Deal, CreateDealData, UpdateDealData, DealType } from '../../types/deal'

interface DealFormProps {
  deal?: Deal
  onSubmit: (data: CreateDealData | UpdateDealData) => Promise<void>
  onClose: () => void
  onDelete?: () => Promise<void>
}

export function DealForm({ deal, onSubmit, onClose, onDelete }: DealFormProps) {
  const isEditing = !!deal

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  const [organization, setOrganization] = useState(deal?.organization ?? '')
  const [dealType, setDealType] = useState<DealType>(deal?.deal_type ?? 'klant')
  const [amount, setAmount] = useState(deal?.amount?.toString() ?? '')
  const [stageId, setStageId] = useState<StageId>(deal?.stage_id ?? 'suspect')
  const [nextActionAt, setNextActionAt] = useState(formatDateForInput(deal?.next_action_at ?? null))
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!organization.trim()) {
      setError('Organisatienaam is verplicht')
      return
    }

    // Parse amount (optioneel)
    let parsedAmount: number | null = null
    if (amount.trim()) {
      parsedAmount = parseFloat(amount.replace(/[^\d,-]/g, '').replace(',', '.'))
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        setError('Voer een geldig bedrag in')
        return
      }
    }

    setSubmitting(true)

    try {
      await onSubmit({
        organization: organization.trim(),
        deal_type: dealType,
        amount: parsedAmount,
        stage_id: stageId,
        next_action_at: nextActionAt ? new Date(nextActionAt).toISOString() : null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !confirm('Weet je zeker dat je deze deal wilt verwijderen?')) return

    setDeleting(true)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEditing ? 'Deal bewerken' : 'Nieuwe deal'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="organization" className="label">
              Organisatie
            </label>
            <input
              type="text"
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="input"
              placeholder="Bedrijfsnaam"
              autoFocus
            />
          </div>

          <div>
            <label className="label">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dealType"
                  value="klant"
                  checked={dealType === 'klant'}
                  onChange={() => setDealType('klant')}
                  className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Klant</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dealType"
                  value="partner"
                  checked={dealType === 'partner'}
                  onChange={() => setDealType('partner')}
                  className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Partner</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="label">
              Bedrag (€) <span className="text-slate-400 font-normal">— optioneel</span>
            </label>
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="10.000"
            />
          </div>

          <div>
            <label htmlFor="stage" className="label">
              Fase
            </label>
            <select
              id="stage"
              value={stageId}
              onChange={(e) => setStageId(e.target.value as StageId)}
              className="input select"
            >
              {STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="nextActionAt" className="label">
              Volgende actie <span className="text-slate-400 font-normal">— optioneel</span>
            </label>
            <input
              type="date"
              id="nextActionAt"
              value={nextActionAt}
              onChange={(e) => setNextActionAt(e.target.value)}
              className="input"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                disabled={submitting || deleting}
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={submitting || deleting}
            >
              Annuleren
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting || deleting}>
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Opslaan...
                </>
              ) : (
                isEditing ? 'Opslaan' : 'Toevoegen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
