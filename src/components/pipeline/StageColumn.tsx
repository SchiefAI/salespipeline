import type { Deal } from '../../types/deal'
import type { Stage, StageId } from '../../types/stage'
import { DealCard } from './DealCard'

interface StageColumnProps {
  stage: Stage
  deals: Deal[]
  onStageChange: (dealId: string, newStageId: StageId) => void
  onEditDeal: (deal: Deal) => void
}

export function StageColumn({ stage, deals, onStageChange, onEditDeal }: StageColumnProps) {
  // Calculate total value of deals in this stage (alleen deals met bedrag)
  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0)

  const formatTotal = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className={`${stage.colorClass} rounded-t-xl px-4 py-3`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">{stage.name}</h2>
          <span className="text-xs font-medium text-slate-600 bg-white/50 px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-sm text-slate-600 mt-1">{formatTotal(totalValue)}</p>
        )}
      </div>

      {/* Cards container */}
      <div className="flex-1 bg-slate-100/50 rounded-b-xl p-2 space-y-2 min-h-[200px]">
        {deals.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-400 italic p-4">
            Geen deals
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onStageChange={onStageChange} onEdit={onEditDeal} />
          ))
        )}
      </div>
    </div>
  )
}
