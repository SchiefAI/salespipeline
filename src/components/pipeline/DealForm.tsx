import { useState } from 'react'
import { STAGES, type StageId } from '../../types/stage'
import type { Deal, CreateDealData, UpdateDealData, DealType } from '../../types/deal'

interface ProspectInput {
  id?: string
  name: string
  notes: string
  isNew?: boolean
  toDelete?: boolean
}

interface DealFormProps {
  deal?: Deal
  onSubmit: (data: CreateDealData | UpdateDealData) => Promise<void>
  onClose: () => void
  onDelete?: () => Promise<void>
  onAddProspect?: (dealId: string, name: string, notes: string | null) => Promise<void>
  onDeleteProspect?: (prospectId: string) => Promise<void>
}

export function DealForm({ deal, onSubmit, onClose, onDelete, onAddProspect, onDeleteProspect }: DealFormProps) {
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
  const [notes, setNotes] = useState(deal?.notes ?? '')
  const [companyUrl, setCompanyUrl] = useState(deal?.company_url ?? '')
  const [contactUrl, setContactUrl] = useState(deal?.contact_url ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prospects state (alleen voor partners)
  const [prospects, setProspects] = useState<ProspectInput[]>(
    deal?.prospects?.map((p) => ({ id: p.id, name: p.name, notes: p.notes ?? '' })) ?? []
  )
  const [newProspectName, setNewProspectName] = useState('')
  const [newProspectNotes, setNewProspectNotes] = useState('')

  const handleAddProspect = () => {
    if (!newProspectName.trim()) return
    setProspects([...prospects, { name: newProspectName.trim(), notes: newProspectNotes.trim(), isNew: true }])
    setNewProspectName('')
    setNewProspectNotes('')
  }

  const handleRemoveProspect = (index: number) => {
    const prospect = prospects[index]
    if (prospect.id) {
      // Mark existing prospect for deletion
      setProspects(prospects.map((p, i) => (i === index ? { ...p, toDelete: true } : p)))
    } else {
      // Remove new prospect from list
      setProspects(prospects.filter((_, i) => i !== index))
    }
  }

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
        notes: notes.trim() || null,
        company_url: companyUrl.trim() || null,
        contact_url: contactUrl.trim() || null,
      })

      // Handle prospect changes voor bestaande deals
      if (isEditing && deal && dealType === 'partner') {
        // Delete marked prospects
        for (const prospect of prospects.filter((p) => p.toDelete && p.id)) {
          if (onDeleteProspect) await onDeleteProspect(prospect.id!)
        }
        // Add new prospects
        for (const prospect of prospects.filter((p) => p.isNew && !p.toDelete)) {
          if (onAddProspect) await onAddProspect(deal.id, prospect.name, prospect.notes || null)
        }
      }

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
      <div className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0_#1a1a1a] w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#1a1a1a]">
          <h2 className="text-lg font-semibold text-[#1a1a1a]">
            {isEditing ? '// Deal bewerken' : '// Nieuwe deal'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#f5f1eb] transition-colors border-2 border-transparent hover:border-[#1a1a1a]"
          >
            <svg className="w-5 h-5 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-500 text-sm text-red-700">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="companyUrl" className="label">
                Website <span className="text-slate-400 font-normal">— optioneel</span>
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <input
                  type="url"
                  id="companyUrl"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  className="input pl-9"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label htmlFor="contactUrl" className="label">
                Contact <span className="text-slate-400 font-normal">— optioneel</span>
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="url"
                  id="contactUrl"
                  value={contactUrl}
                  onChange={(e) => setContactUrl(e.target.value)}
                  className="input pl-9"
                  placeholder="LinkedIn, e-mail..."
                />
              </div>
            </div>
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
                />
                <span className="text-sm text-[#1a1a1a]">Klant</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dealType"
                  value="partner"
                  checked={dealType === 'partner'}
                  onChange={() => setDealType('partner')}
                />
                <span className="text-sm text-[#1a1a1a]">Partner</span>
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

          <div>
            <label htmlFor="notes" className="label">
              Opmerkingen <span className="text-slate-400 font-normal">— optioneel</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[100px] resize-y"
              placeholder="Notities, context, to-do's..."
              rows={4}
            />
          </div>

          {/* Prospects sectie (alleen voor partners) */}
          {dealType === 'partner' && isEditing && (
            <div className="border-t border-slate-200 pt-4">
              <label className="label">Prospects (tips via partner)</label>

              {/* Bestaande prospects */}
              {prospects.filter((p) => !p.toDelete).length > 0 && (
                <div className="space-y-2 mb-3">
                  {prospects
                    .map((prospect, index) => ({ prospect, index }))
                    .filter(({ prospect }) => !prospect.toDelete)
                    .map(({ prospect, index }) => (
                      <div
                        key={prospect.id ?? `new-${index}`}
                        className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{prospect.name}</p>
                          {prospect.notes && (
                            <p className="text-xs text-slate-500 truncate">{prospect.notes}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProspect(index)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                          title="Verwijderen"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Nieuwe prospect toevoegen */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={newProspectName}
                  onChange={(e) => setNewProspectName(e.target.value)}
                  className="input"
                  placeholder="Naam prospect"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProspectNotes}
                    onChange={(e) => setNewProspectNotes(e.target.value)}
                    className="input flex-1"
                    placeholder="Notities (optioneel)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddProspect()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddProspect}
                    disabled={!newProspectName.trim()}
                    className="btn btn-secondary shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info voor nieuwe partner deals */}
          {dealType === 'partner' && !isEditing && (
            <p className="text-xs text-slate-500 italic">
              Prospects kunnen worden toegevoegd na het aanmaken van de deal.
            </p>
          )}

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
