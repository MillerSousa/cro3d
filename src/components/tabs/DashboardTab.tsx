import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Image as ImageIcon, ExternalLink, Pencil, Trash2,
  LayoutGrid, Youtube, BookOpen, ShoppingBag, Link2, X, Check,
  Loader2, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatTime } from '@/lib/utils'
import { DashboardModel, CostBreakdown } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface DashboardTabProps {
  prefillData?: {
    type: 'crochet' | '3d'
    price: number
    breakdown: CostBreakdown
  } | null
  onUseModel?: (model: DashboardModel) => void
}

const STATUS_MAP = {
  available: { label: 'Disponível', variant: 'available' as const },
  in_production: { label: 'Em produção', variant: 'in_production' as const },
  discontinued: { label: 'Descontinuado', variant: 'discontinued' as const },
}

function ModelSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}

export function DashboardTab({ prefillData, onUseModel }: DashboardTabProps) {
  const { user, allowedUser } = useAuth()
  const role = allowedUser?.role
  const [models, setModels] = useState<DashboardModel[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'crochet' | '3d'>('all')
  const [selected, setSelected] = useState<DashboardModel | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editModel, setEditModel] = useState<DashboardModel | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { fetchModels() }, [])

  useEffect(() => {
    if (prefillData) { setShowForm(true); setEditModel(null) }
  }, [prefillData])

  async function fetchModels() {
    setLoading(true)
    let q = supabase.from('dashboard_models').select('*').order('created_at', { ascending: false })
    if (role === 'crochet') q = q.eq('type', 'crochet')
    if (role === '3d') q = q.eq('type', '3d')
    const { data } = await q
    if (data) setModels(data as DashboardModel[])
    setLoading(false)
  }

  async function deleteModel(id: string) {
    const { error } = await supabase.from('dashboard_models').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    setModels(p => p.filter(m => m.id !== id))
    setSelected(null)
    setConfirmDelete(null)
    toast.success('Modelo excluído')
  }

  const filtered = models.filter(m => {
    if (filterType === 'all') return true
    return m.type === filterType
  })

  const canSeeFilter = role === 'admin' || role === 'both'

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-base">Modelos</h2>
        </div>
        <Button size="sm" onClick={() => { setEditModel(null); setShowForm(true) }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo modelo
        </Button>
      </div>

      {canSeeFilter && (
        <div className="flex gap-2">
          {(['all', 'crochet', '3d'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterType === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {t === 'all' ? 'Todos' : t === 'crochet' ? 'Crochê' : '3D'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <ModelSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <LayoutGrid className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum modelo cadastrado ainda.</p>
          <p className="text-xs mt-1">Clique em "+ Novo modelo" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map(model => (
            <motion.button
              key={model.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(model)}
              className="bg-card rounded-2xl border border-border card-shadow overflow-hidden text-left"
            >
              {model.photo_url ? (
                <img src={model.photo_url} alt={model.name} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-muted/50 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium leading-tight line-clamp-2">{model.name}</p>
                <p className="text-primary font-semibold text-sm mt-1">{formatCurrency(model.price_per_unit)}</p>
                <div className="mt-2">
                  <Badge variant={STATUS_MAP[model.status].variant} className="text-[10px]">
                    {STATUS_MAP[model.status].label}
                  </Badge>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <ModelDetailModal
            model={selected}
            onClose={() => setSelected(null)}
            onEdit={() => { setEditModel(selected); setShowForm(true); setSelected(null) }}
            onDelete={() => setConfirmDelete(selected.id)}
            onUseInCalc={() => { onUseModel?.(selected); setSelected(null) }}
            isOwner={selected.user_id === user?.id}
          />
        )}
      </AnimatePresence>

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditModel(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <ModelForm
            editModel={editModel}
            prefillData={prefillData}
            onSave={() => { setShowForm(false); setEditModel(null); fetchModels(); toast.success('Modelo salvo!') }}
            onCancel={() => { setShowForm(false); setEditModel(null) }}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir modelo?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground px-6">Esta ação não pode ser desfeita.</p>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteModel(confirmDelete)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ModelDetailModal({ model, onClose, onEdit, onDelete, onUseInCalc, isOwner }: {
  model: DashboardModel
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onUseInCalc: () => void
  isOwner: boolean
}) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={e => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center md:p-4"
      >
        <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-lg md:max-h-[90vh] overflow-y-auto">
          {/* Photo */}
          {model.photo_url ? (
            <img src={model.photo_url} alt={model.name} className="w-full h-52 object-cover rounded-t-3xl md:rounded-t-2xl" />
          ) : (
            <div className="w-full h-32 bg-muted/50 rounded-t-3xl md:rounded-t-2xl flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold leading-tight">{model.name}</h2>
                <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(model.price_per_unit)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={STATUS_MAP[model.status].variant}>{STATUS_MAP[model.status].label}</Badge>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Materials */}
            {(model.materials || model.yarn_used || model.time_hours != null) && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Materiais e produção</h3>
                {model.yarn_used && <p className="text-sm"><span className="text-muted-foreground">Fio:</span> {model.yarn_used}</p>}
                {model.materials && <p className="text-sm"><span className="text-muted-foreground">Materiais:</span> {model.materials}</p>}
                {(model.time_hours != null || model.time_minutes != null) && (
                  <p className="text-sm"><span className="text-muted-foreground">Tempo:</span> {formatTime(model.time_hours || 0, model.time_minutes || 0)}</p>
                )}
                {model.cost_breakdown && (
                  <div className="bg-muted/40 rounded-xl p-3 text-xs space-y-1">
                    {model.cost_breakdown.materials_cost != null && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Materiais</span><span>{formatCurrency(model.cost_breakdown.materials_cost)}</span></div>
                    )}
                    {model.cost_breakdown.labor_cost != null && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Mão de obra</span><span>{formatCurrency(model.cost_breakdown.labor_cost)}</span></div>
                    )}
                    {model.cost_breakdown.energy_cost != null && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Energia</span><span>{formatCurrency(model.cost_breakdown.energy_cost)}</span></div>
                    )}
                    {model.cost_breakdown.subtotal != null && (
                      <div className="flex justify-between font-medium border-t border-border pt-1 mt-1"><span>Subtotal</span><span>{formatCurrency(model.cost_breakdown.subtotal)}</span></div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Links */}
            {(model.youtube_link || model.tutorial_link || model.material_link || model.stl_link) && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Links úteis</h3>
                <div className="flex flex-wrap gap-2">
                  {model.youtube_link && (
                    <a href={model.youtube_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                      <Youtube className="h-3.5 w-3.5" /> YouTube
                    </a>
                  )}
                  {model.tutorial_link && (
                    <a href={model.tutorial_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                      <BookOpen className="h-3.5 w-3.5" /> Tutorial
                    </a>
                  )}
                  {model.material_link && (
                    <a href={model.material_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                      <ShoppingBag className="h-3.5 w-3.5" /> Material
                    </a>
                  )}
                  {model.stl_link && (
                    <a href={model.stl_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                      <Link2 className="h-3.5 w-3.5" /> STL
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {(model.notes || model.tips) && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observações / dicas</h3>
                {model.notes && <p className="text-sm leading-relaxed whitespace-pre-wrap">{model.notes}</p>}
                {model.tips && <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{model.tips}</p>}
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button onClick={onUseInCalc} className="w-full">
                Usar este modelo na calculadora
              </Button>
              {isOwner && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onEdit} className="flex-1 gap-2">
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button variant="outline" onClick={onDelete} className="flex-1 gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ModelForm({
  editModel, prefillData, onSave, onCancel,
}: {
  editModel: DashboardModel | null
  prefillData?: { type: 'crochet' | '3d'; price: number; breakdown: CostBreakdown } | null
  onSave: () => void
  onCancel: () => void
}) {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState<'crochet' | '3d'>(editModel?.type || prefillData?.type || 'crochet')
  const [name, setName] = useState(editModel?.name || '')
  const [price, setPrice] = useState(editModel?.price_per_unit || prefillData?.price || 0)
  const [status, setStatus] = useState<DashboardModel['status']>(editModel?.status || 'available')
  const [materials, setMaterials] = useState(editModel?.materials || '')
  const [yarnUsed, setYarnUsed] = useState(editModel?.yarn_used || '')
  const [stlLink, setStlLink] = useState(editModel?.stl_link || '')
  const [materialLink, setMaterialLink] = useState(editModel?.material_link || '')
  const [youtubeLink, setYoutubeLink] = useState(editModel?.youtube_link || '')
  const [tutorialLink, setTutorialLink] = useState(editModel?.tutorial_link || '')
  const [notes, setNotes] = useState(editModel?.notes || '')
  const [tips, setTips] = useState(editModel?.tips || '')
  const [timeHours, setTimeHours] = useState(editModel?.time_hours || 0)
  const [timeMinutes, setTimeMinutes] = useState(editModel?.time_minutes || 0)
  const [photoUrl, setPhotoUrl] = useState(editModel?.photo_url || '')
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setPhotoError('Apenas JPG e PNG são aceitos.'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('O arquivo deve ter no máximo 5MB.'); return }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user!.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('model-photos').upload(path, file, { upsert: true })
      if (error) {
        setPhotoError('Erro ao enviar foto: ' + error.message)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('model-photos').getPublicUrl(path)
      setPhotoUrl(publicUrl)
    } catch {
      setPhotoError('Erro ao enviar foto. Verifique sua conexão e tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Informe o nome do modelo'); return }
    if (!price) { toast.error('Informe o preço'); return }
    setSaving(true)

    const payload = {
      user_id: user!.id,
      type, name: name.trim(), price_per_unit: price, status,
      materials: materials || null, yarn_used: yarnUsed || null,
      stl_link: stlLink || null, material_link: materialLink || null,
      youtube_link: youtubeLink || null, tutorial_link: tutorialLink || null,
      notes: notes || null, tips: tips || null,
      time_hours: timeHours || null, time_minutes: timeMinutes || null,
      photo_url: photoUrl || null,
      cost_breakdown: editModel ? (editModel.cost_breakdown ?? null) : (prefillData?.breakdown ?? null),
      updated_at: new Date().toISOString(),
    }

    let error
    if (editModel) {
      ;({ error } = await supabase.from('dashboard_models').update(payload).eq('id', editModel.id))
    } else {
      ;({ error } = await supabase.from('dashboard_models').insert(payload))
    }

    if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return }
    setSaving(false)
    onSave()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editModel ? 'Editar modelo' : 'Novo modelo'}</DialogTitle>
      </DialogHeader>
      <div className="px-6 space-y-4 pb-2">
        {/* Type toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {(['crochet', '3d'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              {t === 'crochet' ? 'Crochê' : 'Impressão 3D'}
            </button>
          ))}
        </div>

        {/* Photo */}
        <div>
          <Label className="text-xs">Foto do modelo</Label>
          <div className="mt-1">
            {photoUrl ? (
              <div className="relative">
                <img src={photoUrl} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button onClick={() => setPhotoUrl('')} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                <span className="text-xs">{uploading ? 'Enviando...' : 'Clique para adicionar foto (JPG/PNG, máx. 5MB)'}</span>
              </button>
            )}
            {photoError && <p className="text-xs text-destructive mt-1">{photoError}</p>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>

        <div>
          <Label className="text-xs">Nome do modelo *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tapete redondo bege" className="mt-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Preço por unidade (R$) *</Label>
            <Input type="number" min="0" step="0.01" value={price || ''} onChange={e => setPrice(parseFloat(e.target.value) || 0)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as DashboardModel['status'])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="in_production">Em produção</SelectItem>
                <SelectItem value="discontinued">Descontinuado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {type === 'crochet' && (
          <div>
            <Label className="text-xs">Fio utilizado</Label>
            <Input value={yarnUsed} onChange={e => setYarnUsed(e.target.value)} placeholder="Ex: Fio 100% algodão" className="mt-1" />
          </div>
        )}
        {type === '3d' && (
          <div>
            <Label className="text-xs">Link do arquivo STL</Label>
            <Input value={stlLink} onChange={e => setStlLink(e.target.value)} placeholder="https://..." className="mt-1" />
          </div>
        )}

        <div>
          <Label className="text-xs">Materiais gerais</Label>
          <Textarea value={materials} onChange={e => setMaterials(e.target.value)} placeholder="Descreva os materiais usados..." className="mt-1 min-h-[60px]" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Tempo — horas</Label>
            <Input type="number" min="0" value={timeHours || ''} onChange={e => setTimeHours(parseInt(e.target.value) || 0)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Minutos</Label>
            <Input type="number" min="0" max="59" value={timeMinutes || ''} onChange={e => setTimeMinutes(parseInt(e.target.value) || 0)} className="mt-1" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Links úteis (opcionais)</Label>
          <Input value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} placeholder="YouTube..." className="text-sm" />
          <Input value={tutorialLink} onChange={e => setTutorialLink(e.target.value)} placeholder="Tutorial..." className="text-sm" />
          <Input value={materialLink} onChange={e => setMaterialLink(e.target.value)} placeholder="Link do material..." className="text-sm" />
        </div>

        <div>
          <Label className="text-xs">Observações</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 min-h-[60px]" />
        </div>
        <div>
          <Label className="text-xs">Dicas</Label>
          <Textarea value={tips} onChange={e => setTips(e.target.value)} className="mt-1 min-h-[60px]" />
        </div>
      </div>
      <DialogFooter className="px-6">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar no Dashboard
        </Button>
      </DialogFooter>
    </>
  )
}
