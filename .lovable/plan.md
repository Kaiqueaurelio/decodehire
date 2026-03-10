

## Plano de Melhorias: Admin, Formulário de Vaga e Performance de PDF

O usuário pediu 3 coisas principais: (1) admin mais completo e polido, (2) formulário de parâmetros da vaga simplificado, (3) leitura de PDF mais rápida e estável.

---

### 1. Simplificar Formulário de Parâmetros da Vaga

O formulário atual tem 10 campos (cargo, área, habilidades obrigatórias, desejáveis, experiência, responsabilidades, formação, certificações, idiomas, palavras-chave). Isso é demais.

**Solução:** Reduzir para 3 campos essenciais + seção colapsável "Avançado":
- **Campos visíveis**: Cargo da vaga (obrigatório), Descrição da vaga (textarea único combinando responsabilidades, habilidades, requisitos), Experiência mínima (anos)
- **Seção "Configurações avançadas" (colapsável)**: Formação, Certificações, Idiomas
- A IA já é capaz de extrair habilidades e palavras-chave da descrição, tornando campos separados desnecessários

---

### 2. Acelerar Processamento de PDF (3 chamadas → 1 chamada)

Atualmente o fluxo faz **3 chamadas sequenciais** à IA:
1. `extract-text` (extrai texto do PDF via Gemini)
2. `parse-resume` (estrutura o texto em JSON)
3. `analyze-resume` (compara com a vaga)

**Solução:** Unificar `extract-text` + `parse-resume` em uma **única edge function** `process-resume`. O Gemini já recebe o PDF como imagem e pode retornar o JSON estruturado diretamente, eliminando uma chamada inteira. Fluxo novo:
1. `process-resume` (recebe base64, retorna JSON estruturado) — 1 chamada
2. `analyze-resume` (compara com vaga) — 1 chamada

Isso reduz latência em ~30-40%.

---

### 3. Melhorar Painel Admin

**AdminDashboard** — Adicionar:
- Gráfico de análises por dia (últimos 7 dias) usando Recharts
- Lista dos últimos 5 pagamentos pendentes com ação rápida de confirmar/rejeitar
- Indicador de atividade recente (último login, últimas análises)
- Skeleton loading em vez de texto "Carregando..."

**AdminUsers** — Melhorar:
- Adicionar busca/filtro por nome ou email
- Mostrar contagem de análises por usuário
- Skeleton loading

**PaymentReview** — Melhorar:
- Adicionar filtro por status (Todos / Pendentes / Confirmados / Rejeitados)
- Dialog de confirmação antes de confirmar/rejeitar pagamento
- Skeleton loading

**PixConfig** — Sem grandes mudanças, já é funcional.

---

### Resumo das Mudanças

| Arquivo | Ação |
|---|---|
| `src/components/dashboard/JobParametersForm.tsx` | Simplificar para 3 campos + colapsável |
| `supabase/functions/process-resume/index.ts` | Nova function unificada (extract + parse) |
| `supabase/functions/extract-text/index.ts` | Remover (substituída) |
| `supabase/functions/parse-resume/index.ts` | Remover (substituída) |
| `src/components/dashboard/ResumeUpload.tsx` | Chamar `process-resume` em vez de `extract-text` |
| `src/pages/Dashboard.tsx` | Remover step de parse separado, usar resultado direto |
| `src/pages/admin/AdminDashboard.tsx` | Gráfico Recharts + ações rápidas + skeleton |
| `src/pages/admin/AdminUsers.tsx` | Busca/filtro + skeleton |
| `src/pages/admin/PaymentReview.tsx` | Filtro por status + dialog confirmação + skeleton |

