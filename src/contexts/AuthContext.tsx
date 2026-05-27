import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AllowedUser } from '@/lib/types'
import { toast } from 'sonner'

const CACHE_KEY = 'cro3d_au'

function readCache(): AllowedUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Revalida cache a cada 24h forçando novo login
    const age = Date.now() - (parsed.cachedAt ?? 0)
    if (age > 86_400_000) { localStorage.removeItem(CACHE_KEY); return null }
    return parsed.user as AllowedUser
  } catch { return null }
}

function writeCache(au: AllowedUser | null) {
  if (au) localStorage.setItem(CACHE_KEY, JSON.stringify({ user: au, cachedAt: Date.now() }))
  else localStorage.removeItem(CACHE_KEY)
}

async function fetchAllowedUser(email: string): Promise<AllowedUser | null> {
  try {
    const { data, error } = await supabase
      .from('allowed_users')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    if (error) return null
    return data as AllowedUser | null
  } catch {
    return null
  }
}

interface AuthContextType {
  session: Session | null
  user: User | null
  allowedUser: AllowedUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [allowedUser, setAllowedUser] = useState<AllowedUser | null>(readCache)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // No refresh: getSession() lê localStorage (sem bater no banco).
    // Se tiver cache de allowedUser, o app abre instantaneamente.
    // A query ao banco só acontece no SIGNED_IN (login ativo).
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        setSession(s)
        setUser(s.user)
        // allowedUser já foi carregado do cache via useState(readCache)
        // Se não há cache, mostra LoginScreen (usuário precisa fazer login)
      } else {
        setSession(null)
        setUser(null)
        setAllowedUser(null)
        writeCache(null)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'SIGNED_IN' && s?.user) {
        // Se já há cache válido, é uma restauração de sessão (refresh da página).
        // Não consulta o banco nem toca no loading — getSession() já cuidou disso.
        const cached = readCache()
        if (cached) {
          setSession(s); setUser(s.user); setAllowedUser(cached)
          return
        }
        // Sem cache = login real (OAuth redirect). Consulta o banco.
        setLoading(true)
        const au = await fetchAllowedUser(s.user.email!)
        if (!au) {
          await supabase.auth.signOut()
          setSession(null); setUser(null); setAllowedUser(null)
          writeCache(null)
          toast.error('Acesso não autorizado. Fale com o administrador.')
        } else {
          // Vincula o auth.uid ao allowed_users para permitir joins de estatísticas
          if (!au.auth_user_id) {
            await supabase.from('allowed_users')
              .update({ auth_user_id: s.user.id })
              .eq('email', s.user.email!)
          }
          setSession(s); setUser(s.user); setAllowedUser(au)
          writeCache(au)
        }
        setLoading(false)
      }

      if (event === 'SIGNED_OUT') {
        setSession(null); setUser(null); setAllowedUser(null)
        writeCache(null)
        setLoading(false)
      }

      if (event === 'TOKEN_REFRESHED' && s) {
        setSession(s); setUser(s.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) toast.error('Erro ao entrar com Google: ' + error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
    writeCache(null)
    toast.success('Saiu com sucesso')
  }

  return (
    <AuthContext.Provider value={{ session, user, allowedUser, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
