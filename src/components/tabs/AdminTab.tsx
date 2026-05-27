import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Loader2, Users, BarChart3, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AllowedUser, UserRole } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  crochet: 'Crochê',
  '3d': '3D',
  both: 'Crochê + 3D',
}

export function AdminTab() {
  const { allowedUser, signOut } = useAuth()
  const isAdmin = allowedUser?.role === 'admin'

  const [users, setUsers] = useState<AllowedUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('crochet')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [stats, setStats] = useState<{ total: number; byUser: { name: string; count: number }[] } | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
      fetchStats()
    }
  }, [isAdmin])

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
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
    })
    if (error) {
      toast.error(error.message.includes('unique') ? 'E-mail já cadastrado' : 'Erro ao adicionar: ' + error.message)
      setSaving(false)
      return
    }
    toast.success(`${newName} adicionado!`)
    setNewName('')
    setNewEmail('')
    setNewRole('crochet')
    setShowAddForm(false)
    setSaving(false)
    fetchUsers()
  }

  async function deleteUser(id: string) {
    const { error } = await supabase.from('allowed_users').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    setUsers(p => p.filter(u => u.id !== id))
    setConfirmDelete(null)
    toast.success('Usuário removido')
  }

  return (
    <div className="space-y-4 pb-4">
      {/* User info + sign out */}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="shrink-0 gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin-only sections */}
      {isAdmin && <>

      {/* Users section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-4 w-4" />
              Usuários
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
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => setConfirmDelete(u.id)}
                      className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Select value={u.role} onValueChange={v => updateRole(u.id, v as UserRole)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
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

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
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

      </> /* end isAdmin */}

      {/* Add user dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar usuário</DialogTitle></DialogHeader>
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
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover usuário?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground px-6">O usuário perderá acesso ao app imediatamente.</p>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteUser(confirmDelete)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
