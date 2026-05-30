import { motion } from 'framer-motion'
import {
  Scissors, Box, ShoppingBag, Package2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { TabId } from '@/lib/types'

interface HomeTabProps {
  onSelect: (tab: TabId) => void
}

function ActionCard({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] border border-border/50 bg-card text-center w-full aspect-square"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-7 w-7" style={{ color }} />
      </div>
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </motion.button>
  )
}


export function HomeTab({ onSelect }: HomeTabProps) {
  const { allowedUser } = useAuth()
  const role = allowedUser?.role

  const showCrochet = role === 'admin' || role === 'crochet' || role === 'both'
  const show3d = role === 'admin' || role === '3d' || role === 'both'

  if (!allowedUser) {
    return (
      <div className="space-y-6 pb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-[20px] bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">

      {/* Saudação */}
      <div className="pt-1">
        <h1 className="text-xl font-semibold" style={{ color: '#C4704F' }}>
          Olá, {allowedUser.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">O que vamos fazer hoje?</p>
      </div>

      {/* Calculadoras */}
      {(showCrochet || show3d) && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
            Calculadoras
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {showCrochet && (
              <ActionCard
                icon={Scissors}
                label="Crochê"
                color="#C4704F"
                onClick={() => onSelect('crochet')}
              />
            )}
            {show3d && (
              <ActionCard
                icon={Box}
                label="Impressão 3D"
                color="#7A9E7E"
                onClick={() => onSelect('3d')}
              />
            )}
          </div>
        </div>
      )}

      {/* Estoque */}
      {(showCrochet || show3d) && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
            Estoque
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {showCrochet && (
              <ActionCard
                icon={ShoppingBag}
                label="Estoque Crochê"
                color="#C4704F"
                onClick={() => onSelect('estoque-crochet')}
              />
            )}
            {show3d && (
              <ActionCard
                icon={Package2}
                label="Estoque 3D"
                color="#7A9E7E"
                onClick={() => onSelect('estoque-3d')}
              />
            )}
          </div>
        </div>
      )}


    </div>
  )
}
