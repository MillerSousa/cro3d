import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Box, Pencil,
  SlidersHorizontal, Package, TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn, formatCurrency } from '@/lib/utils'
import { ExtraInput, Printer, ThreeDCalcData, Insumo, Filament, FilamentModel, PrintPiece, CostBreakdown } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

function genId() { return Math.random().toString(36).slice(2) }
const KWH_KEY = 'cro3d_kwh'

function newPiece(): PrintPiece {
  return { id: genId(), name: '', gramsUsed: 0, color: '', filamentId: null, filamentBrandName: undefined, filamentModelName: '', filamentPricePerKg: 0, useGlobalPrice: true, timeHours: 0, timeMinutes: 0 }
}

function BrandLogo({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!logoUrl || failed) {
    return (
      <div className={cn('rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0', className || 'w-6 h-6')}>
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return <img src={logoUrl} alt={name} className={cn('rounded-lg object-cover shrink-0', className || 'w-6 h-6')} onError={() => setFailed(true)} />
}

interface ThreeDTabProps {
  onUsePrice: (price: number, productName?: string) => void
  onSaveDashboard: (data: ThreeDCalcData & { price: number }) => void
  prefillData?: CostBreakdown | null
  onPrefillConsumed?: () => void
  onNavigateAdmin?: (context: 'model' | 'filament') => void
}

export function ThreeDTab({ onUsePrice, onSaveDashboard, prefillData, onPrefillConsumed, onNavigateAdmin }: ThreeDTabProps) {
  const { user } = useAuth()

  // ── Impressoras ─────────────────────────────────────────────
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loadingPrinters, setLoadingPrinters] = useState(true)
  const [selectedPrinterId, setSelectedPrinterId] = useState('')
  const [showPrinterForm, setShowPrinterForm] = useState(false)
  const [editPrinter, setEditPrinter] = useState<Printer | null>(null)
  const [printerName, setPrinterName] = useState('')
  const [printerWattage, setPrinterWattage] = useState(0)
  const [confirmDeletePrinterId, setConfirmDeletePrinterId] = useState<string | null>(null)

  // ── Filamentos ──────────────────────────────────────────────
  const [filaments, setFilaments] = useState<Filament[]>([])
  const [filamentModels, setFilamentModels] = useState<FilamentModel[]>([])

  // ── Modo ────────────────────────────────────────────────────
  const [multiPieceMode, setMultiPieceMode] = useState(false)

  // ── Parâmetros (peça única) ──────────────────────────────────
  const [timeHours, setTimeHours] = useState(0)
  const [timeMinutes, setTimeMinutes] = useState(0)
  const [gramsUsed, setGramsUsed] = useState(0)
  const [filamentPricePerKg, setFilamentPricePerKg] = useState(0)
  const [singleFilamentId, setSingleFilamentId] = useState<string | null>(null)
  const [singleFilamentModelName, setSingleFilamentModelName] = useState('')
  const [singleUseGlobalPrice, setSingleUseGlobalPrice] = useState(true)

  // ── Peças (múltiplas) ────────────────────────────────────────
  const [pieces, setPieces] = useState<PrintPiece[]>([newPiece()])

  // ── Compartilhados ───────────────────────────────────────────
  const [kwh, setKwh] = useState(() => parseFloat(localStorage.getItem(KWH_KEY) || '0') || 0)
  const [companyMargin, setCompanyMargin] = useState(0)
  const [profitMargin, setProfitMargin] = useState(0)
  const [extras, setExtras] = useState<ExtraInput[]>([])
  const [showExtras, setShowExtras] = useState(false)
  const [insumos, setInsumos] = useState<Insumo[]>([])

  useEffect(() => {
    if (user) {
      fetchPrinters()
      fetchFilaments()
      fetchFilamentModels()
      supabase.from('insumos').select('*').eq('user_id', user.id).then(({ data }) => {
        if (data) setInsumos(data as Insumo[])
      })
    }
  }, [user])

  useEffect(() => { localStorage.setItem(KWH_KEY, kwh.toString()) }, [kwh])

  // Restaurar calculadora a partir do snapshot do modelo
  useEffect(() => {
    if (!prefillData || prefillData.type !== '3d') return
    if (prefillData.printer_id) setSelectedPrinterId(prefillData.printer_id)
    const isMulti = prefillData.mode === 'multiple'
    setMultiPieceMode(isMulti)
    if (prefillData.kwh_price != null) setKwh(prefillData.kwh_price)
    if (prefillData.margin_company != null) setCompanyMargin(prefillData.margin_company)
    if (prefillData.margin_profit != null) setProfitMargin(prefillData.margin_profit)
    if (prefillData.additional_costs && prefillData.additional_costs.length > 0) {
      setExtras(prefillData.additional_costs.map(c => ({
        id: genId(),
        name: c.name,
        qty: c.quantity,
        unitPrice: c.unit_price,
      })))
      setShowExtras(true)
    }
    if (isMulti && prefillData.pieces && prefillData.pieces.length > 0) {
      setPieces(prefillData.pieces.map(p => ({
        id: genId(),
        name: p.name,
        gramsUsed: p.grams,
        color: p.color,
        filamentId: null,
        filamentName: p.filament_name || undefined,
        filamentPricePerKg: p.price_per_kg,
        useGlobalPrice: false,
        timeHours: p.time_hours || 0,
        timeMinutes: p.time_minutes || 0,
      })))
    } else {
      if (prefillData.time_hours != null) setTimeHours(prefillData.time_hours)
      if (prefillData.time_minutes != null) setTimeMinutes(prefillData.time_minutes)
      if (prefillData.filament_grams != null) setGramsUsed(prefillData.filament_grams)
      if (prefillData.filament_price_per_kg != null) setFilamentPricePerKg(prefillData.filament_price_per_kg)
      if (prefillData.singleFilamentId !== undefined) setSingleFilamentId(prefillData.singleFilamentId || null)
      if (prefillData.single_filament_model_name) setSingleFilamentModelName(prefillData.single_filament_model_name)
    }
    onPrefillConsumed?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillData])

  // ── Impressoras CRUD ─────────────────────────────────────────
  async function fetchPrinters() {
    if (!user) return
    setLoadingPrinters(true)
    const { data, error } = await supabase
      .from('printers').select('*').eq('user_id', user.id).order('name')

    if (error) { toast.error('Erro ao carregar impressoras'); setLoadingPrinters(false); return }

    if (data && data.length === 0) {
      const { data: newP } = await supabase.from('printers')
        .insert({ user_id: user.id, name: 'Bambu Lab A1 + AMS', wattage: 140 })
        .select().single()
      if (newP) { setPrinters([newP as Printer]); setSelectedPrinterId(newP.id) }
    } else if (data) {
      const list = data as Printer[]
      setPrinters(list)
      setSelectedPrinterId(list[0].id)
    }
    setLoadingPrinters(false)
  }

  async function savePrinterDB() {
    if (!printerName.trim() || !user) return
    if (editPrinter) {
      const { error } = await supabase.from('printers')
        .update({ name: printerName, wattage: printerWattage }).eq('id', editPrinter.id)
      if (error) { toast.error('Erro ao salvar impressora'); return }
      setPrinters(p => p.map(x => x.id === editPrinter.id ? { ...x, name: printerName, wattage: printerWattage } : x))
      toast.success('Impressora atualizada')
    } else {
      const { data, error } = await supabase.from('printers')
        .insert({ user_id: user.id, name: printerName, wattage: printerWattage })
        .select().single()
      if (error || !data) { toast.error('Erro ao salvar impressora'); return }
      const newP = data as Printer
      setPrinters(p => [...p, newP])
      setSelectedPrinterId(newP.id)
      toast.success('Impressora adicionada')
    }
    setPrinterName(''); setPrinterWattage(0); setEditPrinter(null); setShowPrinterForm(false)
  }

  async function deletePrinterDB(id: string) {
    const { error } = await supabase.from('printers').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir impressora'); return }
    const remaining = printers.filter(x => x.id !== id)
    setPrinters(remaining)
    if (selectedPrinterId === id) setSelectedPrinterId(remaining[0]?.id || '')
    setConfirmDeletePrinterId(null)
    toast.success('Impressora removida')
  }

  function openEditPrinter(p: Printer) {
    setEditPrinter(p); setPrinterName(p.name); setPrinterWattage(p.wattage); setShowPrinterForm(true)
  }

  // ── Filamentos ───────────────────────────────────────────────
  async function fetchFilaments() {
    const { data } = await supabase
      .from('filaments')
      .select('*, brand:filament_brands(id, name, logo_url)')
      .order('name')
    if (data) setFilaments(data as Filament[])
  }

  async function fetchFilamentModels() {
    const { data } = await supabase.from('filament_models').select('*').order('name')
    if (data) setFilamentModels(data as FilamentModel[])
  }

  // ── Peças helpers ────────────────────────────────────────────
  function updatePiece(id: string, field: keyof PrintPiece, value: string | number | boolean | null) {
    setPieces(p => p.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  function getPieceEffectivePrice(piece: PrintPiece): number {
    if (piece.useGlobalPrice && piece.filamentId) {
      return filaments.find(f => f.id === piece.filamentId)?.price_per_kg || 0
    }
    return piece.filamentPricePerKg
  }

  function getPieceFilamentCost(piece: PrintPiece): number {
    return (piece.gramsUsed / 1000) * getPieceEffectivePrice(piece)
  }

  function getPieceEnergyCost(piece: PrintPiece): number {
    return ((selectedPrinter?.wattage || 0) / 1000) * (piece.timeHours + piece.timeMinutes / 60) * kwh
  }

  function getPieceCost(piece: PrintPiece): number {
    return getPieceFilamentCost(piece) + getPieceEnergyCost(piece)
  }

  // ── Extras ───────────────────────────────────────────────────
  function addExtra() { setExtras(p => [...p, { id: genId(), name: '', qty: 1, unitPrice: 0 }]); setShowExtras(true) }
  function removeExtra(id: string) { setExtras(p => p.filter(e => e.id !== id)) }
  function updateExtra(id: string, field: keyof ExtraInput, value: string | number) {
    setExtras(p => p.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  // ── Cálculos ─────────────────────────────────────────────────
  const selectedPrinter = printers.find(p => p.id === selectedPrinterId) || null
  const singleFilament = filaments.find(f => f.id === singleFilamentId) || null
  const effectiveSinglePrice = (singleFilamentId && singleUseGlobalPrice)
    ? (singleFilament?.price_per_kg || 0)
    : filamentPricePerKg
  const totalHours = timeHours + timeMinutes / 60
  const energyCost = multiPieceMode
    ? pieces.reduce((sum, p) => sum + getPieceEnergyCost(p), 0)
    : ((selectedPrinter?.wattage || 0) / 1000) * totalHours * kwh
  const filamentCost = multiPieceMode
    ? pieces.reduce((sum, p) => sum + getPieceFilamentCost(p), 0)
    : (gramsUsed / 1000) * effectiveSinglePrice
  const extrasCost = extras.reduce((sum, e) => sum + e.qty * e.unitPrice, 0)
  const subtotal = energyCost + filamentCost + extrasCost
  const companyAdd = subtotal * (companyMargin / 100)
  const profitAdd = (subtotal + companyAdd) * (profitMargin / 100)
  const suggestedPrice = subtotal + companyAdd + profitAdd

  function handleUsePrice() { onUsePrice(suggestedPrice); toast.success('Preço adicionado à mensagem!') }

  function handleSaveDashboard() {
    const totalGrams = multiPieceMode ? pieces.reduce((s, p) => s + p.gramsUsed, 0) : gramsUsed
    const effectivePricePerKg = (multiPieceMode && totalGrams > 0)
      ? (filamentCost * 1000) / totalGrams
      : filamentPricePerKg
    const totalPieceMinutes = multiPieceMode
      ? pieces.reduce((s, p) => s + p.timeHours * 60 + p.timeMinutes, 0)
      : timeHours * 60 + timeMinutes
    const piecesWithNames = multiPieceMode ? pieces.map(p => {
      const fil = filaments.find(f => f.id === p.filamentId)
      return {
        ...p,
        filamentName: fil?.name || p.filamentName || '',
        filamentBrandName: fil?.brand?.name || p.filamentBrandName || '',
      }
    }) : undefined
    onSaveDashboard({
      printer: selectedPrinter,
      timeHours: Math.floor(totalPieceMinutes / 60),
      timeMinutes: totalPieceMinutes % 60,
      gramsUsed: totalGrams,
      filamentPricePerKg: effectivePricePerKg,
      kwh, extras, companyMargin, profitMargin,
      price: suggestedPrice,
      pieces: piecesWithNames,
      singleFilamentId,
      singleFilamentName: singleFilament?.name || '',
      singleFilamentBrandName: singleFilament?.brand?.name || '',
      singleFilamentModelName,
    })
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-4">

      {/* Impressora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Box className="h-4 w-4" />
            Impressora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingPrinters ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : (
            <>
              <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar impressora" />
                </SelectTrigger>
                <SelectContent>
                  {printers.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.wattage}W)</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                {printers.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/40 text-sm">
                    <span>{p.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEditPrinter(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmDeletePrinterId(p.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline" size="sm"
                onClick={() => { setEditPrinter(null); setPrinterName(''); setPrinterWattage(0); setShowPrinterForm(true) }}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" /> Nova impressora
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Parâmetros da impressão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <SlidersHorizontal className="h-4 w-4" />
            Parâmetros da Impressão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">

          {/* Toggle peça única / múltiplas */}
          <div className="flex rounded-xl bg-muted p-0.5 gap-0.5">
            <button
              onClick={() => setMultiPieceMode(false)}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-lg font-medium transition-all',
                !multiPieceMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Peça única
            </button>
            <button
              onClick={() => setMultiPieceMode(true)}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-lg font-medium transition-all',
                multiPieceMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Múltiplas peças
            </button>
          </div>

          {/* Tempo — apenas no modo peça única */}
          {!multiPieceMode && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Tempo — horas</Label>
                <Input type="number" min="0" value={timeHours || ''} onChange={e => setTimeHours(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Minutos</Label>
                <Input type="number" min="0" max="59" value={timeMinutes || ''} onChange={e => setTimeMinutes(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
              </div>
            </div>
          )}

          {/* Peça única */}
          {!multiPieceMode && (
            <div className="space-y-3">
              {/* Filamento */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Filamento utilizado</Label>
                  <button onClick={() => onNavigateAdmin?.('filament')} className="text-[11px] text-primary font-medium hover:underline">
                    + Adicionar filamento
                  </button>
                </div>
                <Select
                  value={singleFilamentId || 'none'}
                  onValueChange={v => {
                    const id = v === 'none' ? null : v
                    setSingleFilamentId(id)
                    setSingleUseGlobalPrice(!!id)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar filamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem filamento</SelectItem>
                    {filaments.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}{f.brand ? ` — ${f.brand.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exibição da marca selecionada */}
              {singleFilamentId && singleFilament?.brand && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
                  <BrandLogo name={singleFilament.brand.name} logoUrl={singleFilament.brand.logo_url} className="w-7 h-7" />
                  <span className="text-xs font-medium">{singleFilament.brand.name}</span>
                </div>
              )}

              {/* Modelo do filamento */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Modelo do filamento</Label>
                  <button onClick={() => onNavigateAdmin?.('model')} className="text-[11px] text-primary font-medium hover:underline">
                    + Adicionar modelo
                  </button>
                </div>
                <Select
                  value={singleFilamentModelName || 'none'}
                  onValueChange={v => setSingleFilamentModelName(v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem modelo</SelectItem>
                    {filamentModels.map(m => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gramas */}
              <div>
                <Label className="text-xs">Gramas de filamento</Label>
                <Input type="number" min="0" value={gramsUsed || ''} onChange={e => setGramsUsed(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
              </div>

              {/* Toggle preço global */}
              {singleFilamentId && (
                <div className="space-y-2">
                  <button
                    onClick={() => setSingleUseGlobalPrice(p => !p)}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div className={cn('w-8 h-4 rounded-full transition-colors relative shrink-0', singleUseGlobalPrice ? 'bg-primary' : 'bg-muted-foreground/30')}>
                      <div className={cn('w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform', singleUseGlobalPrice ? 'translate-x-4' : 'translate-x-0.5')} />
                    </div>
                    <span className="text-muted-foreground">Usar preço do filamento cadastrado</span>
                  </button>
                  {singleUseGlobalPrice ? (
                    singleFilament && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 text-xs">
                        <span className="text-muted-foreground">Preço/kg (cadastrado)</span>
                        <span className="font-medium text-primary">{formatCurrency(singleFilament.price_per_kg)}</span>
                      </div>
                    )
                  ) : (
                    <div>
                      <Label className="text-xs">Preço/kg personalizado (R$)</Label>
                      <Input type="number" min="0" step="0.01" value={filamentPricePerKg || ''} onChange={e => setFilamentPricePerKg(parseFloat(e.target.value) || 0)} placeholder="120,00" className="mt-1" />
                    </div>
                  )}
                </div>
              )}

              {/* Preço manual quando sem filamento selecionado */}
              {!singleFilamentId && (
                <div>
                  <Label className="text-xs">Filamento (R$/kg)</Label>
                  <Input type="number" min="0" step="0.01" value={filamentPricePerKg || ''} onChange={e => setFilamentPricePerKg(parseFloat(e.target.value) || 0)} placeholder="120,00" className="mt-1" />
                </div>
              )}
            </div>
          )}

          {/* Múltiplas peças */}
          {multiPieceMode && (
            <div className="space-y-3">
              <AnimatePresence>
                {pieces.map((piece, idx) => {
                  const effectivePrice = getPieceEffectivePrice(piece)
                  const pieceCost = getPieceCost(piece)
                  const selectedFilament = filaments.find(f => f.id === piece.filamentId)

                  return (
                    <motion.div
                      key={piece.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 rounded-xl border border-border/60 space-y-3 shadow-[var(--shadow-card)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-primary uppercase tracking-wide">
                          Peça {idx + 1}
                        </span>
                        {pieces.length > 1 && (
                          <button
                            onClick={() => setPieces(p => p.filter(x => x.id !== piece.id))}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs">Nome da peça</Label>
                        <Input
                          value={piece.name}
                          onChange={e => updatePiece(piece.id, 'name', e.target.value)}
                          placeholder="Ex: Tampa, Corpo, Dobradiça"
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Tempo — horas</Label>
                          <Input
                            type="number" min="0"
                            value={piece.timeHours || ''}
                            onChange={e => updatePiece(piece.id, 'timeHours', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Minutos</Label>
                          <Input
                            type="number" min="0" max="59"
                            value={piece.timeMinutes || ''}
                            onChange={e => updatePiece(piece.id, 'timeMinutes', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Gramas usadas</Label>
                          <Input
                            type="number" min="0"
                            value={piece.gramsUsed || ''}
                            onChange={e => updatePiece(piece.id, 'gramsUsed', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Cor</Label>
                          <Input
                            value={piece.color}
                            onChange={e => updatePiece(piece.id, 'color', e.target.value)}
                            placeholder="Ex: Preto"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Modelo do filamento */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Modelo do filamento</Label>
                          <button onClick={() => onNavigateAdmin?.('model')} className="text-[11px] text-primary font-medium hover:underline">
                            + Adicionar modelo
                          </button>
                        </div>
                        <Select
                          value={piece.filamentModelName || 'none'}
                          onValueChange={v => updatePiece(piece.id, 'filamentModelName', v === 'none' ? '' : v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem modelo</SelectItem>
                            {filamentModels.map(m => (
                              <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Filamento utilizado</Label>
                          <button onClick={() => onNavigateAdmin?.('filament')} className="text-[11px] text-primary font-medium hover:underline">
                            + Adicionar filamento
                          </button>
                        </div>
                        <Select
                          value={piece.filamentId || 'none'}
                          onValueChange={v => updatePiece(piece.id, 'filamentId', v === 'none' ? null : v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar filamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem filamento</SelectItem>
                            {filaments.map(f => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}{f.brand ? ` — ${f.brand.name}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedFilament?.brand && (
                          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-muted/40">
                            <BrandLogo name={selectedFilament.brand.name} logoUrl={selectedFilament.brand.logo_url} className="w-6 h-6" />
                            <span className="text-xs font-medium">{selectedFilament.brand.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Toggle preço global */}
                      {piece.filamentId && (
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              const next = !piece.useGlobalPrice
                              // Ao desligar global, pré-preenche com o preço do filamento
                              if (!next && piece.filamentId) {
                                const f = filaments.find(f => f.id === piece.filamentId)
                                if (f) updatePiece(piece.id, 'filamentPricePerKg', f.price_per_kg)
                              }
                              updatePiece(piece.id, 'useGlobalPrice', next)
                            }}
                            className="flex items-center gap-2 text-xs"
                          >
                            <div className={cn(
                              'w-8 h-4 rounded-full transition-colors relative shrink-0',
                              piece.useGlobalPrice ? 'bg-primary' : 'bg-muted-foreground/30'
                            )}>
                              <div className={cn(
                                'w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform',
                                piece.useGlobalPrice ? 'translate-x-4' : 'translate-x-0.5'
                              )} />
                            </div>
                            <span className="text-muted-foreground">Usar preço do filamento cadastrado</span>
                          </button>

                          {piece.useGlobalPrice ? (
                            selectedFilament && (
                              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 text-xs">
                                <span className="text-muted-foreground">Preço/kg (cadastrado)</span>
                                <span className="font-medium text-primary">{formatCurrency(selectedFilament.price_per_kg)}</span>
                              </div>
                            )
                          ) : (
                            <div>
                              <Label className="text-xs">Preço/kg personalizado (R$)</Label>
                              <Input
                                type="number" min="0" step="0.01"
                                value={piece.filamentPricePerKg || ''}
                                onChange={e => updatePiece(piece.id, 'filamentPricePerKg', parseFloat(e.target.value) || 0)}
                                placeholder="120,00"
                                className="mt-1"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Preço/kg sem filamento selecionado */}
                      {!piece.filamentId && (
                        <div>
                          <Label className="text-xs">Preço/kg (R$)</Label>
                          <Input
                            type="number" min="0" step="0.01"
                            value={piece.filamentPricePerKg || ''}
                            onChange={e => updatePiece(piece.id, 'filamentPricePerKg', parseFloat(e.target.value) || 0)}
                            placeholder="120,00"
                            className="mt-1"
                          />
                        </div>
                      )}

                      {pieceCost > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Custo desta peça:{' '}
                          <span className="text-primary font-medium">{formatCurrency(pieceCost)}</span>
                        </p>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              <Button
                variant="outline" size="sm"
                onClick={() => setPieces(p => [...p, newPiece()])}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" /> Adicionar peça
              </Button>
            </div>
          )}

          <div>
            <Label className="text-xs">Preço do kWh (R$) — salvo automaticamente</Label>
            <Input
              type="number" min="0" step="0.001"
              value={kwh || ''}
              onChange={e => setKwh(parseFloat(e.target.value) || 0)}
              placeholder="0,75"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custos adicionais */}
      <Card>
        <CardHeader>
          <button className="flex items-center justify-between w-full" onClick={() => setShowExtras(p => !p)}>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Package className="h-4 w-4" />
              Custos Adicionais
            </CardTitle>
            {showExtras ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showExtras && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <CardContent className="space-y-3 pt-0">
                {extras.map(extra => (
                  <div key={extra.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Nome</Label>
                      <Input placeholder="Ex: Embalagem" value={extra.name} onChange={e => updateExtra(extra.id, 'name', e.target.value)} className="mt-1" />
                    </div>
                    <div className="w-16">
                      <Label className="text-xs">Qtd</Label>
                      <Input type="number" min="1" value={extra.qty || ''} onChange={e => updateExtra(extra.id, 'qty', parseFloat(e.target.value) || 1)} className="mt-1" />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">R$/un</Label>
                      <Input type="number" min="0" step="0.01" value={extra.unitPrice || ''} onChange={e => updateExtra(extra.id, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="0,00" className="mt-1" />
                    </div>
                    <button onClick={() => removeExtra(extra.id)} className="mb-2.5 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {insumos.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Do catálogo:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {insumos.map(ins => (
                        <button
                          key={ins.id}
                          onClick={() => { setExtras(p => [...p, { id: genId(), name: ins.name, qty: 1, unitPrice: ins.unit_price }]); setShowExtras(true) }}
                          className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors"
                        >
                          + {ins.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={addExtra} className="w-full gap-2">
                  <Plus className="h-4 w-4" /> Adicionar custo extra
                </Button>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
        {!showExtras && (
          <CardContent className="pt-0">
            <Button variant="outline" size="sm" onClick={addExtra} className="w-full gap-2 border-dashed">
              <Plus className="h-4 w-4" /> Adicionar custo extra
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Margens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-4 w-4" />
            Margens
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">% para a empresa</Label>
            <div className="relative mt-1">
              <Input type="number" min="0" max="100" value={companyMargin || ''} onChange={e => setCompanyMargin(parseFloat(e.target.value) || 0)} placeholder="20" className="pr-7" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs">% de lucro líquido</Label>
            <div className="relative mt-1">
              <Input type="number" min="0" max="100" value={profitMargin || ''} onChange={e => setProfitMargin(parseFloat(e.target.value) || 0)} placeholder="30" className="pr-7" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      <Card className="border-primary/30 bg-gradient-to-br from-[#C4704F]/5 to-[#C4704F]/10">
        <CardHeader><CardTitle className="text-primary">Resultado</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">

            {/* Breakdown por peça / filamento */}
            {multiPieceMode ? (
              <div className="space-y-1">
                {pieces.map((p, idx) => {
                  const cost = getPieceCost(p)
                  const f = filaments.find(f => f.id === p.filamentId)
                  const label = p.name || `Peça ${idx + 1}`
                  const detail = [
                    p.gramsUsed ? `${p.gramsUsed}g` : null,
                    f ? f.name : null,
                    (p.timeHours || p.timeMinutes)
                      ? `${p.timeHours}h${p.timeMinutes > 0 ? `${p.timeMinutes}m` : ''}`
                      : null,
                  ].filter(Boolean).join(' · ')
                  return (
                    <div key={p.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {label}{detail ? ` (${detail})` : ''}
                      </span>
                      <span>{formatCurrency(cost)}</span>
                    </div>
                  )
                })}
                <div className="flex justify-between text-xs text-muted-foreground pt-0.5 border-t border-border/40">
                  <span>Total peças (filamento + energia)</span>
                  <span>{formatCurrency(filamentCost + energyCost)}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Energia elétrica</span>
                  <span>{formatCurrency(energyCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filamento</span>
                  <span>{formatCurrency(filamentCost)}</span>
                </div>
              </>
            )}

            {extrasCost > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extras</span>
                <span>{formatCurrency(extrasCost)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Reserva empresa ({companyMargin}%)</span>
              <span>+ {formatCurrency(companyAdd)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lucro ({profitMargin}%)</span>
              <span>+ {formatCurrency(profitAdd)}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary/70 mb-1">Preço sugerido por peça</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(suggestedPrice)}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleUsePrice} className="w-full">Criar Mensagem</Button>
            <Button variant="outline" onClick={handleSaveDashboard} className="w-full">Salvar no Dashboard</Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog — impressora */}
      <Dialog open={showPrinterForm} onOpenChange={open => { setShowPrinterForm(open); if (!open) setEditPrinter(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editPrinter ? 'Editar Impressora' : 'Nova Impressora'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-6">
            <div>
              <Label>Nome da impressora</Label>
              <Input value={printerName} onChange={e => setPrinterName(e.target.value)} placeholder="Ex: Ender 3 Pro" className="mt-1" />
            </div>
            <div>
              <Label>Consumo (Watts)</Label>
              <Input type="number" min="1" value={printerWattage || ''} onChange={e => setPrinterWattage(parseFloat(e.target.value) || 0)} placeholder="200" className="mt-1" />
            </div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => { setShowPrinterForm(false); setEditPrinter(null) }}>Cancelar</Button>
            <Button onClick={savePrinterDB}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — confirmar exclusão de impressora */}
      <Dialog open={!!confirmDeletePrinterId} onOpenChange={v => !v && setConfirmDeletePrinterId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover Impressora?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground px-6">Esta ação não pode ser desfeita.</p>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmDeletePrinterId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDeletePrinterId && deletePrinterDB(confirmDeletePrinterId)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
