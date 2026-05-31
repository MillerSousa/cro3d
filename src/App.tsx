import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Sun, Moon } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { HomeTab } from '@/components/tabs/HomeTab'
import { CrochetTab } from '@/components/tabs/CrochetTab'
import { ThreeDTab } from '@/components/tabs/ThreeDTab'
import { InsumosTab } from '@/components/tabs/InsumosTab'
import { MessageTab } from '@/components/tabs/MessageTab'
import { DashboardTab } from '@/components/tabs/DashboardTab'
import { AdminTab } from '@/components/tabs/AdminTab'
import { EstoqueTab } from '@/components/tabs/EstoqueTab'
import { FabricarPage } from '@/components/pages/FabricarPage'
import { TabId, DashboardModel, CrochetCalcData, ThreeDCalcData, CostBreakdown } from '@/lib/types'

const DARK_KEY = 'cro3d_dark'
const ACTIVE_TAB_KEY = 'cro3d_tab'

const TAB_LABELS: Record<TabId, string> = {
  home: 'Home',
  crochet: 'Crochê',
  '3d': 'Impressão 3D',
  insumos: 'Insumos',
  mensagem: 'Mensagem',
  dashboard: 'Dashboard',
  admin: 'Configurações',
  'estoque-crochet': 'Estoque Crochê',
  'estoque-3d': 'Estoque 3D',
}

