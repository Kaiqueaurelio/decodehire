

## Plano: Auto-play com Barra de Progresso no Demo Interativo

### Alteracao unica: `src/components/landing/AppDemo.tsx`

- Adicionar `useEffect` + `useRef` para ciclar entre as 3 tabs a cada 4 segundos
- State `progress` (0-100) atualizado a cada ~40ms (100 steps em 4s) para animar a barra
- Ao atingir 100%, avanca para a proxima tab e reseta o progresso
- Clique manual do usuario reseta o timer e o progresso
- Barra de progresso usando o componente `Progress` ja importado, posicionada abaixo das tabs
- Auto-play pausa ao hover no conteudo (opcional, melhora UX)

### Detalhes
- Ordem ciclica: params → upload → result → params
- A barra de progresso fica fina (h-1) e usa cor primary
- Ao clicar numa tab manualmente, o auto-play reinicia daquela tab

