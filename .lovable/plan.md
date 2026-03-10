

## Plano: Separar Layout Admin do Layout Principal

### Problema
O sidebar mistura itens do usuário (Análise, Histórico) com itens admin (Painel, Usuários, Planos, Pagamentos, Config Pix), poluindo a navegação e causando confusão visual.

### Solução
Criar um layout dedicado para a área administrativa (`AdminLayout`), separado do `AppLayout`. Quando o admin estiver na área `/admin/*`, verá **apenas** a navegação admin. Um link "Voltar ao app" permite alternar entre os dois contextos.

```text
Hoje:                          Depois:
┌──────────────┐               ┌──────────────┐    ┌──────────────┐
│ Menu         │               │ Menu         │    │ Admin        │
│  Análise     │               │  Análise     │    │  Painel      │
│  Histórico   │               │  Histórico   │    │  Usuários    │
│              │               │              │    │  Planos      │
│ Admin        │               │  ⚙ Admin →   │    │  Pagamentos  │
│  Painel      │               │              │    │  Config Pix  │
│  Usuários    │               └──────────────┘    │              │
│  Planos      │                                   │  ← Voltar    │
│  Pagamentos  │                                   └──────────────┘
│  Config Pix  │
└──────────────┘
```

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/layout/AdminLayout.tsx` | **Novo** -- Layout dedicado admin com sidebar próprio (só itens admin + link "Voltar ao app") |
| `src/components/layout/AppLayout.tsx` | Remover `adminItems` do sidebar. Adicionar um link simples "Painel Admin" que leva a `/admin` (só visível para admins) |
| `src/App.tsx` | Rotas `/admin/*` usam `AdminLayout` em vez de `AppLayout` |

### Detalhes

**AdminLayout**: Sidebar com visual diferenciado (badge "Admin" no topo), itens de navegação admin, e um botão "Voltar ao app" no rodapé que redireciona para `/dashboard`.

**AppLayout**: Sidebar limpo, apenas itens do usuário. Para admins, um único link discreto "Painel Admin" com ícone de escudo substitui os 5 links atuais.

**Rotas**: As rotas admin saem do `AppLayout` e ficam sob um novo `<Route element={<AdminLayout />}>` dedicado.

