

## Plano: Ocultar Página de Planos para Administradores

### Problema
Admins têm acesso ilimitado, mas ainda veem a página de planos com botões de upgrade — desnecessário e confuso.

### Solução
1. **`src/pages/Plans.tsx`**: Verificar `isAdmin` do `useAuth()`. Se admin, exibir uma mensagem simples informando que o acesso é ilimitado, sem mostrar os cards de planos.
2. **`src/components/layout/AppLayout.tsx`**: Ocultar o link "Planos" no menu lateral quando o usuário for admin.
3. **`src/pages/Dashboard.tsx`**: O contador de análises diárias já é ocultado para admins (dailyLimit === null), então não precisa de mudança.

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/layout/AppLayout.tsx` | Filtrar item "Planos" do navItems quando `isAdmin` |
| `src/pages/Plans.tsx` | Mostrar tela alternativa para admin (ex: "Você tem acesso completo como administrador") |

