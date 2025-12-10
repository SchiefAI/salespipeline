import { useState } from 'react'
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
  const [isDragOver, setIsDragOver] = useState(false)

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set to false if we're actually leaving the container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const dealId = e.dataTransfer.getData('dealId')
    const fromStage = e.dataTransfer.getData('fromStage')

    if (dealId && fromStage !== stage.id) {
      onStageChange(dealId, stage.id)
    }
  }

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className={`${stage.colorClass} border-2 border-b-0 border-[#1a1a1a] px-4 py-3`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold ${stage.id === 'won' ? 'text-white' : 'text-[#1a1a1a]'}`}>{stage.name}</h2>
          <span className={`text-xs font-mono font-medium px-2 py-0.5 border ${stage.id === 'won' ? 'text-white border-white/30 bg-white/10' : 'text-[#1a1a1a] border-[#1a1a1a] bg-white/60'}`}>
            {deals.length}
          </span>
        </div>
        <p className={`text-sm mt-1 font-medium ${stage.id === 'won' ? 'text-white/70' : 'text-[#1a1a1a]/70'}`}>{formatTotal(totalValue)}</p>
      </div>

      {/* Cards container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 border-2 border-t-0 border-[#1a1a1a] p-2 space-y-2 min-h-[200px] transition-colors ${
          isDragOver
            ? 'bg-[#e05a28]/10 border-[#e05a28] border-t-2 -mt-[2px]'
            : 'bg-white/50'
        }`}
      >
        {deals.length === 0 ? (
          <div className={`h-full flex items-center justify-center text-sm font-mono uppercase tracking-wide p-4 ${
            isDragOver ? 'text-[#e05a28]' : 'text-slate-400'
          }`}>
            {isDragOver ? '// Drop hier' : '// Geen deals'}
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
