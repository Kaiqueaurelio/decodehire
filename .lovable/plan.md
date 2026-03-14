

## Plano: Landing Page Aprimorada com Demo Visual

Vou transformar a landing page em algo muito mais completo e persuasivo, mantendo tudo que ja existe e adicionando novas secoes.

---

### Novas Secoes (em ordem na pagina)

**1. Hero melhorado**
- Contador animado: "Mais de 10.000 curriculos analisados"
- Badges de confianca: "IA de ultima geracao", "Resultado em segundos", "100% imparcial"

**2. Secao "Veja o App em Acao" (Demo Visual)**
- Como nao ha video, vou criar um mockup interativo do app usando componentes reais
- Tabs clicaveis mostrando 3 telas do app:
  - **Tela 1**: Formulario de parametros da vaga (mockup visual)
  - **Tela 2**: Upload de curriculo (mockup visual)
  - **Tela 3**: Resultado com score, grafico radar e habilidades (mockup visual)
- Tudo dentro de um "frame de navegador" estilizado com barra de titulo
- Animacao de transicao entre as telas

**3. Secao de Numeros / Social Proof**
- Cards com numeros animados: "50K+ Curriculos", "98% Precisao", "3s Tempo medio", "500+ Empresas"
- Contador que anima ao entrar na viewport

**4. Secao FAQ**
- Accordion com perguntas frequentes:
  - "Como a IA analisa os curriculos?"
  - "Quais formatos de arquivo sao aceitos?"
  - "Os dados sao seguros?"
  - "Posso cancelar a qualquer momento?"

**5. CTA final mais forte**
- Secao dedicada com gradiente, titulo impactante e botao grande

---

### Secoes mantidas sem alteracao
- Nav (mantido)
- Benefits (mantido, mas com hover animations)
- How it works (mantido)
- Plans preview (mantido)
- Footer (mantido)

### Detalhes Tecnicos

**Arquivo modificado:** `src/pages/LandingPage.tsx`

- Mockups do app sao feitos com JSX puro (cards, badges, barra de progresso) — sem imagens externas
- Tabs do demo usam state local para alternar entre as 3 telas
- Contadores animados com `useEffect` + `IntersectionObserver`
- FAQ usa o componente `Accordion` ja existente no projeto
- Tudo responsivo para o viewport 414px atual

