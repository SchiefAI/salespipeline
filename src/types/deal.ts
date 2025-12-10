import type { StageId } from './stage'

export type DealType = 'klant' | 'partner'

export interface DealProspect {
  id: string
  deal_id: string
  name: string
  notes: string | null
  created_at: string
}

export interface Deal {
  id: string
  user_id: string
  stage_id: StageId
  organization: string
  deal_type: DealType
  amount: number | null
  next_action_at: string | null
  notes: string | null
  company_url: string | null
  contact_url: string | null
  last_activity_at: string
  created_at: string
  prospects?: DealProspect[]
}

export interface CreateDealData {
  organization: string
  deal_type: DealType
  amount: number | null
  stage_id: StageId
  next_action_at: string | null
  notes: string | null
  company_url: string | null
  contact_url: string | null
}

export interface UpdateDealData {
  organization?: string
  deal_type?: DealType
  amount?: number | null
  stage_id?: StageId
  next_action_at?: string | null
  notes?: string | null
  company_url?: string | null
  contact_url?: string | null
  last_activity_at?: string
}
