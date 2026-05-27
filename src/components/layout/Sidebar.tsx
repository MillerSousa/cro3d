import { motion } from 'framer-motion'
import {
  Scissors, Box, Package, MessageSquare, LayoutGrid, Settings, LogOut, Sun, Moon
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { TabId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavItem {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ALL_TABS: NavItem[] = [
  { id: 'crochet', label: 'Crochê', icon: Scissors },
  { id: '3d', label: 'Impressão 3D', icon: Box },
  { id: 'insumos', label: 'Insumos', icon: Package },
  { id: 'mensagem', label: 'Mensagem', icon: MessageSquare },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'admin', label: 'Conta', icon: Settings },
]

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  darkMode: boolean
  onToggleDark: () => void
}

export function Sidebar({ activeTab, onTabChange, darkMode, onToggleDark }: SidebarProps) {
  const { allowedUser, signOut } = useAuth()
  const role = allowedUser?.role

  const visibleTabs = ALL_TABS.filter((tab) => {
    if (tab.id === 'admin') return true
    if (tab.id === 'crochet') return role === 'admin' || role === 'crochet' || role === 'both'
    if (tab.id === '3d') return role === 'admin' || role === '3d' || role === 'both'
    return true
  })

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen sticky top-0 bg-card border-r border-border p-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C4704F] to-[#a85a3e] flex items-center justify-center">
          <span className="text-white font-bold text-sm">C3</span>
        </div>
        <span className="font-bold text-lg tracking-tight">Cro3D</span>
      </div>

      {/* User info */}
      <div className="mb-6 px-2 py-3 rounded-xl bg-muted/50">
        <p className="text-sm font-medium truncate">{allowedUser?.name}</p>
        <p className="text-xs text-muted-foreground truncate">{allowedUser?.email}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-2 mt-4">
        <Button variant="ghost" size="sm" onClick={onToggleDark} className="justify-start gap-3 text-muted-foreground">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {darkMode ? 'Modo claro' : 'Modo escuro'}
        </Button>
        <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-3 text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
