import { motion } from 'framer-motion'
import {
  Scissors, Box, Package, MessageSquare, LayoutGrid, Settings
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { TabId } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NavItem {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ALL_TABS: NavItem[] = [
  { id: 'crochet', label: 'Crochê', icon: Scissors },
  { id: '3d', label: '3D', icon: Box },
  { id: 'insumos', label: 'Insumos', icon: Package },
  { id: 'mensagem', label: 'Mensagem', icon: MessageSquare },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'admin', label: 'Conta', icon: Settings },
]

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { allowedUser } = useAuth()
  const role = allowedUser?.role

  const visibleTabs = ALL_TABS.filter((tab) => {
    if (tab.id === 'admin') return true
    if (tab.id === 'crochet') return role === 'admin' || role === 'crochet' || role === 'both'
    if (tab.id === '3d') return role === 'admin' || role === '3d' || role === 'both'
    return true
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-bottom md:hidden">
      <div className="flex items-center justify-around px-1 pt-2 pb-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-lg -m-1"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={cn('h-5 w-5 relative z-10', isActive ? 'text-primary' : '')} />
              </div>
              <span className={cn('text-[10px] font-medium leading-none', isActive ? 'text-primary' : '')}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
