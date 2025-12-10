export interface Stage {
  id: string
  name: string
  position: number
  colorClass: string
}

// Hardcoded stages - simpler than database for single-user app
export const STAGES: Stage[] = [
  { id: 'suspect', name: 'Suspect', position: 1, colorClass: 'stage-suspect' },
  { id: 'prospect', name: 'Prospect', position: 2, colorClass: 'stage-prospect' },
  { id: 'afspraak', name: 'Afspraak', position: 3, colorClass: 'stage-afspraak' },
  { id: 'voorstel', name: 'Voorstel', position: 4, colorClass: 'stage-voorstel' },
  { id: 'volgende', name: 'Volgende ronde', position: 5, colorClass: 'stage-volgende' },
  { id: 'decision', name: 'Decision making', position: 6, colorClass: 'stage-decision' },
  { id: 'won', name: 'Won', position: 7, colorClass: 'stage-won' },
] as const

export type StageId = typeof STAGES[number]['id']
