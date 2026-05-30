import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, Plus, Pencil, Trash2, ExternalLink, X,
  Loader2, ShoppingCart, Check, PlusCircle, Package,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { YarnStock, FilamentStock, ShoppingItem, Filament, FilamentBrand } from '@/lib/types'

interface EstoqueTabProps {
  type: 'crochet' | '3d'
  onBack: () => void
}

// ── Shared helpers ────────────────────────────────────────────

function ColorCircle({ hex, color }: { hex?: string | null; color?: string | null }) {
  const bg = hex || '#d1d5db'
  const letter = color ? color.charAt(0).toUpperCase() : ''
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
      style={{ backgroundColor: bg, color: hex ? '#fff' : '#6b7280', border: '1px solid rgba(0,0,0,0.08)' }}
    >
      {!hex && letter}
    </div>
  )
}

function StockBar({ grams }: { grams: number }) {
  const pct = Math.min(100, (grams / 500) * 100)
  const color = grams > 200 ? '#7A9E7E' : grams >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

function StockSkeleton() {
  return (
    <div className="rounded-[20px] border border-border/50 p-4 space-y-2.5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-4 w-10 shrink-0" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 w-9 rounded-xl" />
        <Skeleton className="h-8 w-9 rounded-xl" />
      </div>
    </div>
  )
}

// ── FormSheet (mobile: tela cheia / desktop: modal) ───────────

function FormSheet({
  open, onClose, title, children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-card flex flex-col md:hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-card">
              <button
                onClick={onClose}
                className="p-1.5 -ml-1.5 rounded-xl hover:bg-muted active:bg-muted transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="font-semibold text-sm flex-1">{title}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
          </motion.div>

          {/* Desktop */}
          <div
            className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-card rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/55 hover:bg-black/75 transition-colors text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center px-5 py-4 border-b border-border shrink-0">
                <span className="font-semibold text-base">{title}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── YARN STOCK (Crochê) ───────────────────────────────────────

function YarnStockSection({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const [stocks, setStocks] = useState<YarnStock[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<YarnStock | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [addGramsItem, setAddGramsItem] = useState<YarnStock | null>(null)
  const [addGramsValue, setAddGramsValue] = useState('')
  const [addGramsSaving, setAddGramsSaving] = useState(false)

  useEffect(() => { fetchStocks() }, [])

  async function fetchStocks() {
    setLoading(true)
    const { data } = await supabase
      .from('yarn_stock')
      .select('*')
      .eq('user_id', user!.id)
      .order('name')
    if (data) setStocks(data as YarnStock[])
    setLoading(false)
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('yarn_stock').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    setStocks(p => p.filter(s => s.id !== id))
    setConfirmDelete(null)
    toast.success('Fio removido do estoque')
  }

  async function handleAddGrams() {
    if (!addGramsItem) return
    const grams = parseFloat(addGramsValue)
    if (!grams || grams <= 0) { toast.error('Informe uma quantidade válida'); return }
    setAddGramsSaving(true)
    const newQty = addGramsItem.quantity_grams + grams
    const { error } = await supabase
      .from('yarn_stock')
      .update({ quantity_grams: newQty, updated_at: new Date().toISOString() })
      .eq('id', addGramsItem.id)
    if (error) { toast.error('Erro ao atualizar'); setAddGramsSaving(false); return }
    setStocks(p => p.map(s => s.id === addGramsItem.id ? { ...s, quantity_grams: newQty } : s))
    setAddGramsItem(null)
    setAddGramsValue('')
    setAddGramsSaving(false)
    toast.success(`+${grams}g adicionados ao estoque`)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="font-semibold text-base">Estoque de Crochê</h1>
        </div>
        <Button size="sm" onClick={() => { setEditItem(null); setShowForm(true) }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar fio
        </Button>
      </div>

      <div className="space-y-2.5">
        {loading ? (
          [...Array(3)].map((_, i) => <StockSkeleton key={i} />)
        ) : stocks.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum fio cadastrado ainda.</p>
            <p className="text-xs mt-1">Clique em "+ Adicionar fio" para começar.</p>
          </div>
        ) : (
          stocks.map(stock => (
            <YarnCard
              key={stock.id}
              stock={stock}
              onEdit={() => { setEditItem(stock); setShowForm(true) }}
              onDelete={() => setConfirmDelete(stock.id)}
              onAddGrams={() => { setAddGramsItem(stock); setAddGramsValue('') }}
            />
          ))
        )}
      </div>

      <FormSheet
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null) }}
        title={editItem ? 'Editar fio' : 'Adicionar fio'}
      >
        <YarnForm
          editItem={editItem}
          onSave={() => { setShowForm(false); setEditItem(null); fetchStocks() }}
          onCancel={() => { setShowForm(false); setEditItem(null) }}
        />
      </FormSheet>

      <Dialog open={!!addGramsItem} onOpenChange={v => !v && setAddGramsItem(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Adicionar gramas</DialogTitle></DialogHeader>
          <div className="px-6 space-y-3">
            <p className="text-sm text-muted-foreground">{addGramsItem?.name}</p>
            <div>
              <Label className="text-xs">Quantidade (g)</Label>
              <Input
                type="number" min="1" step="1"
                value={addGramsValue}
                onChange={e => setAddGramsValue(e.target.value)}
                placeholder="Ex: 100"
                className="mt-1"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setAddGramsItem(null)}>Cancelar</Button>
            <Button onClick={handleAddGrams} disabled={addGramsSaving}>
              {addGramsSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Remover do estoque?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground px-6">Esta ação não pode ser desfeita.</p>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteItem(confirmDelete)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function YarnCard({
  stock, onEdit, onDelete, onAddGrams,
}: {
  stock: YarnStock
  onEdit: () => void
  onDelete: () => void
  onAddGrams: () => void
}) {
  const lowStock = stock.quantity_grams < 50
  const qtyColor = stock.quantity_grams > 200 ? '#7A9E7E' : stock.quantity_grams >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="rounded-[20px] border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <ColorCircle hex={stock.color_hex} color={stock.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">{stock.name}</p>
            {lowStock && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
              >
                Estoque baixo!
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {[stock.brand, stock.color, stock.weight_grams].filter(Boolean).join(' · ')}
          </p>
        </div>
        <p className="text-sm font-semibold shrink-0" style={{ color: qtyColor }}>
          {stock.quantity_grams}g
        </p>
      </div>

      <StockBar grams={stock.quantity_grams} />

      <div className="flex gap-2">
        <Button
          size="sm" variant="outline"
          onClick={onAddGrams}
          className="flex-1 gap-1.5 text-xs h-8"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Adicionar gramas
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} className="h-8 w-9 px-0">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm" variant="outline" onClick={onDelete}
          className="h-8 w-9 px-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function YarnForm({
  editItem, onSave, onCancel,
}: {
  editItem: YarnStock | null
  onSave: () => void
  onCancel: () => void
}) {
  const { user } = useAuth()
  const [name, setName] = useState(editItem?.name || '')
  const [brand, setBrand] = useState(editItem?.brand || '')
  const [color, setColor] = useState(editItem?.color || '')
  const [colorHex, setColorHex] = useState(editItem?.color_hex || '')
  const [weightGrams, setWeightGrams] = useState(editItem?.weight_grams || '')
  const [quantityGrams, setQuantityGrams] = useState(String(editItem?.quantity_grams ?? ''))
  const [notes, setNotes] = useState(editItem?.notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) { toast.error('Informe o nome do fio'); return }
    if (!color.trim()) { toast.error('Informe a cor'); return }
    const qty = parseFloat(quantityGrams)
    if (isNaN(qty) || qty < 0) { toast.error('Informe uma quantidade válida'); return }
    setSaving(true)
    const payload = {
      user_id: user!.id,
      name: name.trim(),
      brand: brand.trim() || null,
      color: color.trim(),
      color_hex: colorHex || null,
      weight_grams: weightGrams.trim() || null,
      quantity_grams: qty,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    let error
    if (editItem) {
      ;({ error } = await supabase.from('yarn_stock').update(payload).eq('id', editItem.id))
    } else {
      ;({ error } = await supabase.from('yarn_stock').insert(payload))
    }
    if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return }
    toast.success(editItem ? 'Fio atualizado!' : 'Fio adicionado ao estoque!')
    setSaving(false)
    onSave()
  }

  return (
    <>
      <div>
        <Label className="text-xs">Nome do fio *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Anne 500g" className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Marca</Label>
        <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex: Círculo" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Cor *</Label>
          <Input value={color} onChange={e => setColor(e.target.value)} placeholder="Ex: Vermelho" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Cor (hex)</Label>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              value={colorHex || '#cccccc'}
              onChange={e => setColorHex(e.target.value)}
              className="h-9 w-9 rounded-lg border border-border cursor-pointer p-0.5 shrink-0"
            />
            <Input
              value={colorHex}
              onChange={e => setColorHex(e.target.value)}
              placeholder="#cccccc"
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Gramatura</Label>
          <Input value={weightGrams} onChange={e => setWeightGrams(e.target.value)} placeholder="Ex: Fino, 4/6" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Quantidade (g) *</Label>
          <Input
            type="number" min="0" step="1"
            value={quantityGrams}
            onChange={e => setQuantityGrams(e.target.value)}
            placeholder="0"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Observações</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 resize-none" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </>
  )
}

// ── FILAMENT STOCK (3D) ───────────────────────────────────────

function FilamentStockSection({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const [stocks, setStocks] = useState<FilamentStock[]>([])
  const [filaments, setFilaments] = useState<Filament[]>([])
  const [brands, setBrands] = useState<FilamentBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<FilamentStock | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [addGramsItem, setAddGramsItem] = useState<FilamentStock | null>(null)
  const [addGramsValue, setAddGramsValue] = useState('')
  const [addGramsSaving, setAddGramsSaving] = useState(false)

  useEffect(() => {
    fetchStocks()
    fetchFilaments()
    fetchBrands()
  }, [])

  async function fetchStocks() {
    setLoading(true)
    const { data } = await supabase
      .from('filament_stock')
      .select('*, filament:filaments(id,name), brand:filament_brands(id,name)')
      .eq('user_id', user!.id)
      .order('color')
    if (data) setStocks(data as FilamentStock[])
    setLoading(false)
  }

  async function fetchFilaments() {
    const { data } = await supabase.from('filaments').select('*').order('name')
    if (data) setFilaments(data as Filament[])
  }

  async function fetchBrands() {
    const { data } = await supabase.from('filament_brands').select('*').order('name')
    if (data) setBrands(data as FilamentBrand[])
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('filament_stock').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    setStocks(p => p.filter(s => s.id !== id))
    setConfirmDelete(null)
    toast.success('Filamento removido do estoque')
  }

  async function handleAddGrams() {
    if (!addGramsItem) return
    const grams = parseFloat(addGramsValue)
    if (!grams || grams <= 0) { toast.error('Informe uma quantidade válida'); return }
    setAddGramsSaving(true)
    const newQty = addGramsItem.quantity_grams + grams
    const { error } = await supabase
      .from('filament_stock')
      .update({ quantity_grams: newQty, updated_at: new Date().toISOString() })
      .eq('id', addGramsItem.id)
    if (error) { toast.error('Erro ao atualizar'); setAddGramsSaving(false); return }
    setStocks(p => p.map(s => s.id === addGramsItem.id ? { ...s, quantity_grams: newQty } : s))
    setAddGramsItem(null)
    setAddGramsValue('')
    setAddGramsSaving(false)
    toast.success(`+${grams}g adicionados ao estoque`)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="font-semibold text-base">Estoque 3D</h1>
        </div>
        <Button size="sm" onClick={() => { setEditItem(null); setShowForm(true) }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar filamento
        </Button>
      </div>

      <div className="space-y-2.5">
        {loading ? (
          [...Array(3)].map((_, i) => <StockSkeleton key={i} />)
        ) : stocks.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum filamento cadastrado ainda.</p>
            <p className="text-xs mt-1">Clique em "+ Adicionar filamento" para começar.</p>
          </div>
        ) : (
          stocks.map(stock => (
            <FilamentCard
              key={stock.id}
              stock={stock}
              onEdit={() => { setEditItem(stock); setShowForm(true) }}
              onDelete={() => setConfirmDelete(stock.id)}
              onAddGrams={() => { setAddGramsItem(stock); setAddGramsValue('') }}
            />
          ))
        )}
      </div>

      <FormSheet
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null) }}
        title={editItem ? 'Editar filamento' : 'Adicionar filamento'}
      >
        <FilamentForm
          editItem={editItem}
          filaments={filaments}
          brands={brands}
          onSave={() => { setShowForm(false); setEditItem(null); fetchStocks() }}
          onCancel={() => { setShowForm(false); setEditItem(null) }}
        />
      </FormSheet>

      <Dialog open={!!addGramsItem} onOpenChange={v => !v && setAddGramsItem(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Adicionar gramas</DialogTitle></DialogHeader>
          <div className="px-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              {addGramsItem?.filament?.name || addGramsItem?.color}
            </p>
            <div>
              <Label className="text-xs">Quantidade (g)</Label>
              <Input
                type="number" min="1" step="1"
                value={addGramsValue}
                onChange={e => setAddGramsValue(e.target.value)}
                placeholder="Ex: 100"
                className="mt-1"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setAddGramsItem(null)}>Cancelar</Button>
            <Button onClick={handleAddGrams} disabled={addGramsSaving}>
              {addGramsSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Remover do estoque?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground px-6">Esta ação não pode ser desfeita.</p>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteItem(confirmDelete)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function FilamentCard({
  stock, onEdit, onDelete, onAddGrams,
}: {
  stock: FilamentStock
  onEdit: () => void
  onDelete: () => void
  onAddGrams: () => void
}) {
  const lowStock = stock.quantity_grams < 50
  const qtyColor = stock.quantity_grams > 200 ? '#7A9E7E' : stock.quantity_grams >= 50 ? '#f59e0b' : '#ef4444'
  const mainLabel = [stock.filament?.name, stock.brand?.name].filter(Boolean).join(' · ') || stock.color

  return (
    <div className="rounded-[20px] border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <ColorCircle hex={stock.color_hex} color={stock.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">{mainLabel}</p>
            {lowStock && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
              >
                Estoque baixo!
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{stock.color}</p>
        </div>
        <p className="text-sm font-semibold shrink-0" style={{ color: qtyColor }}>
          {stock.quantity_grams}g
        </p>
      </div>

      <StockBar grams={stock.quantity_grams} />

      <div className="flex gap-2">
        <Button
          size="sm" variant="outline"
          onClick={onAddGrams}
          className="flex-1 gap-1.5 text-xs h-8"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Adicionar gramas
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} className="h-8 w-9 px-0">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm" variant="outline" onClick={onDelete}
          className="h-8 w-9 px-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function FilamentForm({
  editItem, filaments, brands, onSave, onCancel,
}: {
  editItem: FilamentStock | null
  filaments: Filament[]
  brands: FilamentBrand[]
  onSave: () => void
  onCancel: () => void
}) {
  const { user } = useAuth()
  const [filamentId, setFilamentId] = useState(editItem?.filament_id || '')
  const [brandId, setBrandId] = useState(editItem?.brand_id || '')
  const [color, setColor] = useState(editItem?.color || '')
  const [colorHex, setColorHex] = useState(editItem?.color_hex || '')
  const [quantityGrams, setQuantityGrams] = useState(String(editItem?.quantity_grams ?? ''))
  const [notes, setNotes] = useState(editItem?.notes || '')
  const [saving, setSaving] = useState(false)

  function handleFilamentChange(id: string) {
    setFilamentId(id)
    const fil = filaments.find(f => f.id === id)
    if (fil?.brand_id && !brandId) setBrandId(fil.brand_id)
  }

  async function handleSave() {
    if (!color.trim()) { toast.error('Informe a cor'); return }
    const qty = parseFloat(quantityGrams)
    if (isNaN(qty) || qty < 0) { toast.error('Informe uma quantidade válida'); return }
    setSaving(true)
    const payload = {
      user_id: user!.id,
      filament_id: filamentId || null,
      brand_id: brandId || null,
      color: color.trim(),
      color_hex: colorHex || null,
      quantity_grams: qty,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    let error
    if (editItem) {
      ;({ error } = await supabase.from('filament_stock').update(payload).eq('id', editItem.id))
    } else {
      ;({ error } = await supabase.from('filament_stock').insert(payload))
    }
    if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return }
    toast.success(editItem ? 'Filamento atualizado!' : 'Filamento adicionado ao estoque!')
    setSaving(false)
    onSave()
  }

  return (
    <>
      <div>
        <Label className="text-xs">Tipo de filamento</Label>
        <Select value={filamentId} onValueChange={handleFilamentChange}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {filaments.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Marca</Label>
        <Select value={brandId} onValueChange={setBrandId}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Cor *</Label>
          <Input value={color} onChange={e => setColor(e.target.value)} placeholder="Ex: Branco" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Cor (hex)</Label>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              value={colorHex || '#cccccc'}
              onChange={e => setColorHex(e.target.value)}
              className="h-9 w-9 rounded-lg border border-border cursor-pointer p-0.5 shrink-0"
            />
            <Input
              value={colorHex}
              onChange={e => setColorHex(e.target.value)}
              placeholder="#cccccc"
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs">Quantidade (g) *</Label>
        <Input
          type="number" min="0" step="1"
          value={quantityGrams}
          onChange={e => setQuantityGrams(e.target.value)}
          placeholder="0"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Observações</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 resize-none" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </>
  )
}

// ── SHOPPING LIST ─────────────────────────────────────────────

const PRIORITY_MAP = {
  urgent: { label: 'Urgente', color: '#C4704F', bg: '#fdf0eb' },
  normal: { label: 'Normal', color: '#7A9E7E', bg: '#f0f5f0' },
  low: { label: 'Quando possível', color: '#9ca3af', bg: '#f3f4f6' },
}

function ShoppingListSection({ type }: { type: 'crochet' | '3d' }) {
  const { user } = useAuth()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [purchaseItem, setPurchaseItem] = useState<ShoppingItem | null>(null)
  const [purchaseGrams, setPurchaseGrams] = useState('')
  const [purchaseSaving, setPurchaseSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', user!.id)
      .eq('type', type)
      .order('created_at', { ascending: false })
    if (data) setItems(data as ShoppingItem[])
    setLoading(false)
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from('shopping_list').delete().eq('id', id)
    if (error) { toast.error('Erro ao remover'); return }
    setItems(p => p.filter(i => i.id !== id))
    setConfirmRemove(null)
    toast.success('Item removido da lista')
  }

  async function handlePurchase() {
    if (!purchaseItem) return
    const grams = parseFloat(purchaseGrams)
    if (!grams || grams <= 0) { toast.error('Informe uma quantidade válida'); return }
    setPurchaseSaving(true)

    const { error: updateError } = await supabase
      .from('shopping_list')
      .update({ status: 'purchased' })
      .eq('id', purchaseItem.id)

    if (updateError) { toast.error('Erro ao atualizar'); setPurchaseSaving(false); return }

    if (type === 'crochet') {
      await supabase.from('yarn_stock').insert({
        user_id: user!.id,
        name: purchaseItem.name,
        brand: purchaseItem.brand || null,
        color: purchaseItem.color || purchaseItem.name,
        color_hex: purchaseItem.color_hex || null,
        quantity_grams: grams,
      })
    } else {
      await supabase.from('filament_stock').insert({
        user_id: user!.id,
        color: purchaseItem.color || purchaseItem.name,
        color_hex: purchaseItem.color_hex || null,
        quantity_grams: grams,
      })
    }

    setItems(p => p.map(i =>
      i.id === purchaseItem.id ? { ...i, status: 'purchased' as const } : i
    ))
    setPurchaseItem(null)
    setPurchaseGrams('')
    setPurchaseSaving(false)
    toast.success('Compra registrada e estoque atualizado! 🎉')
  }

  const pending = items.filter(i => i.status === 'pending')
  const purchased = items.filter(i => i.status === 'purchased')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Lista de Compras</h2>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5 text-xs h-8">
          <Plus className="h-3.5 w-3.5" /> Adicionar item
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[...Array(2)].map((_, i) => <StockSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Lista de compras vazia.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map(item => (
            <ShoppingItemCard
              key={item.id}
              item={item}
              onMarkPurchased={() => { setPurchaseItem(item); setPurchaseGrams('') }}
            />
          ))}
          {purchased.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground px-0.5 pt-1">Comprados</p>
              {purchased.map(item => (
                <ShoppingItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => setConfirmRemove(item.id)}
                />
              ))}
            </>
          )}
        </div>
      )}

      <FormSheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Adicionar à lista de compras"
      >
        <ShoppingForm
          type={type}
          onSave={() => { setShowForm(false); fetchItems() }}
          onCancel={() => setShowForm(false)}
        />
      </FormSheet>

      <Dialog open={!!purchaseItem} onOpenChange={v => !v && setPurchaseItem(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Compra realizada! 🎉</DialogTitle></DialogHeader>
          <div className="px-6 space-y-3">
            <p className="text-sm text-muted-foreground">{purchaseItem?.name}</p>
            <div>
              <Label className="text-xs">Quantas gramas você comprou?</Label>
              <Input
                type="number" min="1" step="1"
                value={purchaseGrams}
                onChange={e => setPurchaseGrams(e.target.value)}
                placeholder="Ex: 300"
                className="mt-1"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Esta quantidade será adicionada automaticamente ao estoque.
            </p>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setPurchaseItem(null)}>Cancelar</Button>
            <Button onClick={handlePurchase} disabled={purchaseSaving}>
              {purchaseSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRemove} onOpenChange={v => !v && setConfirmRemove(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Remover da lista?</DialogTitle></DialogHeader>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmRemove && removeItem(confirmRemove)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShoppingItemCard({
  item, onMarkPurchased, onRemove,
}: {
  item: ShoppingItem
  onMarkPurchased?: () => void
  onRemove?: () => void
}) {
  const isPurchased = item.status === 'purchased'
  const priority = PRIORITY_MAP[item.priority]

  return (
    <div className={cn(
      'rounded-[20px] border border-border/50 bg-card p-4 space-y-2.5 transition-opacity',
      isPurchased && 'opacity-60'
    )}>
      <div className="flex items-center gap-3">
        <ColorCircle hex={item.color_hex} color={item.color} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', isPurchased && 'line-through decoration-muted-foreground')}>
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {[item.brand, item.quantity_grams ? `${item.quantity_grams}g` : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: priority.bg, color: priority.color }}
        >
          {priority.label}
        </span>
      </div>

      {item.reason && (
        <p className="text-xs text-muted-foreground pl-11 leading-relaxed">{item.reason}</p>
      )}

      <div className="flex gap-2">
        {item.purchase_url && (
          <a
            href={item.purchase_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center h-8 w-9 rounded-xl border border-border hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {!isPurchased && onMarkPurchased && (
          <Button
            size="sm" variant="outline"
            onClick={onMarkPurchased}
            className="flex-1 gap-1.5 text-xs h-8"
            style={{ borderColor: '#7A9E7E', color: '#7A9E7E' }}
          >
            <Check className="h-3.5 w-3.5" /> Comprado
          </Button>
        )}
        {isPurchased && onRemove && (
          <Button
            size="sm" variant="outline"
            onClick={onRemove}
            className="flex-1 text-xs h-8 text-destructive hover:text-destructive"
          >
            Remover da lista
          </Button>
        )}
      </div>
    </div>
  )
}

function ShoppingForm({
  type, onSave, onCancel,
}: {
  type: 'crochet' | '3d'
  onSave: () => void
  onCancel: () => void
}) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [colorHex, setColorHex] = useState('')
  const [quantityGrams, setQuantityGrams] = useState('')
  const [reason, setReason] = useState('')
  const [priority, setPriority] = useState<'urgent' | 'normal' | 'low'>('normal')
  const [purchaseUrl, setPurchaseUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) { toast.error('Informe o nome'); return }
    setSaving(true)
    const { error } = await supabase.from('shopping_list').insert({
      user_id: user!.id,
      type,
      name: name.trim(),
      brand: brand.trim() || null,
      color: color.trim() || null,
      color_hex: colorHex || null,
      quantity_grams: quantityGrams ? parseFloat(quantityGrams) : null,
      reason: reason.trim() || null,
      priority,
      purchase_url: purchaseUrl.trim() || null,
      status: 'pending',
    })
    if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return }
    toast.success('Item adicionado à lista!')
    setSaving(false)
    onSave()
  }

  return (
    <>
      <div>
        <Label className="text-xs">{type === 'crochet' ? 'Nome do fio *' : 'Tipo de filamento (ex: PLA, PETG) *'}</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder={type === 'crochet' ? 'Ex: Anne 500g' : 'Ex: PLA'} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Marca</Label>
        <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex: Círculo" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Cor</Label>
          <Input value={color} onChange={e => setColor(e.target.value)} placeholder="Ex: Vermelho" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Cor (hex)</Label>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              value={colorHex || '#cccccc'}
              onChange={e => setColorHex(e.target.value)}
              className="h-9 w-9 rounded-lg border border-border cursor-pointer p-0.5 shrink-0"
            />
            <Input
              value={colorHex}
              onChange={e => setColorHex(e.target.value)}
              placeholder="#cccccc"
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs">Quantidade desejada (g)</Label>
        <Input
          type="number" min="0" step="1"
          value={quantityGrams}
          onChange={e => setQuantityGrams(e.target.value)}
          placeholder="Ex: 300"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Motivo</Label>
        <Textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={2}
          placeholder="Por que você precisa comprar?"
          className="mt-1 resize-none"
        />
      </div>
      <div>
        <Label className="text-xs">Prioridade</Label>
        <Select value={priority} onValueChange={v => setPriority(v as 'urgent' | 'normal' | 'low')}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Quando possível</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Link para compra (opcional)</Label>
        <Input
          value={purchaseUrl}
          onChange={e => setPurchaseUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Adicionar
        </Button>
      </div>
    </>
  )
}

// ── Main export ───────────────────────────────────────────────

export function EstoqueTab({ type, onBack }: EstoqueTabProps) {
  return (
    <div className="space-y-5 pb-4">
      {type === 'crochet' ? (
        <YarnStockSection onBack={onBack} />
      ) : (
        <FilamentStockSection onBack={onBack} />
      )}

      <div className="border-t border-border/50 pt-4">
        <ShoppingListSection type={type} />
      </div>
    </div>
  )
}
