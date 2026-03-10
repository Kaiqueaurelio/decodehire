

## Plano: Isentar Administradores dos Limites de Plano

### Problema
O hook `useUserPlan` aplica limites de análise diária e restrições de exportação para todos os usuários, incluindo administradores. Admins devem ter acesso ilimitado.

### Solução
Modificar o hook `useUserPlan.ts` para verificar se o usuário é admin (usando `isAdmin` do `AuthContext`) e, caso seja, definir:
- `dailyLimit = null` (ilimitado)
- `canAnalyze = true`
- `canExport = true`
- `planName = "Administrador"`

### Arquivo Modificado

| Arquivo | Mudança |
|---|---|
| `src/hooks/useUserPlan.ts` | Importar `useAuth`, verificar `isAdmin`, e retornar permissões ilimitadas para admins |

### Detalhe da Mudança

No `useUserPlan.ts`:
1. O hook já importa `useAuth` — basta usar `isAdmin` do contexto
2. No retorno, se `isAdmin === true`, sobrescrever os valores com acesso total
3. Pular a busca de plano no banco quando for admin (otimização)

