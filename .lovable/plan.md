

## Plano: Sistema de Limites por Plano, Exportação e Novos Planos

### Situação Atual
- Enum `plan_type` tem apenas `free` e `pro`
- Tabela `subscription_plans` tem campo `analysis_limit` (já existe, mas não é usado)
- Nenhuma verificação de limite é feita antes de analisar
- Histórico existe mas sem exportação
- Planos são carregados do banco, mas só há 2 tipos

---

### 1. Banco de Dados

**Adicionar novo tipo de plano ao enum:**
- Alterar enum `plan_type` para incluir `business` (free, pro, business)

**Adicionar campo `daily_limit` à tabela `subscription_plans`:**
- `daily_limit integer` (null = ilimitado)
- Manter `analysis_limit` como limite mensal se necessário

**Criar função SQL `get_daily_usage`:**
- Conta análises do usuário nas últimas 24h
- Retorna contagem para verificação no frontend

**Inserir/atualizar planos no banco:**
- **Gratuito**: 5 análises/dia, features básicas
- **Pro** (~R$29,90): 30 análises/dia, exportação PDF, histórico completo
- **Business** (~R$79,90): ilimitado, exportação PDF/CSV, suporte prioritário, API access

---

### 2. Verificação de Limite no Dashboard

**Antes de analisar (`Dashboard.tsx`):**
1. Buscar plano ativo do usuário via `user_subscriptions` + `subscription_plans`
2. Contar análises das últimas 24h via `analysis_results`
3. Se `daily_limit` atingido → mostrar Dialog de limite

**Dialog de limite atingido:**
- Mensagem: "Você atingiu seu limite diário de X análises"
- Opções: "Espere 24h" ou botão "Atualizar Plano" que leva a `/plans`

---

### 3. Página de Planos Melhorada (`Plans.tsx`)

- Grid de 3 colunas (free, pro, business)
- Plano Pro com badge "Mais Popular"
- Plano Business com destaque premium
- Mostrar plano atual do usuário (buscar de `user_subscriptions`)
- Botão dinâmico: "Plano Atual" / "Assinar" / "Fazer Upgrade"

---

### 4. Exportação de Análises (`History.tsx`)

- Botão "Exportar" em cada análise do histórico
- Exportar como CSV (dados tabulares: cargo, score, classificação, data)
- Botão "Exportar Tudo" no topo para baixar todas as análises
- Verificar se o plano do usuário permite exportação (pro/business)

---

### 5. Hook `useUserPlan`

Criar hook reutilizável que retorna:
- Plano atual do usuário
- Uso diário (análises feitas hoje)
- Limite diário
- `canAnalyze` boolean
- `canExport` boolean

Usado em Dashboard, History e Plans.

---

### Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| **Migration SQL** | Alterar enum, adicionar `daily_limit`, criar `get_daily_usage`, atualizar dados dos planos |
| `src/hooks/useUserPlan.ts` | Novo hook para plano + limites |
| `src/pages/Dashboard.tsx` | Verificar limite antes de analisar, dialog de upgrade |
| `src/pages/Plans.tsx` | 3 planos, plano atual, visual melhorado |
| `src/pages/History.tsx` | Botão exportar CSV |
| `src/pages/Checkout.tsx` | Suportar novo tipo `business` |

