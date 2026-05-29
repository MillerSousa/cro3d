export type UserRole = 'admin' | 'crochet' | '3d' | 'both'

export interface AllowedUser {
  id: string
  email: string
  name: string
  role: UserRole
  auth_user_id?: string | null
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
  crochet_recipe: string | null
  time_hours: number | null
  time_minutes: number | null
  cost_breakdown: CostBreakdown | null
  created_at: string
  updated_at: string
}

export interface CostBreakdown {
  // Valores computados para exibição
  materials_cost?: number
  labor_cost?: number
  energy_cost?: number
  filament_cost?: number
  extras?: { name: string; value: number }[]
  subtotal?: number
  company_margin?: number
  profit_margin?: number
  // Snapshot completo da calculadora para restauração
  type?: 'crochet' | '3d'
  // Crochê
  yarns?: { name: string; model_name?: string; brand_name?: string; price_per_skein: number; grams_per_skein: number; grams_used: number }[]
  quantity?: number
  time_hours?: number
  time_minutes?: number
  hourly_rate?: number
  additional_costs?: { name: string; quantity: number; unit_price: number }[]
  margin_company?: number
  margin_profit?: number
  // 3D
  printer_id?: string
  printer_name?: string
  mode?: 'single' | 'multiple'
  kwh_price?: number
  filament_grams?: number
  filament_price_per_kg?: number
  pieces?: { name: string; grams: number; color: string; filament_name: string; brand_name?: string; filament_model_name?: string; price_per_kg: number; time_hours?: number; time_minutes?: number }[]
  // Single-piece 3D
  singleFilamentId?: string | null
  single_filament_name?: string
  single_brand_name?: string
  single_filament_model_name?: string
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
  user_id?: string
  name: string
  wattage: number
  created_at?: string
}

export interface FilamentBrand {
  id: string
  name: string
  website_url: string
  logo_url?: string | null
  created_at?: string
}

export interface YarnBrand {
  id: string
  name: string
  website_url: string
  logo_url?: string | null
  created_at?: string
}

export interface Filament {
  id: string
  brand_id?: string | null
  name: string
  price_per_kg: number
  created_at?: string
  brand?: FilamentBrand | null
}

export interface PrintPiece {
  id: string
  name: string
  gramsUsed: number
  color: string
  filamentId: string | null
  filamentName?: string
  filamentBrandName?: string
  filamentModelName?: string
  filamentPricePerKg: number
  useGlobalPrice: boolean
  timeHours: number
  timeMinutes: number
}

export type TabId = 'home' | 'crochet' | '3d' | 'insumos' | 'mensagem' | 'dashboard' | 'admin'

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
  modelName: string
  brandId: string | null
  brandName?: string
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
  pieces?: PrintPiece[]
  // Single-piece filament info
  singleFilamentId?: string | null
  singleFilamentName?: string
  singleFilamentBrandName?: string
  singleFilamentModelName?: string
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
