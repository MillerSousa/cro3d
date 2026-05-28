import {
  ArrowLeft, Image as ImageIcon, Scissors, Play,
  BookOpen, ShoppingBag, Link2, Clock, Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatTime } from '@/lib/utils'
import { DashboardModel } from '@/lib/types'

const STATUS_MAP = {
  available: { label: 'Disponível', variant: 'available' as const },
  in_production: { label: 'Em produção', variant: 'in_production' as const },
  discontinued: { label: 'Descontinuado', variant: 'discontinued' as const },
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return m ? m[1] : null
}

interface FabricarPageProps {
  model: DashboardModel
  onBack: () => void
  onUseInCalc: (model: DashboardModel) => void
}

export function FabricarPage({ model, onBack, onUseInCalc }: FabricarPageProps) {
  const youtubeId = model.youtube_link ? getYouTubeId(model.youtube_link) : null
  const hasLinks = !!(model.material_link || model.tutorial_link || model.stl_link)
  const hasProductionInfo = !!(
    model.yarn_used || model.time_hours != null ||
    model.time_minutes != null || model.materials ||
    model.notes || model.tips
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -ml-1 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <span className="font-semibold text-sm truncate flex-1">{model.name}</span>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 px-4 py-4 md:px-6 md:py-6 pb-28 max-w-2xl w-full mx-auto space-y-4">

        {/* Hero */}
        <div>
          {model.photo_url ? (
            <img
              src={model.photo_url}
              alt={model.name}
              className="w-full h-72 object-cover rounded-2xl"
            />
          ) : (
            <div className="w-full h-72 bg-muted/50 rounded-2xl flex flex-col items-center justify-center gap-3">
              <Scissors className="h-12 w-12 text-muted-foreground/30" />
              <ImageIcon className="h-6 w-6 text-muted-foreground/20" />
            </div>
          )}
          <div className="mt-4 space-y-2">
            <h1 className="text-2xl font-bold leading-tight">{model.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={STATUS_MAP[model.status].variant}>
                {STATUS_MAP[model.status].label}
              </Badge>
              <span className="text-2xl font-bold text-primary">{formatCurrency(model.price_per_unit)}</span>
            </div>
          </div>
        </div>

        {/* Informações de produção */}
        {hasProductionInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Package className="h-4 w-4" />
                Informações de produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {model.yarn_used && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Fio(s) utilizado(s)</p>
                  <p className="text-sm">{model.yarn_used}</p>
                </div>
              )}
              {(model.time_hours != null || model.time_minutes != null) && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{formatTime(model.time_hours || 0, model.time_minutes || 0)}</span>
                </div>
              )}
              {model.materials && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Materiais adicionais</p>
                  <p className="text-sm whitespace-pre-wrap">{model.materials}</p>
                </div>
              )}
              {(model.notes || model.tips) && (
                <Separator />
              )}
              {model.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Observações</p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{model.notes}</p>
                </div>
              )}
              {model.tips && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Dicas</p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">{model.tips}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tutorial YouTube */}
        {youtubeId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Play className="h-4 w-4" />
                Tutorial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Tutorial em vídeo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receita */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <BookOpen className="h-4 w-4" />
              Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {model.crochet_recipe ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{model.crochet_recipe}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhuma receita cadastrada para este modelo.</p>
            )}
          </CardContent>
        </Card>

        {/* Links úteis */}
        {hasLinks && (
          <div className="flex flex-wrap gap-2">
            {model.material_link && (
              <a
                href={model.material_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <ShoppingBag className="h-3.5 w-3.5" /> Material
              </a>
            )}
            {model.tutorial_link && (
              <a
                href={model.tutorial_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" /> Tutorial
              </a>
            )}
            {model.stl_link && (
              <a
                href={model.stl_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <Link2 className="h-3.5 w-3.5" /> STL
              </a>
            )}
          </div>
        )}
      </main>

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-card/95 backdrop-blur-md border-t border-border z-20">
        <div className="max-w-2xl mx-auto">
          <Button onClick={() => onUseInCalc(model)} className="w-full">
            Usar na calculadora
          </Button>
        </div>
      </div>
    </div>
  )
}
