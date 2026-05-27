import { motion } from 'framer-motion'
import { Scissors, Box } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface HomeTabProps {
  onSelect: (tab: 'crochet' | '3d') => void
}

export function HomeTab({ onSelect }: HomeTabProps) {
  const { allowedUser } = useAuth()
  const role = allowedUser?.role

  const showCrochet = role === 'admin' || role === 'crochet' || role === 'both'
  const show3d = role === 'admin' || role === '3d' || role === 'both'

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h2 className="text-lg font-semibold">Calculadoras</h2>
        <p className="text-sm text-muted-foreground mt-1">Escolha o tipo de precificação</p>
      </div>
      <div className="flex flex-col gap-4">
        {showCrochet && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelect('crochet')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border card-shadow hover:border-primary/30 hover:bg-primary/5 transition-all text-left w-full"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Crochê</p>
              <p className="text-sm text-muted-foreground">Calcule o preço de peças artesanais</p>
            </div>
          </motion.button>
        )}
        {show3d && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelect('3d')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border card-shadow hover:border-primary/30 hover:bg-primary/5 transition-all text-left w-full"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Box className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Impressão 3D</p>
              <p className="text-sm text-muted-foreground">Calcule o custo de impressões 3D</p>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  )
}
