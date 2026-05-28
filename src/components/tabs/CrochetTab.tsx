import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronDown, ChevronUp, Scissors, Clock, Package, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { YarnInput, ExtraInput, Insumo, CrochetCalcData, CostBreakdown } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

function genId() { return Math.random().toString(36).slice(2) }

function newYarn(): YarnInput {
  return { id: genId(), name: '', skeinPrice: 0, gramsPerSkein: 0, gramsUsed: 0 }
}

interface CrochetTabProps {
  onUsePrice: (price: number, productName?: string) => void
  onSaveDashboard: (data: CrochetCalcData & { price: number }) => void
  prefillData?: CostBreakdown | null
  onPrefillConsumed?: () => void
}

export function CrochetTab({ onUsePrice, onSaveDashboard, prefillData, onPrefillConsumed }: CrochetTabProps) {
  const { user } = useAuth()
  const [yarns, setYarns] = useState<YarnInput[]>([newYarn()])
  const [qty, setQty] = useState(1)
  const [timeHours, setTimeHours] = useState(0)
  const [timeMinutes, setTimeMinutes] = useState(0)
  const [hourlyRate, setHourlyRate] = useState(0)
  const [companyMargin, setCompanyMargin] = useState(0)
  const [profitMargin, setProfitMargin] = useState(0)
  const [extras, setExtras] = useState<ExtraInput[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [showExtras, setShowExtras] = useState(false)

  useEffect(() => {
    if (user) {
      supabase.from('insumos').select('*').eq('user_id', user.id).then(({ data }) => {
        if (data) setInsumos(data as Insumo[])
      })
    }
  }, [user])

  // Restaurar calculadora a partir do snapshot do modelo
  useEffect(() => {
    if (!prefillData || prefillData.type !== 'crochet') return
    if (prefillData.yarns && prefillData.yarns.length > 0) {
      setYarns(prefillData.yarns.map(y => ({
        id: genId(),
        name: y.name,
        skeinPrice: y.price_per_skein,
        gramsPerSkein: y.grams_per_skein,
        gramsUsed: y.grams_used,
      })))
    }
    if (prefillData.quantity != null) setQty(prefillData.quantity)
    if (prefillData.time_hours != null) setTimeHours(prefillData.time_hours)
    if (prefillData.time_minutes != null) setTimeMinutes(prefillData.time_minutes)
    if (prefillData.hourly_rate != null) setHourlyRate(prefillData.hourly_rate)
    if (prefillData.additional_costs && prefillData.additional_costs.length > 0) {
      setExtras(prefillData.additional_costs.map(c => ({
        id: genId(),
        name: c.name,
        qty: c.quantity,
        unitPrice: c.unit_price,
      })))
      setShowExtras(true)
    }
    if (prefillData.margin_company != null) setCompanyMargin(prefillData.margin_company)
    if (prefillData.margin_profit != null) setProfitMargin(prefillData.margin_profit)
    onPrefillConsumed?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillData])

  const totalYarnCost = yarns.reduce((sum, y) => {
    if (!y.gramsPerSkein || !y.skeinPrice) return sum
    return sum + (y.gramsUsed / y.gramsPerSkein) * y.skeinPrice
  }, 0)

  const totalTimeHours = timeHours + timeMinutes / 60
  const laborCost = (totalTimeHours * hourlyRate) / (qty || 1)

  const extrasCostPerUnit = extras.reduce((sum, e) => sum + (e.qty * e.unitPrice) / (qty || 1), 0)

  const materialCostPerUnit = totalYarnCost / (qty || 1)
  const subtotal = materialCostPerUnit + laborCost + extrasCostPerUnit
  const companyAdd = subtotal * (companyMargin / 100)
  const profitAdd = (subtotal + companyAdd) * (profitMargin / 100)
  const suggestedPrice = subtotal + companyAdd + profitAdd

  function addYarn() { setYarns(p => [...p, newYarn()]) }
  function removeYarn(id: string) { setYarns(p => p.filter(y => y.id !== id)) }
  function updateYarn(id: string, field: keyof YarnInput, value: string | number) {
    setYarns(p => p.map(y => y.id === id ? { ...y, [field]: value } : y))
  }

  function addExtra() {
    setExtras(p => [...p, { id: genId(), name: '', qty: 1, unitPrice: 0 }])
    setShowExtras(true)
  }
  function removeExtra(id: string) { setExtras(p => p.filter(e => e.id !== id)) }
  function updateExtra(id: string, field: keyof ExtraInput, value: string | number) {
    setExtras(p => p.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function handleUsePrice() {
    onUsePrice(suggestedPrice)
    toast.success('Preço adicionado à mensagem!')
  }

  function handleSaveDashboard() {
    const data: CrochetCalcData & { price: number } = {
      yarns, qty, timeHours, timeMinutes, hourlyRate,
      extras, companyMargin, profitMargin, price: suggestedPrice,
    }
    onSaveDashboard(data)
  }

  const numInput = (val: number, setter: (n: number) => void, min = 0) => (
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value) || 0
      setter(Math.max(min, v))
    }
  )

  return (
    <div className="space-y-4 pb-4">
      {/* Yarns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Scissors className="h-4 w-4" />
            Fios utilizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {yarns.map((yarn, idx) => (
              <motion.div
                key={yarn.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Fio {idx + 1}
                  </span>
                  {yarns.length > 1 && (
                    <button onClick={() => removeYarn(yarn.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Nome do fio</Label>
                  <Input
                    placeholder="Ex: Fio 100% algodão bege"
                    value={yarn.name}
                    onChange={e => updateYarn(yarn.id, 'name', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={yarn.skeinPrice || ''}
                      onChange={e => updateYarn(yarn.id, 'skeinPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">g/novelo</Label>
                    <Input
                      type="number" min="1"
                      value={yarn.gramsPerSkein || ''}
                      onChange={e => updateYarn(yarn.id, 'gramsPerSkein', parseFloat(e.target.value) || 1)}
                      placeholder="100"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">g usadas</Label>
                    <Input
                      type="number" min="0"
                      value={yarn.gramsUsed || ''}
                      onChange={e => updateYarn(yarn.id, 'gramsUsed', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                </div>
                {yarn.skeinPrice > 0 && yarn.gramsUsed > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Custo deste fio: <span className="text-primary font-medium">
                      {formatCurrency((yarn.gramsUsed / yarn.gramsPerSkein) * yarn.skeinPrice)}
                    </span>
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <Button variant="outline" size="sm" onClick={addYarn} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Adicionar fio
          </Button>
        </CardContent>
      </Card>

      {/* Production */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Clock className="h-4 w-4" />
            Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Quantidade de peças produzidas</Label>
            <Input type="number" min="1" value={qty || ''} onChange={numInput(qty, setQty, 1)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Tempo total — horas</Label>
              <Input type="number" min="0" value={timeHours || ''} onChange={numInput(timeHours, setTimeHours)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Minutos</Label>
              <Input type="number" min="0" max="59" value={timeMinutes || ''} onChange={numInput(timeMinutes, setTimeMinutes)} placeholder="0" className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Salário/hora desejado (R$)</Label>
            <Input type="number" min="0" step="0.50" value={hourlyRate || ''} onChange={numInput(hourlyRate, setHourlyRate)} placeholder="15,00" className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Extras */}
      <Card>
        <CardHeader>
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowExtras(p => !p)}
          >
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
                <AnimatePresence>
                  {extras.map((extra) => (
                    <motion.div key={extra.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Nome</Label>
                        <Input placeholder="Ex: Saquinho organza" value={extra.name} onChange={e => updateExtra(extra.id, 'name', e.target.value)} className="mt-1" />
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
                    </motion.div>
                  ))}
                </AnimatePresence>
                {insumos.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Adicionar do catálogo de insumos:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {insumos.map(ins => (
                        <button
                          key={ins.id}
                          onClick={() => {
                            setExtras(p => [...p, { id: genId(), name: ins.name, qty: 1, unitPrice: ins.unit_price }])
                            setShowExtras(true)
                          }}
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
            <Button variant="outline" size="sm" onClick={() => { addExtra() }} className="w-full gap-2 border-dashed">
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
              <Input type="number" min="0" max="100" value={companyMargin || ''} onChange={numInput(companyMargin, setCompanyMargin)} placeholder="20" className="pr-7" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs">% de lucro líquido</Label>
            <div className="relative mt-1">
              <Input type="number" min="0" max="100" value={profitMargin || ''} onChange={numInput(profitMargin, setProfitMargin)} placeholder="30" className="pr-7" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <motion.div layout>
        <Card className="border-primary/30 bg-gradient-to-br from-[#C4704F]/5 to-[#C4704F]/10">
          <CardHeader>
            <CardTitle className="text-primary">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo de materiais</span>
                <span>{formatCurrency(materialCostPerUnit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mão de obra</span>
                <span>{formatCurrency(laborCost)}</span>
              </div>
              {extrasCostPerUnit > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extras</span>
                  <span>{formatCurrency(extrasCostPerUnit)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Subtotal (custo real)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Reserva empresa ({companyMargin}%)</span>
                <span>+ {formatCurrency(companyAdd)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Lucro líquido ({profitMargin}%)</span>
                <span>+ {formatCurrency(profitAdd)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-primary/70 mb-1">Preço sugerido por peça</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(suggestedPrice)}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleUsePrice} className="w-full">
                Usar esse preço na mensagem
              </Button>
              <Button variant="outline" onClick={handleSaveDashboard} className="w-full">
                Salvar no Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
