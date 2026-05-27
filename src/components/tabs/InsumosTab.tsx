import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil, Package, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { Insumo } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

function genId() { return Math.random().toString(36).slice(2) }

interface QuickCalc {
  id: string
  name: string
  pkgQty: number
  pkgPrice: number
}

const SUGGESTIONS = [
  'Saquinho organza', 'Saquinho kraft', 'Chaveiro argola',
  'Caixa presente', 'Fita cetim', 'Aroma/essência',
  'Papel seda', 'Etiqueta',
]

export function InsumosTab() {
  const { user } = useAuth()
  const [cards, setCards] = useState<QuickCalc[]>([{ id: genId(), name: '', pkgQty: 1, pkgPrice: 0 }])
  const [catalog, setCatalog] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState(0)

  useEffect(() => {
    if (user) fetchCatalog()
  }, [user])

  async function fetchCatalog() {
    setLoading(true)
    const { data } = await supabase.from('insumos').select('*').eq('user_id', user!.id).order('name')
    if (data) setCatalog(data as Insumo[])
    setLoading(false)
  }

  function addCard() {
    setCards(p => [...p, { id: genId(), name: '', pkgQty: 1, pkgPrice: 0 }])
  }

  function removeCard(id: string) {
    setCards(p => p.filter(c => c.id !== id))
  }

  function updateCard(id: string, field: keyof QuickCalc, value: string | number) {
    setCards(p => p.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  async function saveToCatalog(card: QuickCalc) {
    if (!card.name.trim()) { toast.error('Insira o nome do insumo'); return }
    if (!card.pkgQty || !card.pkgPrice) { toast.error('Preencha quantidade e preço'); return }
    const unitPrice = card.pkgPrice / card.pkgQty

    const { error } = await supabase.from('insumos').insert({
      user_id: user!.id,
      name: card.name.trim(),
      unit_price: unitPrice,
    })
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success(`${card.name} salvo no catálogo!`)
    fetchCatalog()
  }

  async function deleteInsumo(id: string) {
    const { error } = await supabase.from('insumos').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    setCatalog(p => p.filter(i => i.id !== id))
    toast.success('Insumo removido')
  }

  async function saveEdit() {
    if (!editId) return
    const { error } = await supabase.from('insumos').update({ name: editName, unit_price: editPrice }).eq('id', editId)
    if (error) { toast.error('Erro ao salvar'); return }
    setCatalog(p => p.map(i => i.id === editId ? { ...i, name: editName, unit_price: editPrice } : i))
    setEditId(null)
    toast.success('Insumo atualizado')
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Quick calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Package className="h-4 w-4" />
            Calculadora de preço unitário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {cards.map((card, idx) => {
              const unitPrice = card.pkgQty > 0 && card.pkgPrice > 0
                ? card.pkgPrice / card.pkgQty : 0
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Insumo {idx + 1}</span>
                    {cards.length > 1 && (
                      <button onClick={() => removeCard(card.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Nome do insumo</Label>
                    <Input
                      value={card.name}
                      onChange={e => updateCard(card.id, 'name', e.target.value)}
                      placeholder="Ex: Saquinho organza"
                      className="mt-1"
                    />
                    {!card.name && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {SUGGESTIONS.map(s => (
                          <button
                            key={s}
                            onClick={() => updateCard(card.id, 'name', s)}
                            className="text-xs px-2 py-0.5 rounded-full border border-border hover:bg-muted transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Qtd no pacote</Label>
                      <Input type="number" min="1" value={card.pkgQty || ''} onChange={e => updateCard(card.id, 'pkgQty', parseFloat(e.target.value) || 1)} placeholder="10" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Preço do pacote (R$)</Label>
                      <Input type="number" min="0" step="0.01" value={card.pkgPrice || ''} onChange={e => updateCard(card.id, 'pkgPrice', parseFloat(e.target.value) || 0)} placeholder="0,00" className="mt-1" />
                    </div>
                  </div>
                  {unitPrice > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Valor por unidade:</span>
                        <span className="text-sm font-semibold text-primary">{formatCurrency(unitPrice)}</span>
                      </div>
                      <Button size="sm" variant="sage" onClick={() => saveToCatalog(card)} className="gap-1.5 text-xs h-8">
                        <Check className="h-3.5 w-3.5" /> Salvar no catálogo
                      </Button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
          <Button variant="outline" size="sm" onClick={addCard} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Adicionar insumo
          </Button>
        </CardContent>
      </Card>

      {/* Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Catálogo salvo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : catalog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum insumo salvo ainda. Use a calculadora acima para adicionar.
            </p>
          ) : (
            <div className="space-y-2">
              {catalog.map(ins => (
                <div key={ins.id} className="flex items-center gap-2 py-2.5 px-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                  {editId === ins.id ? (
                    <>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-8 text-sm" />
                      <Input type="number" value={editPrice || ''} onChange={e => setEditPrice(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-sm" />
                      <button onClick={saveEdit} className="text-primary hover:text-primary/80 transition-colors"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditId(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{ins.name}</span>
                      <span className="text-sm text-primary font-semibold">{formatCurrency(ins.unit_price)}</span>
                      <span className="text-xs text-muted-foreground">/un</span>
                      <button onClick={() => { setEditId(ins.id); setEditName(ins.name); setEditPrice(ins.unit_price) }} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteInsumo(ins.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// X icon helper (not imported above to avoid conflict)
function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}
