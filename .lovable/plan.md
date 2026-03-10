

## Plano de Implementação

Este plano cobre 5 funcionalidades: logo na tela de login, upgrade de plano pelo admin, página de perfil, página Sobre Nós e página de Termos de Uso.

---

### 1. Logo na Tela de Login

- Copiar a imagem enviada para `src/assets/logo.jpeg`
- Substituir o ícone `FileText` atual na página de login pela imagem do logo
- Também atualizar o logo no sidebar do `AppLayout`

### 2. Admin: Upgrade de Plano dos Usuários

No `AdminUsers.tsx`, adicionar uma coluna de ações com um `Select` para alterar o plano do usuário:
- Buscar todos os planos ativos da tabela `subscription_plans`
- Ao selecionar um plano, fazer `upsert` na tabela `user_subscriptions` (deletar assinatura atual e inserir a nova, ou atualizar o `plan_id`)
- Exibir confirmação via toast

### 3. Página de Perfil (`/profile`)

Criar `src/pages/Profile.tsx` com:
- Exibição do nome, email e plano atual
- Formulário para editar nome completo (update na tabela `profiles`)
- Seção para alterar senha usando `supabase.auth.updateUser({ password })`
- Adicionar link "Perfil" no sidebar do `AppLayout` com ícone `User`
- Adicionar rota protegida no `App.tsx`

### 4. Página Sobre Nós (`/about`)

Criar `src/pages/About.tsx` com:
- Logo da Decode Analytics
- Texto institucional fornecido pelo usuário sobre desenvolvimento de apps, análise de dados e soluções digitais
- Página pública (acessível sem login), com link no footer ou sidebar
- Adicionar rota no `App.tsx`

### 5. Página de Termos de Uso (`/terms`)

Criar `src/pages/Terms.tsx` com:
- Título "Termos de Uso e Política de Privacidade"
- Seções sobre: coleta de dados, LGPD (Lei 13.709/2018), declaração de que nenhum dado sensível é armazenado no banco de dados
- Direitos do usuário (acesso, correção, exclusão)
- Página pública, link no footer
- Adicionar rota no `App.tsx`

---

### Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `src/assets/logo.jpeg` | Copiar imagem |
| `src/pages/Login.tsx` | Substituir ícone pelo logo |
| `src/pages/Profile.tsx` | Criar página de perfil |
| `src/pages/About.tsx` | Criar página Sobre Nós |
| `src/pages/Terms.tsx` | Criar página Termos de Uso |
| `src/pages/admin/AdminUsers.tsx` | Adicionar upgrade de plano |
| `src/components/layout/AppLayout.tsx` | Adicionar links Perfil, Sobre, Termos no sidebar/footer + logo |
| `src/App.tsx` | Adicionar rotas `/profile`, `/about`, `/terms` |

