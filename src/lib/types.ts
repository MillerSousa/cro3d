export type UserRole = 'admin' | 'crochet' | '3d' | 'both'

export interface AllowedUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

export interface DashboardModel {
  id: string
  user_id: string
  type: 'crochet' | '3d'
  name: string
  photo_url: string | null
  price_per_unit: number
  status: 'available' | 'in_production' | 'discontinued'
  materials: string | null
  yarn_used: string | null
  stl_link: string | null
  material_link: string | null
  youtube_link: string | null
  tutorial_link: string | null
  notes: string | null
  tips: string | null
  time_hours: number | null
  time_minutes: number | null
  cost_breakdown: CostBreakdown | null
  created_at: string
  updated_at: string
}

export interface CostBreakdown {
  materials_cost?: number
  labor_cost?: number
  energy_cost?: number
  filament_cost?: number
  extras?: { name: string; value: number }[]
  subtotal?: number
  company_margin?: number
  profit_margin?: number
}

export interface Insumo {
  id: string
  user_id: string
  name: string
  unit_price: number
  created_at: string
}

export interface Printer {
  id: string
  name: string
  watts: number
}

export type TabId = 'crochet' | '3d' | 'insumos' | 'mensagem' | 'dashboard' | 'admin'

export interface CrochetCalcData {
  yarns: YarnInput[]
  qty: number
  timeHours: number
  timeMinutes: number
  hourlyRate: number
  extras: ExtraInput[]
  companyMargin: number
  profitMargin: number
}

export interface YarnInput {
  id: string
  name: string
  skeinPrice: number
  gramsPerSkein: number
  gramsUsed: number
}

export interface ExtraInput {
  id: string
  name: string
  qty: number
  unitPrice: number
}

export interface ThreeDCalcData {
  printer: Printer | null
  timeHours: number
  timeMinutes: number
  gramsUsed: number
  filamentPricePerKg: number
  kwh: number
  extras: ExtraInput[]
  companyMargin: number
  profitMargin: number
}

export interface MessageData {
  productName: string
  totalValue: number
  entryPercent: number
  materials: string
  includeDiscount: boolean
  discountValue: number
  discountReason: string
  observations: string
  footerNote: string
}
