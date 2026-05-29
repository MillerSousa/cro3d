import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Trash2, Loader2, Users, BarChart3, LogOut,
  Pencil, Globe, Layers, ExternalLink, Scissors,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AllowedUser, UserRole, FilamentBrand, Filament, YarnBrand } from '@/lib/types'
import { cn, formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  crochet: 'Crochê',
  '3d': '3D',
  both: 'Crochê + 3D',
}

// ── Logo da marca com fallback para inicial ─────────────────────
function BrandLogo({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!logoUrl || failed) {
    return (
      <div className={cn('rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0', className || 'w-8 h-8')}>
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={logoUrl}
      alt={name}
      className={cn('rounded-lg object-cover shrink-0', className || 'w-8 h-8')}
      onError={() => setFailed(true)}
    />
  )
}

export function AdminTab() {
  const { allowedUser, signOut } = useAuth()
  const isAdmin = allowedUser?.role === 'admin'
  const isCrochetUser = ['admin', 'crochet', 'both'].includes(allowedUser?.role || '')

  // ── Usuários ────────────────────────────────────────────────
  const [users, setUsers] = useState<AllowedUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('crochet')
  const [saving, setSaving] = useState(false)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null)

  // ── Estatísticas ────────────────────────────────────────────
  const [stats, setStats] = useState<{ total: number; byUser: { name: string; count: number }[] } | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // ── Marcas de filamento ──────────────────────────────────────
  const [brands, setBrands] = useState<FilamentBrand[]>([])
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [editBrand, setEditBrand] = useState<FilamentBrand | null>(null)
  const [brandName, setBrandName] = useState('')
  const [brandWebsite, setBrandWebsite] = useState('')
  const [brandLogo, setBrandLogo] = useState('')
  const [savingBrand, setSavingBrand] = useState(false)
  const [confirmDeleteBrand, setConfirmDeleteBrand] = useState<string | null>(null)

  // ── Filamentos ───────────────────────────────────────────────
  const [filaments, setFilaments] = useState<Filament[]>([])
  const [loadingFilaments, setLoadingFilaments] = useState(true)
  const [showFilamentForm, setShowFilamentForm] = useState(false)
  const [editFilament, setEditFilament] = useState<Filament | null>(null)
  const [filamentName, setFilamentName] = useState('')
  const [filamentBrandId, setFilamentBrandId] = useState<string>('none')
  const [filamentPrice, setFilamentPrice] = useState(0)
  const [savingFilament, setSavingFilament] = useState(false)
  const [confirmDeleteFilament, setConfirmDeleteFilament] = useState<string | null>(null)

  // ── Marcas de fio ────────────────────────────────────────────
  const [yarnBrands, setYarnBrands] = useState<YarnBrand[]>([])
  const [loadingYarnBrands, setLoadingYarnBrands] = useState(true)
  const [showYarnBrandForm, setShowYarnBrandForm] = useState(false)
  const [editYarnBrand, setEditYarnBrand] = useState<YarnBrand | null>(null)
  const [yarnBrandName, setYarnBrandName] = useState('')
  const [yarnBrandWebsite, setYarnBrandWebsite] = useState('')
  const [yarnBrandLogo, setYarnBrandLogo] = useState('')
  const [savingYarnBrand, setSavingYarnBrand] = useState(false)
  const [confirmDeleteYarnBrand, setConfirmDeleteYarnBrand] = useState<string | null>(null)

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
      fetchStats()
      fetchBrands()
      fetchFilaments()
    }
  }, [isAdmin])

  useEffect(() => {
    if (isCrochetUser) fetchYarnBrands()
  }, [isCrochetUser])

  // ── Usuários ─────────────────────────────────────────────────
  async function fetchUsers() {
    setLoadingUsers(true)
    const { data } = await supabase.from('allowed_users').select('*').order('created_at')
    if (data) setUsers(data as AllowedUser[])
    setLoadingUsers(false)
  }

  async function fetchStats() {
    setLoadingStats(true)
    const { data: models } = await supabase.from('dashboard_models').select('user_id')
    const { data: allowedData } = await supabase.from('allowed_users').select('id, name, email, auth_user_id')
    if (models && allowedData) {
      const countMap: Record<string, number> = {}
      models.forEach(m => { countMap[m.user_id] = (countMap[m.user_id] || 0) + 1 })
      setStats({
        total: models.length,
        byUser: allowedData
          .filter(u => u.auth_user_id)
          .map(u => ({ name: u.name, count: countMap[u.auth_user_id!] || 0 }))
          .sort((a, b) => b.count - a.count),
      })
    }
    setLoadingStats(false)
  }

  async function updateRole(id: string, role: UserRole) {
    const { error } = await supabase.from('allowed_users').update({ role }).eq('id', id)
    if (error) { toast.error('Erro ao atualizar'); return }
    setUsers(p => p.map(u => u.id === id ? { ...u, role } : u))
    toast.success('Permissão atualizada')
  }

  async function addUser() {
    if (!newName.trim() || !newEmail.trim()) { toast.error('Preencha nome e e-mail'); return }
    setSaving(true)
    const { error } = await supabase.from('allowed_users').insert({
      name: newName.trim(), email: newEmail.trim().toLowerCase(), role: newRole,
    })
    if (error) {
      toast.error(error.message.includes('unique') ? 'E-mail já cadastrado' : 'Erro ao adicionar: ' + error.message)
      setSaving(false); return
    }
    toast.success(`${newName} adicionado!`)
    setNewName(''); setNewEmail(''); setNewRole('crochet'); setShowAddForm(false); setSaving(false)
    fetchUsers()
  }

  async function deleteUser(id: string) {
    const { error } = await supabase.from('allowed_users').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    setUsers(p => p.filter(u => u.id !== id))
    setConfirmDeleteUser(null)
    toast.success('Usuário removido')
  }

  // ── Marcas de filamento ──────────────────────────────────────
  async function fetchBrands() {
    setLoadingBrands(true)
    const { data } = await supabase.from('filament_brands').select('*').order('name')
    if (data) setBrands(data as FilamentBrand[])
    setLoadingBrands(false)
  }

  function openBrandForm(brand?: FilamentBrand) {
    if (brand) {
      setEditBrand(brand); setBrandName(brand.name)
      setBrandWebsite(brand.website_url); setBrandLogo(brand.logo_url || '')
    } else {
      setEditBrand(null); setBrandName(''); setBrandWebsite(''); setBrandLogo('')
    }
    setShowBrandForm(true)
  }

  async function saveBrand() {
    if (!brandName.trim()) { toast.error('Nome é obrigatório'); return }
    if (!brandWebsite.trim()) { toast.error('URL do site é obrigatória'); return }
    setSavingBrand(true)
    const payload = { name: brandName.trim(), website_url: brandWebsite.trim(), logo_url: brandLogo.trim() || null }
    if (editBrand) {
      const { error } = await supabase.from('filament_brands').update(payload).eq('id', editBrand.id)
      if (error) { toast.error('Erro ao salvar marca'); setSavingBrand(false); return }
      setBrands(p => p.map(b => b.id === editBrand.id ? { ...b, ...payload } : b).sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Marca atualizada')
    } else {
      const { data, error } = await supabase.from('filament_brands').insert(payload).select().single()
      if (error || !data) { toast.error('Erro ao salvar marca'); setSavingBrand(false); return }
      setBrands(p => [...p, data as FilamentBrand].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Marca adicionada')
    }
    setShowBrandForm(false); setEditBrand(null); setSavingBrand(false)
  }

  async function deleteBrand(id: string) {
    const { error } = await supabase.from('filament_brands').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir marca'); return }
    setBrands(p => p.filter(b => b.id !== id))
    setConfirmDeleteBrand(null)
    toast.success('Marca removida')
  }

  // ── Filamentos ───────────────────────────────────────────────
  async function fetchFilaments() {
    setLoadingFilaments(true)
    const { data } = await supabase
      .from('filaments')
      .select('*, brand:filament_brands(id, name, logo_url)')
      .order('name')
    if (data) setFilaments(data as Filament[])
    setLoadingFilaments(false)
  }

  function openFilamentForm(fil?: Filament) {
    if (fil) {
      setEditFilament(fil); setFilamentName(fil.name)
      setFilamentBrandId(fil.brand_id || 'none'); setFilamentPrice(fil.price_per_kg)
    } else {
      setEditFilament(null); setFilamentName(''); setFilamentBrandId('none'); setFilamentPrice(0)
    }
    setShowFilamentForm(true)
  }

  async function saveFilament() {
    if (!filamentName.trim()) { toast.error('Nome é obrigatório'); return }
    if (!filamentPrice) { toast.error('Preço é obrigatório'); return }
    setSavingFilament(true)
    const payload = {
      name: filamentName.trim(),
      brand_id: filamentBrandId === 'none' ? null : filamentBrandId,
      price_per_kg: filamentPrice,
    }
    if (editFilament) {
      const { error } = await supabase.from('filaments').update(payload).eq('id', editFilament.id)
      if (error) { toast.error('Erro ao salvar filamento'); setSavingFilament(false); return }
      toast.success('Filamento atualizado')
    } else {
      const { error } = await supabase.from('filaments').insert(payload)
      if (error) { toast.error('Erro ao salvar filamento'); setSavingFilament(false); return }
      toast.success('Filamento adicionado')
    }
    setShowFilamentForm(false); setEditFilament(null); setSavingFilament(false)
    fetchFilaments()
  }

  async function deleteFilament(id: string) {
    const { error } = await supabase.from('filaments').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir filamento'); return }
    setFilaments(p => p.filter(f => f.id !== id))
    setConfirmDeleteFilament(null)
    toast.success('Filamento removido')
  }

  // ── Marcas de fio ────────────────────────────────────────────
  async function fetchYarnBrands() {
    setLoadingYarnBrands(true)
    const { data } = await supabase.from('yarn_brands').select('*').order('name')
    if (data) setYarnBrands(data as YarnBrand[])
    setLoadingYarnBrands(false)
  }

  function openYarnBrandForm(brand?: YarnBrand) {
    if (brand) {
      setEditYarnBrand(brand); setYarnBrandName(brand.name)
      setYarnBrandWebsite(brand.website_url || ''); setYarnBrandLogo(brand.logo_url || '')
    } else {
      setEditYarnBrand(null); setYarnBrandName(''); setYarnBrandWebsite(''); setYarnBrandLogo('')
    }
    setShowYarnBrandForm(true)
  }

  async function saveYarnBrand() {
    if (!yarnBrandName.trim()) { toast.error('Nome é obrigatório'); return }
    setSavingYarnBrand(true)
    const payload = {
      name: yarnBrandName.trim(),
      website_url: yarnBrandWebsite.trim() || '',
      logo_url: yarnBrandLogo.trim() || null,
    }
    if (editYarnBrand) {
      const { error } = await supabase.from('yarn_brands').update(payload).eq('id', editYarnBrand.id)
      if (error) { toast.error('Erro ao salvar marca'); setSavingYarnBrand(false); return }
      setYarnBrands(p => p.map(b => b.id === editYarnBrand.id ? { ...b, ...payload } : b).sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Marca atualizada')
    } else {
      const { data, error } = await supabase.from('yarn_brands').insert(payload).select().single()
      if (error || !data) { toast.error('Erro ao salvar marca'); setSavingYarnBrand(false); return }
      setYarnBrands(p => [...p, data as YarnBrand].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Marca adicionada')
    }
    setShowYarnBrandForm(false); setEditYarnBrand(null); setSavingYarnBrand(false)
  }

  async function deleteYarnBrand(id: string) {
    const { error } = await supabase.from('yarn_brands').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir marca'); return }
    setYarnBrands(p => p.filter(b => b.id !== id))
    setConfirmDeleteYarnBrand(null)
    toast.success('Marca removida')
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-4">

      {/* Perfil + sair */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {allowedUser?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{allowedUser?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{allowedUser?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="shrink-0 gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seções exclusivas de admin */}
      {isAdmin && <>

        {/* Usuários */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="h-4 w-4" /> Usuários
              </CardTitle>
              <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <button onClick={() => setConfirmDeleteUser(u.id)}
                        className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Select value={u.role} onValueChange={v => updateRole(u.id, v as UserRole)}>
                      <SelectTrigger className="w-full h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r, l]) => (
                          <SelectItem key={r} value={r}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário cadastrado.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <BarChart3 className="h-4 w-4" /> Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-2/3" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <p className="text-xs text-primary/70">Total de modelos cadastrados</p>
                  <p className="text-3xl font-bold text-primary">{stats?.total ?? 0}</p>
                </div>
                {stats && stats.byUser.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Por usuário</p>
                    {stats.byUser.map(u => (
                      <div key={u.name} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/40 text-sm">
                        <span>{u.name}</span>
                        <span className="font-medium text-primary">{u.count} modelos</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marcas de Filamento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Globe className="h-4 w-4" /> Marcas de Filamento
              </CardTitle>
              <Button size="sm" onClick={() => openBrandForm()} className="gap-1.5">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingBrands ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : brands.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma marca cadastrada.</p>
            ) : (
              <div className="space-y-2">
                {brands.map(brand => (
                  <motion.div key={brand.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                    <BrandLogo name={brand.name} logoUrl={brand.logo_url} />
                    <div className="flex-1 min-w-0">
                      <a href={brand.website_url} target="_blank" rel="noreferrer"
                        className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 w-fit">
                        {brand.name}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openBrandForm(brand)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmDeleteBrand(brand.id)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filamentos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Layers className="h-4 w-4" /> Filamentos
              </CardTitle>
              <Button size="sm" onClick={() => openFilamentForm()} className="gap-1.5">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingFilaments ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filaments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum filamento cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {filaments.map(fil => (
                  <motion.div key={fil.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{fil.name}</span>
                        {fil.brand && (
                          <div className="flex items-center gap-1">
                            <BrandLogo name={fil.brand.name} logoUrl={fil.brand.logo_url} className="w-4 h-4" />
                            <span className="text-xs text-muted-foreground">{fil.brand.name}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-primary font-semibold">{formatCurrency(fil.price_per_kg)}/kg</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openFilamentForm(fil)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmDeleteFilament(fil.id)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </> /* end isAdmin */}

      {/* Marcas de Fio — acessível para crochê, ambos e admin */}
      {isCrochetUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Scissors className="h-4 w-4" /> Marcas de Fio
              </CardTitle>
              <Button size="sm" onClick={() => openYarnBrandForm()} className="gap-1.5">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingYarnBrands ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : yarnBrands.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma marca de fio cadastrada.</p>
            ) : (
              <div className="space-y-2">
                {yarnBrands.map(brand => (
                  <motion.div key={brand.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                    <BrandLogo name={brand.name} logoUrl={brand.logo_url} />
                    <div className="flex-1 min-w-0">
                      {brand.website_url ? (
                        <a href={brand.website_url} target="_blank" rel="noreferrer"
                          className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 w-fit">
                          {brand.name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      ) : (
                        <span className="text-sm font-medium">{brand.name}</span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openYarnBrandForm(brand)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmDeleteYarnBrand(brand.id)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────── */}

      {/* Adicionar usuário */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-3 px-6">
            <div>
              <Label>Nome</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome completo" className="mt-1" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@gmail.com" className="mt-1" />
            </div>
            <div>
              <Label>Permissão</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as UserRole)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r, l]) => (
                    <SelectItem key={r} value={r}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
            <Button onClick={addUser} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão de usuário */}
      <Dialog open={!!confirmDeleteUser} onOpenChange={v => !v && setConfirmDeleteUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover Usuário?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground px-6">O usuário perderá acesso ao app imediatamente.</p>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmDeleteUser(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDeleteUser && deleteUser(confirmDeleteUser)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marca de filamento — form */}
      <Dialog open={showBrandForm} onOpenChange={open => { setShowBrandForm(open); if (!open) setEditBrand(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editBrand ? 'Editar Marca' : 'Adicionar Marca'}</DialogTitle></DialogHeader>
          <div className="space-y-3 px-6">
            <div>
              <Label>Nome da marca</Label>
              <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Ex: Bambu Lab" className="mt-1" />
            </div>
            <div>
              <Label>URL do site</Label>
              <Input type="url" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label>URL da logo <span className="text-muted-foreground">(opcional)</span></Label>
              <Input type="url" value={brandLogo} onChange={e => setBrandLogo(e.target.value)} placeholder="https://..." className="mt-1" />
              {brandLogo && <img src={brandLogo} alt="" className="mt-2 w-10 h-10 rounded-lg object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
            </div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setShowBrandForm(false)}>Cancelar</Button>
            <Button onClick={saveBrand} disabled={savingBrand} className="gap-2">
              {savingBrand && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marca de filamento — confirmar exclusão */}
      <Dialog open={!!confirmDeleteBrand} onOpenChange={v => !v && setConfirmDeleteBrand(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover Marca?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground px-6">Os filamentos vinculados ficarão sem marca.</p>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmDeleteBrand(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDeleteBrand && deleteBrand(confirmDeleteBrand)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filamento — form */}
      <Dialog open={showFilamentForm} onOpenChange={open => { setShowFilamentForm(open); if (!open) setEditFilament(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editFilament ? 'Editar Filamento' : 'Adicionar Filamento'}</DialogTitle></DialogHeader>
          <div className="space-y-3 px-6">
            <div>
              <Label>Nome do filamento</Label>
              <Input value={filamentName} onChange={e => setFilamentName(e.target.value)} placeholder="Ex: PLA, PETG, ABS" className="mt-1" />
            </div>
            <div>
              <Label>Marca <span className="text-muted-foreground">(opcional)</span></Label>
              <Select value={filamentBrandId} onValueChange={setFilamentBrandId}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem marca</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preço por kg (R$)</Label>
              <Input type="number" min="0" step="0.01" value={filamentPrice || ''} onChange={e => setFilamentPrice(parseFloat(e.target.value) || 0)} placeholder="85,40" className="mt-1" />
            </div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setShowFilamentForm(false)}>Cancelar</Button>
            <Button onClick={saveFilament} disabled={savingFilament} className="gap-2">
              {savingFilament && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filamento — confirmar exclusão */}
      <Dialog open={!!confirmDeleteFilament} onOpenChange={v => !v && setConfirmDeleteFilament(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover Filamento?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground px-6">Esta ação não pode ser desfeita.</p>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmDeleteFilament(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDeleteFilament && deleteFilament(confirmDeleteFilament)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marca de fio — form */}
      <Dialog open={showYarnBrandForm} onOpenChange={open => { setShowYarnBrandForm(open); if (!open) setEditYarnBrand(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editYarnBrand ? 'Editar Marca de Fio' : 'Adicionar Marca de Fio'}</DialogTitle></DialogHeader>
          <div className="space-y-3 px-6">
            <div>
              <Label>Nome da marca</Label>
              <Input value={yarnBrandName} onChange={e => setYarnBrandName(e.target.value)} placeholder="Ex: Circulo, Pingouin" className="mt-1" />
            </div>
            <div>
              <Label>URL do site <span className="text-muted-foreground">(opcional)</span></Label>
              <Input type="url" value={yarnBrandWebsite} onChange={e => setYarnBrandWebsite(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label>URL da logo <span className="text-muted-foreground">(opcional — link direto da foto)</span></Label>
              <Input type="url" value={yarnBrandLogo} onChange={e => setYarnBrandLogo(e.target.value)} placeholder="https://..." className="mt-1" />
              {yarnBrandLogo && <img src={yarnBrandLogo} alt="" className="mt-2 w-10 h-10 rounded-lg object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
            </div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setShowYarnBrandForm(false)}>Cancelar</Button>
            <Button onClick={saveYarnBrand} disabled={savingYarnBrand} className="gap-2">
              {savingYarnBrand && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marca de fio — confirmar exclusão */}
      <Dialog open={!!confirmDeleteYarnBrand} onOpenChange={v => !v && setConfirmDeleteYarnBrand(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover Marca de Fio?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground px-6">Esta ação não pode ser desfeita.</p>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmDeleteYarnBrand(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDeleteYarnBrand && deleteYarnBrand(confirmDeleteYarnBrand)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