function AppContent() {
  const { user, allowedUser, loading } = useAuth()
  const role = allowedUser?.role

  const [activeTab, setActiveTab] = useState<TabId>(() => (localStorage.getItem(ACTIVE_TAB_KEY) as TabId) || 'home')
  const prevRoleRef = useRef<string | null | undefined>(undefined)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(DARK_KEY) === 'true')
  const [messagePrice, setMessagePrice] = useState<number | undefined>()
  const [dashboardPrefill, setDashboardPrefill] = useState<{
    type: 'crochet' | '3d'; price: number; breakdown: CostBreakdown
  } | null>(null)
  const [fabricarModel, setFabricarModel] = useState<DashboardModel | null>(null)
  const [crochetPrefill, setCrochetPrefill] = useState<CostBreakdown | null>(null)
  const [threeDPrefill, setThreeDPrefill] = useState<CostBreakdown | null>(null)
  const [adminRedirectContext, setAdminRedirectContext] = useState<'model' | 'filament' | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(DARK_KEY, String(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab)
  }, [activeTab])

  // Redireciona para Home quando o admin altera o role deste usuário
  useEffect(() => {
    const currentRole = allowedUser?.role ?? null
    if (prevRoleRef.current !== undefined && prevRoleRef.current !== currentRole) {
      setActiveTab('home')
    }
    prevRoleRef.current = currentRole
  }, [allowedUser?.role])

  // Set default tab based on role only if there's no saved tab
  useEffect(() => {
    if (!role) return
    const saved = localStorage.getItem(ACTIVE_TAB_KEY) as TabId | null
    if (saved) return
    if (role === 'admin') setActiveTab('dashboard')
    else setActiveTab('home')
  }, [role])

  // Spinner inicial (getSession ainda não resolveu)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C4704F] to-[#a85a3e] flex items-center justify-center">
            <span className="text-white font-bold text-base">C3</span>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Sem sessão → login
  if (!user) return <LoginScreen />

  if (!allowedUser) return <LoginScreen />

  function handleUsePrice(price: number) {
    setMessagePrice(price)
    setActiveTab('mensagem')
  }

  function handleSaveDashboardFromCrochet(data: CrochetCalcData & { price: number }) {
    const materialsCost = data.yarns.reduce((s, y) => s + (y.gramsUsed / y.gramsPerSkein) * y.skeinPrice, 0) / data.qty
    const laborCost = ((data.timeHours + data.timeMinutes / 60) * data.hourlyRate) / data.qty
    const extrasCost = data.extras.reduce((s, e) => s + e.qty * e.unitPrice, 0) / data.qty
    setDashboardPrefill({
      type: 'crochet',
      price: data.price,
      breakdown: {
        // Valores computados para exibição
        materials_cost: materialsCost,
        labor_cost: laborCost,
        extras: data.extras.filter(e => e.name.trim()).map(e => ({ name: e.name, value: (e.qty * e.unitPrice) / data.qty })),
        subtotal: materialsCost + laborCost + extrasCost,
        company_margin: data.companyMargin,
        profit_margin: data.profitMargin,
        // Snapshot completo para restaurar a calculadora
        type: 'crochet',
        yarns: data.yarns.map(y => ({ name: y.name, model_name: y.modelName, brand_name: y.brandName, price_per_skein: y.skeinPrice, grams_per_skein: y.gramsPerSkein, grams_used: y.gramsUsed })),
        quantity: data.qty,
        time_hours: data.timeHours,
        time_minutes: data.timeMinutes,
        hourly_rate: data.hourlyRate,
        additional_costs: data.extras.filter(e => e.name.trim()).map(e => ({ name: e.name, quantity: e.qty, unit_price: e.unitPrice })),
        margin_company: data.companyMargin,
        margin_profit: data.profitMargin,
      },
    })
    setActiveTab('dashboard')
  }

  function handleSaveDashboardFromThreeD(data: ThreeDCalcData & { price: number }) {
    const r2 = (v: number) => Math.round(v * 100) / 100
    const totalH = data.timeHours + data.timeMinutes / 60
    const energy = r2(((data.printer?.wattage || 0) / 1000) * totalH * data.kwh)
    const filament = r2((data.gramsUsed / 1000) * data.filamentPricePerKg)
    const extrasCost = r2(data.extras.reduce((s, e) => s + e.qty * e.unitPrice, 0))
    const isMulti = !!(data.pieces && data.pieces.length > 0)
    setDashboardPrefill({
      type: '3d',
      price: data.price,
      breakdown: {
        // Valores computados para exibição
        energy_cost: energy,
        filament_cost: filament,
        extras: data.extras.filter(e => e.name.trim()).map(e => ({ name: e.name, value: r2(e.qty * e.unitPrice) })),
        subtotal: r2(energy + filament + extrasCost),
        company_margin: data.companyMargin,
        profit_margin: data.profitMargin,
        // Snapshot completo para restaurar a calculadora
        type: '3d',
        printer_id: data.printer?.id || '',
        printer_name: data.printer?.name || '',
        mode: isMulti ? 'multiple' : 'single',
        time_hours: data.timeHours,
        time_minutes: data.timeMinutes,
        kwh_price: data.kwh,
        filament_grams: data.gramsUsed,
        filament_price_per_kg: data.filamentPricePerKg,
        pieces: data.pieces?.map(p => ({
          name: p.name,
          grams: p.gramsUsed,
          color: p.color,
          filament_name: p.filamentName || '',
          brand_name: p.filamentBrandName || '',
          filament_model_name: p.filamentModelName || '',
          price_per_kg: p.filamentPricePerKg,
          time_hours: p.timeHours,
          time_minutes: p.timeMinutes,
        })),
        single_filament_name: data.singleFilamentName || '',
        single_brand_name: data.singleFilamentBrandName || '',
        single_filament_model_name: data.singleFilamentModelName || '',
        singleFilamentId: data.singleFilamentId,
        additional_costs: data.extras.filter(e => e.name.trim()).map(e => ({ name: e.name, quantity: e.qty, unit_price: e.unitPrice })),
        margin_company: data.companyMargin,
        margin_profit: data.profitMargin,
      },
    })
    setActiveTab('dashboard')
  }

  function handleUseModel(model: DashboardModel) {
    const cb = model.cost_breakdown
    if (model.type === 'crochet') {
      setActiveTab('crochet')
      if (cb?.type === 'crochet') setCrochetPrefill(cb)
    } else {
      setActiveTab('3d')
      if (cb?.type === '3d') setThreeDPrefill(cb)
    }
    setFabricarModel(null)
    if (cb?.type) toast.success(`Calculadora preenchida com os dados de "${model.name}"`)
  }

  function handleFabricar(model: DashboardModel) {
    setFabricarModel(model)
  }

  // Página "Fabricar agora" — renderiza sobre tudo quando ativa
  if (fabricarModel) {
    return (
      <FabricarPage
        model={fabricarModel}
        onBack={() => setFabricarModel(null)}
        onUseInCalc={handleUseModel}
      />
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab onSelect={setActiveTab} />
      case 'estoque-crochet': return <EstoqueTab type="crochet" onBack={() => setActiveTab('home')} />
      case 'estoque-3d': return <EstoqueTab type="3d" onBack={() => setActiveTab('home')} />
      case 'crochet': return (
        <CrochetTab
          onUsePrice={handleUsePrice}
          onSaveDashboard={handleSaveDashboardFromCrochet}
          prefillData={crochetPrefill}
          onPrefillConsumed={() => setCrochetPrefill(null)}
        />
      )
      case '3d': return (
        <ThreeDTab
          onUsePrice={handleUsePrice}
          onSaveDashboard={handleSaveDashboardFromThreeD}
          prefillData={threeDPrefill}
          onPrefillConsumed={() => setThreeDPrefill(null)}
          onNavigateAdmin={(ctx) => { setAdminRedirectContext(ctx); setActiveTab('admin') }}
        />
      )
      case 'insumos': return <InsumosTab />
      case 'mensagem': return <MessageTab prefillPrice={messagePrice} />
      case 'dashboard': return (
        <DashboardTab
          prefillData={dashboardPrefill}
          onUseModel={handleUseModel}
          onFabricar={handleFabricar}
        />
      )
      case 'admin': return (
        <AdminTab
          redirectContext={adminRedirectContext}
          onBack={() => { setAdminRedirectContext(null); setActiveTab('3d') }}
        />
      )
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(p => !p)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#C4704F] to-[#a85a3e] flex items-center justify-center">
              <span className="text-white font-bold text-xs">C3</span>
            </div>
            <span className="font-semibold text-sm text-primary">{TAB_LABELS[activeTab]}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(p => !p)}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {allowedUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 pb-24 md:pb-6 max-w-2xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '14px',
            fontSize: '14px',
          },
        }}
      />
      <AppContent />
    </AuthProvider>
  )
}
