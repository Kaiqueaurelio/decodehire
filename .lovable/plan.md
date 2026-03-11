

## Plano: Melhorias Significativas no Decode Analytics

Quatro blocos de melhorias que adicionam novas funcionalidades sem alterar o que ja funciona.

---

### 1. Favoritar e Organizar Analises

**Banco de dados:** Adicionar coluna `is_favorited` (boolean, default false) na tabela `analysis_results` + politica RLS permissiva para UPDATE.

**`src/pages/History.tsx`:**
- Botao de estrela em cada card de analise para marcar/desmarcar favorito
- Filtros no topo: "Todas", "Favoritas", filtro por faixa de score (0-40, 40-70, 70-100)
- Campo de busca por nome do cargo
- Ordenacao por data ou score

---

### 2. Dashboard com Mais Metricas

**`src/components/dashboard/MetricsDashboard.tsx`:**
- Adicionar card "Melhor Score" e "Cargo Mais Analisado"
- Grafico de barras com top 5 cargos mais analisados
- Indicador de tendencia (score medio subindo/descendo vs semana anterior)
- Card de "Taxa de Aprovacao" (% compativel) com comparativo semanal

---

### 3. Analise em Lote Melhorada

**`src/components/dashboard/ResumeUpload.tsx`:**
- Apos analise em lote, mostrar ranking com barras de progresso visuais por score
- Botao para exportar ranking completo em CSV
- Indicador visual de "melhor candidato" com destaque dourado
- Filtro rapido no ranking: mostrar so compativeis / so incompativeis

---

### 4. Melhorar Visual e UX Geral

**Onboarding para novos usuarios:**
- Criar componente `OnboardingOverlay.tsx` que aparece na primeira visita ao dashboard
- 3 passos simples com ilustracoes: "Defina a vaga" > "Envie o curriculo" > "Veja o resultado"
- Salvar flag `onboarding_completed` no localStorage

**Empty states melhorados:**
- Historico vazio: ilustracao + CTA "Fazer primeira analise"
- Resultados vazio: animacao sutil no icone

**Responsividade mobile (414px):**
- Cards de metricas empilhados corretamente
- Historico com cards compactos no mobile
- Botoes de acao com texto menor no mobile

**Animacoes sutis:**
- Fade-in nos cards ao carregar
- Transicao suave ao favoritar
- Skeleton loading no historico e metricas

---

### Detalhes Tecnicos

**Migracao SQL necessaria:**
```sql
ALTER TABLE public.analysis_results ADD COLUMN is_favorited boolean NOT NULL DEFAULT false;
-- Politica PERMISSIVE para update de favoritos
CREATE POLICY "Users can update own analyses" ON public.analysis_results
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Arquivos a criar:**
- `src/components/dashboard/OnboardingOverlay.tsx`

**Arquivos a modificar:**
- `src/pages/History.tsx` (favoritos, filtros, busca, empty state, animacoes)
- `src/components/dashboard/MetricsDashboard.tsx` (novas metricas e graficos)
- `src/components/dashboard/ResumeUpload.tsx` (ranking melhorado no lote)
- `src/components/dashboard/AnalysisResults.tsx` (animacoes sutis)
- `src/pages/Dashboard.tsx` (integrar onboarding)

**Nenhum arquivo existente sera reescrito** - apenas adicoes e melhorias incrementais.

