import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface MessageTabProps {
  prefillPrice?: number
}

export function MessageTab({ prefillPrice }: MessageTabProps) {
  const [product, setProduct] = useState('')
  const [totalValue, setTotalValue] = useState(prefillPrice || 0)
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

    let msg = `${product} fica em ${formatCurrency(totalValue)} 🤍\n\n`
    if (materials.trim()) {
      msg += `As peças são produzidas artesanalmente em ${materials}, trazendo um toque sofisticado e elegante ✨\n\n`
    }
    msg += `Para iniciar a produção, trabalho com ${entryPercent}% de entrada para compra dos materiais e reserva da encomenda, ficando:\n`
    msg += `• Entrada: ${formatCurrency(entry)}\n`
    msg += `• Restante na entrega: ${formatCurrency(remaining)}`

    if (includeDiscount && discountValue > 0) {
      msg += `\n\n`
      if (discountReason.trim()) {
        msg += `Como ${discountReason}, consigo fazer por ${formatCurrency(discountValue)} 🫶\n`
      } else {
        msg += `Tenho também uma opção especial por ${formatCurrency(discountValue)} 🫶\n`
      }
      msg += `• Entrada: ${formatCurrency(discountEntry)}\n`
      msg += `• Restante na entrega: ${formatCurrency(discountRemaining)}\n`
      msg += `Caso fique melhor para você, tá bom?`
    }

    if (observations.trim()) {
      msg += `\n\n${observations}`
    }

    if (footerNote.trim()) {
      msg += `\n\n${footerNote}`
    }

    setGeneratedMsg(msg)

    let prompt = `Crie uma mensagem de venda para WhatsApp com essas informações:\n`
    prompt += `- Produto: ${product}\n`
    prompt += `- Valor: ${formatCurrency(totalValue)}\n`
    if (materials.trim()) prompt += `- Materiais: ${materials}\n`
    prompt += `- Entrada de ${entryPercent}% = ${formatCurrency(entry)}, restante ${formatCurrency(remaining)}\n`
    if (includeDiscount && discountValue > 0) {
      prompt += `- Versão com desconto: ${formatCurrency(discountValue)}`
      if (discountReason.trim()) prompt += ` (motivo: ${discountReason})`
      prompt += `\n`
    }
    prompt += `\nA mensagem deve ser calorosa, profissional, usar emojis com moderação (coração, brilho, aperto de mãos), e transmitir cuidado artesanal e qualidade. Inclua as duas opções se aplicável.`

    setGeneratedPrompt(prompt)
    toast.success('Mensagem gerada!')
  }

  async function copyText(text: string, type: 'msg' | 'prompt') {
    await navigator.clipboard.writeText(text)
    if (type === 'msg') { setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000) }
    else { setCopiedPrompt(true); setTimeout(() => setCopiedPrompt(false), 2000) }
    toast.success('Copiado!')
  }

  return (
    <div className="space-y-4 pb-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <MessageSquare className="h-4 w-4" />
            Proposta para cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Produto / descrição</Label>
            <Input value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: Kit 8 sousplats branco com borda dourada" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Valor total (R$)</Label>
              <Input type="number" min="0" step="0.01" value={totalValue || ''} onChange={e => setTotalValue(parseFloat(e.target.value) || 0)} placeholder="0,00" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">% de entrada</Label>
              <div className="relative mt-1">
                <Input type="number" min="0" max="100" value={entryPercent || ''} onChange={e => setEntryPercent(parseFloat(e.target.value) || 0)} className="pr-7" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          {totalValue > 0 && (
            <div className="flex gap-4 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
              <span>Entrada: <strong className="text-foreground">{formatCurrency(entry)}</strong></span>
              <span>Restante: <strong className="text-foreground">{formatCurrency(remaining)}</strong></span>
            </div>
          )}
          <div>
            <Label className="text-xs">Materiais (opcional)</Label>
            <Textarea value={materials} onChange={e => setMaterials(e.target.value)} placeholder="Ex: fio 100% algodão com acabamento em fio dourado viscose" className="mt-1 min-h-[64px]" />
          </div>

          {/* Discount toggle */}
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm cursor-pointer">Incluir opção com desconto?</Label>
            <Switch checked={includeDiscount} onCheckedChange={setIncludeDiscount} />
          </div>
          {includeDiscount && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Valor com desconto (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={discountValue || ''} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Motivo</Label>
                  <Input value={discountReason} onChange={e => setDiscountReason(e.target.value)} placeholder="Ex: fase de fidelização" className="mt-1" />
                </div>
              </div>
              {discountValue > 0 && (
                <div className="flex gap-4 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
                  <span>Entrada: <strong className="text-foreground">{formatCurrency(discountEntry)}</strong></span>
                  <span>Restante: <strong className="text-foreground">{formatCurrency(discountRemaining)}</strong></span>
                </div>
              )}
            </motion.div>
          )}

          <div>
            <Label className="text-xs">Observações extras (opcional)</Label>
            <Textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Qualquer informação adicional para a cliente..." className="mt-1 min-h-[60px]" />
          </div>
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

      {/* Generated message */}
      {generatedMsg && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Mensagem para WhatsApp</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => copyText(generatedMsg, 'msg')} className="gap-1.5 h-8">
                  {copiedMsg ? <Check className="h-4 w-4 text-sage" /> : <Copy className="h-4 w-4" />}
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

      {/* Generated prompt */}
      {generatedPrompt && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-accent/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Prompt para IA (Claude / ChatGPT)</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => copyText(generatedPrompt, 'prompt')} className="gap-1.5 h-8">
                  {copiedPrompt ? <Check className="h-4 w-4 text-sage" /> : <Copy className="h-4 w-4" />}
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
