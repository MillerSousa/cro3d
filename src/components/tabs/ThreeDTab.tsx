import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronDown, ChevronUp, Box, Pencil, X, SlidersHorizontal, Package, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { ExtraInput, Printer, ThreeDCalcData, Insumo } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

function genId() { return Math.random().toString(36).slice(2) }

const DEFAULT_PRINTERS: Printer[] = []

const KWH_KEY = 'cro3d_kwh'
const PRINTERS_KEY = 'cro3d_printers'

interface ThreeDTabProps {
  onUsePrice: (price: number, productName?: string) => void
  onSaveDashboard: (data: ThreeDCalcData & { price: number }) => void
}

export function ThreeDTab({ onUsePrice, onSaveDashboard }: ThreeDTabProps) {
  const { user } = useAuth()

  const [printers, setPrinters] = useState<Printer[]>(() => {
    try { return JSON.parse(localStorage.getItem(PRINTERS_KEY) || '') }
    catch { return DEFAULT_PRINTERS }
  })
  const [selectedPrinterId, setSelectedPrinterId] = useState(printers[0]?.id || '')
  const [showPrinterForm, setShowPrinterForm] = useState(false)
  const [editPrinter, setEditPrinter] = useState<Printer | null>(null)
  const [printerName, setPrinterName] = useState('')
  const [printerWatts, setPrinterWatts] = useState(0)

  const [timeHours, setTimeHours] = useState(0)
  const [timeMinutes, setTimeMinutes] = useState(0)
  const [gramsUsed, setGramsUsed] = useState(0)
  const [filamentPricePerKg, setFilamentPricePerKg] = useState(0)
  const [kwh, setKwh] = useState(() => parseFloat(localStorage.getItem(KWH_KEY) || '0') || 0)
  const [companyMargin, setCompanyMargin] = useState(0)
  const [profitMargin, setProfitMargin] = useState(0)
  const [extras, setExtras] = useState<ExtraInput[]>([])
  const [showExtras, setShowExtras] = useState(false)
  const [insumos, setInsumos] = useState<Insumo[]>([])

  useEffect(() => {
    if (user) {
      supabase.from('insumos').select('*').eq('user_id', user.id).then(({ data }) => {
        if (data) setInsumos(data as Insumo[])
      })
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem(PRINTERS_KEY, JSON.stringify(printers))
  }, [printers])

  useEffect(() => {
    localStorage.setItem(KWH_KEY, kwh.toString())
  }, [kwh])

  const selectedPrinter = printers.find(p => p.id === selectedPrinterId) || null
  const totalHours = timeHours + timeMinutes / 60
  const energyCost = ((selectedPrinter?.watts || 0) / 1000) * totalHours * kwh
  const filamentCost = (gramsUsed / 1000) * filamentPricePerKg
  const extrasCost = extras.reduce((sum, e) => sum + e.qty * e.unitPrice, 0)
  const subtotal = energyCost + filamentCost + extrasCost
  const companyAdd = subtotal * (companyMargin / 100)
  const profitAdd = (subtotal + companyAdd) * (profitMargin / 100)
  const suggestedPrice = subtotal + companyAdd + profitAdd

  function savePrinter() {
    if (!printerName.trim()) return
    if (editPrinter) {
      setPrinters(p => p.map(x => x.id === editPrinter.id ? { ...x, name: printerName, watts: printerWatts } : x))
    } else {
      const newP: Printer = { id: genId(), name: printerName, watts: printerWatts }
      setPrinters(p => [...p, newP])
      setSelectedPrinterId(newP.id)
    }
    setPrinterName('')
    setPrinterWatts(0)
    setEditPrinter(null)
    setShowPrinterForm(false)
  }

  function deletePrinter(id: string) {
    setPrinters(p => p.filter(x => x.id !== id))
    if (selectedPrinterId === id) setSelectedPrinterId(printers.find(x => x.id !== id)?.id || '')
  }

  function openEdit(p: Printer) {
    setEditPrinter(p)
    setPrinterName(p.name)
    setPrinterWatts(p.watts)
    setShowPrinterForm(true)
  }

  function addExtra() { setExtras(p => [...p, { id: genId(), name: '', qty: 1, unitPrice: 0 }]); setShowExtras(true) }
  function removeExtra(id: string) { setExtras(p => p.filter(e => e.id !== id)) }
  function updateExtra(id: string, field: keyof ExtraInput, value: string | number) {
    setExtras(p => p.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function handleUsePrice() { onUsePrice(suggestedPrice); toast.success('Preço adicionado à mensagem!') }

  function handleSaveDashboard() {
    onSaveDashboard({
      printer: selectedPrinter, timeHours, timeMinutes, gramsUsed,
      filamentPricePerKg, kwh, extras, companyMargin, profitMargin, price: suggestedPrice,
    })
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Printer selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Box className="h-4 w-4" />
            Impressora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar impressora" />
            </SelectTrigger>
            <SelectContent>
              {printers.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name} ({p.watts}W)</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            {printers.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/40 text-sm">
                <span>{p.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deletePrinter(p.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setEditPrinter(null); setPrinterName(''); setPrinterWatts(0); setShowPrinterForm(true) }} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Nova impressora
          </Button>
        </CardContent>
      </Card>

      {/* Print params */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <SlidersHorizontal className="h-4 w-4" />
            Parâmetros da impressão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Gramas de filamento</Label>
              <Input type="number" min="0" value={gramsUsed || ''} onChange={e => setGramsUsed(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Filamento (R$/kg)</Label>
              <Input type="number" min="0" step="0.01" value={filamentPricePerKg || ''} onChange={e => setFilamentPricePerKg(parseFloat(e.target.value) || 0)} placeholder="120,00" className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Preço do kWh (R$) — salvo automaticamente</Label>
            <Input type="number" min="0" step="0.001" value={kwh || ''} onChange={e => setKwh(parseFloat(e.target.value) || 0)} placeholder="0,75" className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Extras */}
      <Card>
        <CardHeader>
          <button className="flex items-center justify-between w-full" onClick={() => setShowExtras(p => !p)}>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Package className="h-4 w-4" />
              Custos adicionais
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
                        <button key={ins.id} onClick={() => { setExtras(p => [...p, { id: genId(), name: ins.name, qty: 1, unitPrice: ins.unit_price }]); setShowExtras(true) }} className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors">
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

      {/* Margins */}
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

      {/* Result */}
      <Card className="border-primary/30 bg-gradient-to-br from-[#C4704F]/5 to-[#C4704F]/10">
        <CardHeader><CardTitle className="text-primary">Resultado</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Energia elétrica</span>
              <span>{formatCurrency(energyCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filamento</span>
              <span>{formatCurrency(filamentCost)}</span>
            </div>
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
            <Button onClick={handleUsePrice} className="w-full">Usar esse preço na mensagem</Button>
            <Button variant="outline" onClick={handleSaveDashboard} className="w-full">Salvar no Dashboard</Button>
          </div>
        </CardContent>
      </Card>

      {/* Printer form dialog */}
      <Dialog open={showPrinterForm} onOpenChange={setShowPrinterForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editPrinter ? 'Editar impressora' : 'Nova impressora'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-6">
            <div>
              <Label>Nome da impressora</Label>
              <Input value={printerName} onChange={e => setPrinterName(e.target.value)} placeholder="Ex: Ender 3 Pro" className="mt-1" />
            </div>
            <div>
              <Label>Consumo (Watts)</Label>
              <Input type="number" min="1" value={printerWatts || ''} onChange={e => setPrinterWatts(parseFloat(e.target.value) || 0)} placeholder="50" className="mt-1" />
            </div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setShowPrinterForm(false)}>Cancelar</Button>
            <Button onClick={savePrinter}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
