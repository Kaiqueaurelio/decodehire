

## Plano: Todas as Melhorias de Uma Vez

Quatro frentes implementadas em paralelo.

---

### 1. Depoimentos na Landing Page

**Novo componente:** `src/components/landing/TestimonialsSection.tsx`
- 3 depoimentos fictícios de profissionais de RH com nome, cargo, empresa e citação
- Layout em grid responsivo (1 col mobile, 3 col desktop)
- Ícone de aspas estilizado, avatar com iniciais coloridas
- Estrelas de avaliação (5/5)

**`src/pages/LandingPage.tsx`:** Inserir entre StatsSection e Benefits.

---

### 2. Notificação ao Usuário quando Pagamento é Aprovado/Rejeitado

**Sem email** (requer domínio configurado). Em vez disso, aproveitar o sistema de notificações in-app já existente:

**Novo trigger SQL:** `notify_user_payment_status` - dispara quando `payment_requests.status` muda de `pending` para `approved` ou `rejected`, criando uma notificação na tabela `notifications` para o `user_id` do pagamento.

O sino de notificações já existente mostrará o alerta automaticamente.

---

### 3. PDF Profissional Melhorado

**`src/lib/exportPdf.ts`:**
- Adicionar header com logo (base64 inline) e nome "Decode Analytics"
- Barra de score visual com gradiente
- Seção de radar visual (scores por categoria: Habilidades, Experiência, Formação, Stack)
- Rodapé com data, página X de Y
- Design mais profissional com cores da marca

---

### 4. Comparação de Candidatos Melhorada

**`src/pages/History.tsx`:** A comparação já existe com RadarChart. Melhorias:
- Tabela lado a lado com habilidades compatíveis e lacunas de cada candidato
- Indicador visual de "Melhor Candidato" com destaque
- Botão para exportar comparação em PDF
- Cores distintas por candidato no radar

---

### Arquivos a criar
- `src/components/landing/TestimonialsSection.tsx`

### Arquivos a modificar
- `src/pages/LandingPage.tsx` (importar TestimonialsSection)
- `src/lib/exportPdf.ts` (PDF profissional)
- `src/pages/History.tsx` (comparação melhorada)

### Migração SQL
- Trigger `notify_user_payment_status` na tabela `payment_requests`

