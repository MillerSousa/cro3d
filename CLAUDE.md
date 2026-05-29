# Cro3D — Guia do projeto

## Regra principal
NUNCA alterar design visual: cores, fontes, espaçamentos,
border-radius, animações. Perguntar antes de qualquer mudança
estrutural.

## Identidade visual
- Paleta: off-white #FAF9F6, areia #F0EAD6, terracota #C4704F,
  verde-sálvia #7A9E7E
- Cards: border-radius 20px, borda 0.5px, sem sombras
- Botões primários: terracota
- Mobile-first, tab bar fixa no rodapé

## Comportamento esperado
- Dados de usuários, filamentos e impressoras vêm do Supabase —
  não hardcodar nenhum dado de usuário no código
- Toda lista exibida ao usuário em ordem alfabética
- Formatação monetária sempre pt-BR (R$ 1.234,56)
- Ações destrutivas sempre pedem confirmação antes de executar
- Erros tratados inline, nunca com alert()