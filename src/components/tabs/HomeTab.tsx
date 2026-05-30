import { motion } from 'framer-motion'
import {
  IconNeedleThread,
  IconCube3dSphere,
  IconBasket,
  IconLayersSubtract,
  IconArrowRight,
  IconChevronRight,
  type Icon,
} from '@tabler/icons-react'
import { useAuth } from '@/contexts/AuthContext'
import { TabId } from '@/lib/types'

interface HomeTabProps {
  onSelect: (tab: TabId) => void
}

interface NavCard {
  id: TabId
  label: string
  description: string
  pill: string
  IconComponent: Icon
  iconBg: string
  iconColor: string
  pillBg: string
  pillText: string
  arrowColor: string
}

const CROCHET_CALC: NavCard = {
  id: 'crochet',
  label: 'Crochê',
  description: 'Calcule o preço justo da sua peça artesanal',
  pill: 'Calculadora',
  IconComponent: IconNeedleThread,
  iconBg: '#FAECE7',
  iconColor: '#D85A30',
  pillBg: '#FAECE7',
  pillText: '#993C1D',
  arrowColor: '#D85A30',
}

const PRINT_3D_CALC: NavCard = {
  id: '3d',
  label: 'Impressão 3D',
  description: 'Calcule energia, filamento e mão de obra',
  pill: 'Calculadora',
  IconComponent: IconCube3dSphere,
  iconBg: '#E1F5EE',
  iconColor: '#1D9E75',
  pillBg: '#E1F5EE',
  pillText: '#0F6E56',
  arrowColor: '#1D9E75',
}

const CROCHET_STOCK: NavCard = {
  id: 'estoque-crochet',
  label: 'Estoque Crochê',
  description: 'Gerencie suas peças e quantidade disponível',
  pill: 'Estoque',
  IconComponent: IconBasket,
  iconBg: '#FAECE7',
  iconColor: '#D85A30',
  pillBg: '#FAECE7',
  pillText: '#993C1D',
  arrowColor: '#D85A30',
}

const PRINT_3D_STOCK: NavCard = {
  id: 'estoque-3d',
  label: 'Estoque 3D',
  description: 'Gerencie seus modelos impressos e estoque',
  pill: 'Estoque',
  IconComponent: IconLayersSubtract,
  iconBg: '#E1F5EE',
  iconColor: '#1D9E75',
  pillBg: '#E1F5EE',
  pillText: '#0F6E56',
  arrowColor: '#1D9E75',
}

function NavCardRow({ card, onClick }: { card: NavCard; onClick: () => void }) {
  const { IconComponent, iconBg, iconColor, pillBg, pillText, arrowColor } = card

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-[10px] md:gap-[14px] p-3 md:p-4 rounded-xl border text-left bg-white dark:bg-[var(--color-background-secondary,hsl(var(--card)))] card-clickable"
      style={{
        borderColor: 'var(--color-border-tertiary, hsl(var(--border)))',
        borderWidth: '0.5px',
      }}
    >
      {/* Icon */}
      <div
        className="shrink-0 flex items-center justify-center rounded-[10px] md:rounded-[12px]"
        style={{
          width: 40,
          height: 40,
          backgroundColor: iconBg,
        }}
      >
        <span className="hidden md:block">
          <IconComponent size={24} color={iconColor} />
        </span>
        <span className="block md:hidden">
          <IconComponent size={20} color={iconColor} />
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {/* Mobile: label + pill stacked */}
        <div className="flex md:hidden flex-row items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-medium leading-tight">{card.label}</span>
          <span
            className="text-[10px] px-[7px] py-[1px] rounded-[20px] leading-tight"
            style={{ backgroundColor: pillBg, color: pillText }}
          >
            {card.pill}
          </span>
        </div>

        {/* Desktop: label + pill on same row, description below */}
        <div className="hidden md:block">
          <div className="flex flex-row items-center gap-2">
            <span className="text-[14px] font-medium leading-tight">{card.label}</span>
            <span
              className="text-[11px] px-2 py-[2px] rounded-[20px] leading-tight"
              style={{ backgroundColor: pillBg, color: pillText }}
            >
              {card.pill}
            </span>
          </div>
          <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-secondary, hsl(var(--muted-foreground)))' }}>
            {card.description}
          </p>
        </div>
      </div>

      {/* Arrow */}
      <div className="shrink-0">
        <span className="block md:hidden">
          <IconChevronRight size={14} color="var(--color-text-tertiary, hsl(var(--muted-foreground)))" />
        </span>
        <span className="hidden md:block">
          <IconArrowRight size={18} color={arrowColor} />
        </span>
      </div>
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
          <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  const calcCards = [
    showCrochet && CROCHET_CALC,
    show3d && PRINT_3D_CALC,
  ].filter(Boolean) as NavCard[]

  const stockCards = [
    showCrochet && CROCHET_STOCK,
    show3d && PRINT_3D_STOCK,
  ].filter(Boolean) as NavCard[]

  return (
    <div className="pb-4" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Saudação */}
      <div className="pt-1">
        <h1 className="text-xl font-semibold" style={{ color: '#C4704F' }}>
          Olá, {allowedUser.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">O que vamos fazer hoje?</p>
      </div>

      {/* Calculadoras */}
      {calcCards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2
            className="text-xs font-semibold uppercase tracking-wide px-0.5"
            style={{ color: '#C4704F' }}
          >
            Calculadoras
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {calcCards.map(card => (
              <NavCardRow key={card.id} card={card} onClick={() => onSelect(card.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Estoque */}
      {stockCards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2
            className="text-xs font-semibold uppercase tracking-wide px-0.5"
            style={{ color: '#C4704F' }}
          >
            Estoque
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stockCards.map(card => (
              <NavCardRow key={card.id} card={card} onClick={() => onSelect(card.id)} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
