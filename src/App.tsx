import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Sun, Moon } from 'lucide-react'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { CrochetTab } from '@/components/tabs/CrochetTab'
import { ThreeDTab } from '@/components/tabs/ThreeDTab'
import { InsumosTab } from '@/components/tabs/InsumosTab'
import { MessageTab } from '@/components/tabs/MessageTab'
import { DashboardTab } from '@/components/tabs/DashboardTab'
import { AdminTab } from '@/components/tabs/AdminTab'
import { TabId, DashboardModel, CrochetCalcData, ThreeDCalcData, CostBreakdown } from '@/lib/types'

const DARK_KEY = 'cro3d_dark'
const ACTIVE_TAB_KEY = 'cro3d_tab'

const TAB_LABELS: Record<TabId, string> = {
  crochet: 'Crochê',
  '3d': 'Impressão 3D',
  insumos: 'Insumos',
  mensagem: 'Mensagem',
  dashboard: 'Dashboard',
  admin: 'Conta',
}

function AppContent() {
  const { user, allowedUser, loading } = useAuth()
  const role = allowedUser?.role

  const [activeTab, setActiveTab] = useState<TabId>(() => (localStorage.getItem(ACTIVE_TAB_KEY) as TabId) || 'crochet')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(DARK_KEY) === 'true')
  const [messagePrice, setMessagePrice] = useState<number | undefined>()
  const [dashboardPrefill, setDashboardPrefill] = useState<{
    type: 'crochet' | '3d'; price: number; breakdown: CostBreakdown
  } | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(DARK_KEY, String(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab)
  }, [activeTab])

  // Set default tab based on role only if there's no saved tab
  useEffect(() => {
    if (!role) return
    const saved = localStorage.getItem(ACTIVE_TAB_KEY) as TabId | null
    if (saved) return
    if (role === 'crochet') setActiveTab('crochet')
    else if (role === '3d') setActiveTab('3d')
    else if (role === 'admin') setActiveTab('dashboard')
    else setActiveTab('crochet')
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
        materials_cost: materialsCost,
        labor_cost: laborCost,
        subtotal: materialsCost + laborCost + extrasCost,
      },
    })
    setActiveTab('dashboard')
  }

  function handleSaveDashboardFromThreeD(data: ThreeDCalcData & { price: number }) {
    const totalH = data.timeHours + data.timeMinutes / 60
    const energy = ((data.printer?.watts || 0) / 1000) * totalH * data.kwh
    const filament = (data.gramsUsed / 1000) * data.filamentPricePerKg
    setDashboardPrefill({
      type: '3d',
      price: data.price,
      breakdown: {
        energy_cost: energy,
        filament_cost: filament,
        subtotal: energy + filament,
      },
    })
    setActiveTab('dashboard')
  }

  function handleUseModel(model: DashboardModel) {
    if (model.type === 'crochet') setActiveTab('crochet')
    else setActiveTab('3d')
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'crochet': return <CrochetTab onUsePrice={handleUsePrice} onSaveDashboard={handleSaveDashboardFromCrochet} />
      case '3d': return <ThreeDTab onUsePrice={handleUsePrice} onSaveDashboard={handleSaveDashboardFromThreeD} />
      case 'insumos': return <InsumosTab />
      case 'mensagem': return <MessageTab prefillPrice={messagePrice} />
      case 'dashboard': return <DashboardTab prefillData={dashboardPrefill} onUseModel={handleUseModel} />
      case 'admin': return <AdminTab />
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
            <span className="font-semibold text-sm">{TAB_LABELS[activeTab]}</span>
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
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 pb-24 md:pb-6 max-w-2xl md:max-w-none w-full mx-auto">
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
