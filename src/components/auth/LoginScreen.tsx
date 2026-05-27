import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    await signInWithGoogle()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C4704F] to-[#a85a3e] flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl tracking-tight">C3</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Cro3D</h1>
            <p className="text-sm text-muted-foreground mt-1">Calculadora de precificação</p>
          </div>
        </div>

        {/* Login card */}
        <div className="w-full bg-white dark:bg-card rounded-2xl border border-border card-shadow p-6 flex flex-col gap-4">
          <div className="text-center">
            <h2 className="font-semibold text-foreground text-base">Bem-vinda de volta</h2>
            <p className="text-sm text-muted-foreground mt-1">Entre com sua conta Google para acessar</p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            size="lg"
            className="w-full gap-3 text-base font-medium"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" fillOpacity=".9"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".8"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" fillOpacity=".7"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".6"/>
              </svg>
            )}
            {loading ? 'Entrando...' : 'Entrar com Google'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Acesso restrito a usuários autorizados
        </p>
      </motion.div>
    </div>
  )
}
