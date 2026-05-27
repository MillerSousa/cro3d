import { motion } from 'framer-motion'
import { Home, Package, MessageSquare, LayoutGrid, Settings } from 'lucide-react'
import { TabId } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NavItem {
  id: TabId
  icon: React.ComponentType<{ className?: string }>
}

const NAV_TABS: NavItem[] = [
  { id: 'home',      icon: Home },
  { id: 'insumos',   icon: Package },
  { id: 'dashboard', icon: LayoutGrid },
  { id: 'mensagem',  icon: MessageSquare },
  { id: 'admin',     icon: Settings },
]

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

function isHomeActive(activeTab: TabId): boolean {
  return activeTab === 'home' || activeTab === 'crochet' || activeTab === '3d'
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-bottom md:hidden">
      <div className="flex items-center justify-around px-2 pt-3 pb-2">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const active = tab.id === 'home' ? isHomeActive(activeTab) : tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center justify-center p-3 rounded-xl transition-all',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl -m-2"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={cn('h-6 w-6 relative z-10')} />
              </div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
