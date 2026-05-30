import { motion } from 'framer-motion'
import { Home, Package, LayoutGrid, MessageSquare, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { TabId } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NavItem {
  id: TabId
  icon: React.ComponentType<{ className?: string }>
}

const ALL_NAV: NavItem[] = [
  { id: 'home',      icon: Home },
  { id: 'insumos',   icon: Package },
  { id: 'dashboard', icon: LayoutGrid },
  { id: 'mensagem',  icon: MessageSquare },
  { id: 'admin',     icon: Settings },
]

function getNavItems(role: string | undefined): NavItem[] {
  return ALL_NAV.filter(({ id }) => {
    if (id === 'home' || id === 'insumos' || id === 'mensagem' || id === 'dashboard') return true
    if (id === 'admin') return role === 'admin'
    return false
  })
}

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { allowedUser } = useAuth()
  const items = getNavItems(allowedUser?.role)

  // Home stays highlighted when on estoque sub-pages
  function isActive(id: TabId) {
    if (id === 'home') return activeTab === 'home' || activeTab === 'estoque-crochet' || activeTab === 'estoque-3d'
    return activeTab === id
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-bottom md:hidden">
      <div className="flex items-center justify-around px-1 pt-3 pb-2">
        {items.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.id)
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center justify-center p-2.5 rounded-xl transition-all',
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
                <Icon className="h-5 w-5 relative z-10" />
              </div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
