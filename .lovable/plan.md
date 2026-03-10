

## Plano: Página de Contato com Formulário e Painel Admin

### 1. Criar tabela `contact_messages`

Migration SQL para criar a tabela com RLS:
- Campos: `id`, `name`, `email`, `message`, `created_at`, `is_read` (default false)
- RLS: INSERT para `anon` e `authenticated`, SELECT/UPDATE apenas para admins via `has_role`

### 2. Criar página `/contact` (`src/pages/Contact.tsx`)

Página pública com:
- Logo da Decode Analytics no topo
- Informações de contato: email `Decoanalytics@outlook.com.br` e link WhatsApp
- Formulário com campos nome, email e mensagem (validação com zod)
- Salva no banco via insert na tabela `contact_messages`
- Design consistente com About/Terms (cards, ícones lucide)
- Botão "Voltar" para `/login`

### 3. Painel Admin: Mensagens (`/admin/contacts`)

Criar `src/pages/admin/AdminContacts.tsx`:
- Listagem de mensagens recebidas com data, nome, email
- Botão para marcar como lida/não lida
- Expandir para ver mensagem completa

### 4. Atualizar navegação

- **`App.tsx`**: Adicionar rota pública `/contact` e rota admin `/admin/contacts`
- **`AppLayout.tsx`**: Adicionar link "Contato" no footer junto com "Sobre nós" e "Termos"
- **`AdminLayout.tsx`**: Adicionar link "Mensagens" no menu lateral do admin
- **`About.tsx`**: Adicionar seção/link de contato no final da página

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabela `contact_messages` + RLS |
| `src/pages/Contact.tsx` | Criar |
| `src/pages/admin/AdminContacts.tsx` | Criar |
| `src/App.tsx` | Adicionar rotas |
| `src/components/layout/AppLayout.tsx` | Link no footer |
| `src/components/layout/AdminLayout.tsx` | Link no menu admin |
| `src/pages/About.tsx` | Adicionar seção de contato |

