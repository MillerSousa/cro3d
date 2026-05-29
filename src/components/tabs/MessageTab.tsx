import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, MessageSquare, Sparkles, Scissors, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MessageTabProps {
  prefillPrice?: number
}

export function MessageTab({ prefillPrice }: MessageTabProps) {
  const [type, setType] = useState<'crochet' | '3d'>('crochet')
  const [product, setProduct] = useState('')
  const [totalValue, setTotalValue] = useState(prefillPrice || 0)
  const [includeEntry, setIncludeEntry] = useState(true)
  const [entryPercent, setEntryPercent] = useState(50)
  const [materials, setMaterials] = useState('')
  const [includeDiscount, setIncludeDiscount] = useState(false)
  const [discountValue, setDiscountValue] = useState(0)
  const [discountReason, setDiscountReason] = useState('')
  const [observations, setObservations] = useState('')
  const [footerNote, setFooterNote] = useState('')
  const [generatedMsg, setGeneratedMsg] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  useEffect(() => {
    if (prefillPrice && prefillPrice > 0) setTotalValue(prefillPrice)
  }, [prefillPrice])

  const entry = totalValue * (entryPercent / 100)
  const remaining = totalValue - entry
  const discountEntry = discountValue * (entryPercent / 100)
  const discountRemaining = discountValue - discountEntry

  function generateMessage() {
    if (!product.trim()) { toast.error('Informe o nome do produto'); return }
    if (!totalValue) { toast.error('Informe o valor total'); return }

    // ── Mensagem pronta ─────────────────────────────────────────
    let msg = `${product} fica em ${formatCurrency(totalValue)} 🤍\n\n`

    if (materials.trim()) {
      if (type === 'crochet') {
        msg += `As peças são produzidas artesanalmente em ${materials}, com dedicação e carinho em cada detalhe ✨\n\n`
      } else {
        msg += `A peça é impressa em 3D em ${materials}, com alta precisão e acabamento impecável ✨\n\n`
      }
    }

    if (includeEntry) {
      if (type === 'crochet') {
        msg += `Para iniciar a produção, trabalho com ${entryPercent}% de entrada para compra dos materiais e reserva da encomenda, ficando:\n`
      } else {
        msg += `Para iniciar a produção, trabalho com ${entryPercent}% de entrada para reserva da fila de impressão e compra dos materiais, ficando:\n`
      }
      msg += `• Entrada: ${formatCurrency(entry)}\n`
      msg += `• Restante na entrega: ${formatCurrency(remaining)}`
    } else {
      msg += `O pagamento é realizado integralmente na entrega: ${formatCurrency(totalValue)} 💳`
    }

    if (includeDiscount && discountValue > 0) {
      msg += `\n\n`
      if (discountReason.trim()) {
        msg += `Como ${discountReason}, consigo fazer por ${formatCurrency(discountValue)} 🫶\n`
      } else {
        msg += `Tenho também uma opção especial por ${formatCurrency(discountValue)} 🫶\n`
      }
      if (includeEntry) {
        msg += `• Entrada: ${formatCurrency(discountEntry)}\n`
        msg += `• Restante na entrega: ${formatCurrency(discountRemaining)}\n`
        msg += `Caso fique melhor para você, tá bom?`
      }
    }

    if (observations.trim()) msg += `\n\n${observations}`
    if (footerNote.trim()) msg += `\n\n${footerNote}`

    setGeneratedMsg(msg)

    // ── Prompt para IA ──────────────────────────────────────────
    let prompt = ''
    if (type === 'crochet') {
      prompt = `Crie uma mensagem de venda para WhatsApp para uma peça de crochê artesanal com as seguintes informações:\n`
    } else {
      prompt = `Crie uma mensagem de venda para WhatsApp para uma peça de impressão 3D com as seguintes informações:\n`
    }

    prompt += `- Produto: ${product}\n`
    prompt += `- Valor: ${formatCurrency(totalValue)}\n`

    if (materials.trim()) {
      prompt += `- ${type === 'crochet' ? 'Fio/material' : 'Filamento/material'}: ${materials}\n`
    }

    if (includeEntry) {
      prompt += `- Entrada de ${entryPercent}% = ${formatCurrency(entry)}, restante na entrega ${formatCurrency(remaining)}\n`
    } else {
      prompt += `- Pagamento integral na entrega: ${formatCurrency(totalValue)}\n`
    }

    if (includeDiscount && discountValue > 0) {
      prompt += `- Versão com desconto: ${formatCurrency(discountValue)}`
      if (discountReason.trim()) prompt += ` (motivo: ${discountReason})`
      prompt += `\n`
    }

    if (type === 'crochet') {
      prompt += `\nA mensagem deve ser calorosa e artesanal, transmitindo dedicação, exclusividade e cuidado em cada ponto. Use emojis com moderação (🤍 ✨ 🫶). Tom afetuoso e pessoal, como de artesã para cliente. Inclua as duas opções de preço se aplicável.`
    } else {
      prompt += `\nA mensagem deve destacar a tecnologia de impressão 3D, precisão, personalização e qualidade. Tom profissional mas acessível. Use emojis com moderação (✨ 🎯). Enfatize a customização e o resultado diferenciado. Inclua as duas opções de preço se aplicável.`
    }

    setGeneratedPrompt(prompt)
    toast.success('Mensagem gerada!')
  }

  async function copyText(text: string, which: 'msg' | 'prompt') {
    await navigator.clipboard.writeText(text)
    if (which === 'msg') { setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000) }
    else { setCopiedPrompt(true); setTimeout(() => setCopiedPrompt(false), 2000) }
    toast.success('Copiado!')
  }

  return (
    <div className="space-y-4 pb-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <MessageSquare className="h-4 w-4" />
            Proposta Para Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">

          {/* Tipo: Crochê / Impressão 3D */}
          <div className="flex rounded-xl bg-muted p-0.5 gap-0.5">
            <button
              onClick={() => setType('crochet')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium transition-all',
                type === 'crochet'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Scissors className="h-3 w-3" /> Crochê
            </button>
            <button
              onClick={() => setType('3d')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium transition-all',
                type === '3d'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Box className="h-3 w-3" /> Impressão 3D
            </button>
          </div>

          {/* Produto */}
          <div>
            <Label className="text-xs">Produto / descrição</Label>
            <Input
              value={product}
              onChange={e => setProduct(e.target.value)}
              placeholder={type === 'crochet'
                ? 'Ex: Kit 8 sousplats branco com borda dourada'
                : 'Ex: Copo Stanley Miniatura personalizado'}
              className="mt-1"
            />
          </div>

          {/* Valor */}
          <div>
            <Label className="text-xs">Valor total (R$)</Label>
            <Input
              type="number" min="0" step="0.01"
              value={totalValue || ''}
              onChange={e => setTotalValue(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              className="mt-1"
            />
          </div>

          {/* Toggle entrada */}
          <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-muted/40">
            <div>
              <p className="text-sm font-medium">Cobrar entrada?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {includeEntry ? 'Pagamento parcial antes da entrega' : 'Pagamento integral na entrega'}
              </p>
            </div>
            <Switch checked={includeEntry} onCheckedChange={setIncludeEntry} />
          </div>

          {/* % de entrada (só se ativado) */}
          {includeEntry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div>
                <Label className="text-xs">% de entrada</Label>
                <div className="relative mt-1">
                  <Input
                    type="number" min="0" max="100"
                    value={entryPercent || ''}
                    onChange={e => setEntryPercent(parseFloat(e.target.value) || 0)}
                    className="pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
              {totalValue > 0 && (
                <div className="flex gap-4 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                  <span>Entrada: <strong className="text-foreground">{formatCurrency(entry)}</strong></span>
                  <span>Restante: <strong className="text-foreground">{formatCurrency(remaining)}</strong></span>
                </div>
              )}
            </motion.div>
          )}

          {/* Materiais */}
          <div>
            <Label className="text-xs">
              {type === 'crochet' ? 'Materiais / fio utilizado (opcional)' : 'Filamento / material (opcional)'}
            </Label>
            <Textarea
              value={materials}
              onChange={e => setMaterials(e.target.value)}
              placeholder={type === 'crochet'
                ? 'Ex: fio 100% algodão com acabamento em fio dourado viscose'
                : 'Ex: PLA fosco cinza, PETG transparente'}
              className="mt-1 min-h-[64px]"
            />
          </div>

          {/* Toggle desconto */}
          <div className="flex items-center justify-between py-1">
            <Label className="text-sm cursor-pointer">Incluir opção com desconto?</Label>
            <Switch checked={includeDiscount} onCheckedChange={setIncludeDiscount} />
          </div>

          {includeDiscount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Valor com desconto (R$)</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={discountValue || ''}
                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Motivo</Label>
                  <Input
                    value={discountReason}
                    onChange={e => setDiscountReason(e.target.value)}
                    placeholder="Ex: fase de fidelização"
                    className="mt-1"
                  />
                </div>
              </div>
              {discountValue > 0 && includeEntry && (
                <div className="flex gap-4 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                  <span>Entrada: <strong className="text-foreground">{formatCurrency(discountEntry)}</strong></span>
                  <span>Restante: <strong className="text-foreground">{formatCurrency(discountRemaining)}</strong></span>
                </div>
              )}
            </motion.div>
          )}

          {/* Observações */}
          <div>
            <Label className="text-xs">Observações extras (opcional)</Label>
            <Textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              placeholder="Qualquer informação adicional para a cliente..."
              className="mt-1 min-h-[60px]"
            />
          </div>

          {/* Nota de rodapé */}
          <div>
            <Label className="text-xs">Nota de rodapé personalizada (opcional)</Label>
            <Textarea
              value={footerNote}
              onChange={e => setFooterNote(e.target.value.slice(0, 150))}
              placeholder="Ex: Qualquer dúvida estou à disposição 🫶"
              maxLength={150}
              className="mt-1 min-h-[52px]"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{footerNote.length}/150</p>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={generateMessage} className="w-full gap-2">
              <MessageSquare className="h-4 w-4" />
              Gerar Mensagem Pronta
            </Button>
            <Button variant="outline" onClick={generateMessage} className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar Prompt para IA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mensagem gerada */}
      {generatedMsg && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Mensagem Para WhatsApp</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => copyText(generatedMsg, 'msg')} className="gap-1.5 h-8">
                  {copiedMsg ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  {copiedMsg ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground bg-muted/30 rounded-xl p-4">{generatedMsg}</pre>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Prompt para IA */}
      {generatedPrompt && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-accent/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Prompt Para IA (Claude / ChatGPT)</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => copyText(generatedPrompt, 'prompt')} className="gap-1.5 h-8">
                  {copiedPrompt ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  {copiedPrompt ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground bg-muted/30 rounded-xl p-4">{generatedPrompt}</pre>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
