

## Problema

O login social (Google/Apple) esta dando erro "Authorization failed - State verification failed" no oauth.lovable.app. Esse erro e um problema de verificacao de estado do OAuth que esta fora do nosso controle direto no codigo.

## Plano: Remover Login Social e Simplificar

Concordo com voce - o login social esta complicando mais do que ajudando. Vamos remover os botoes de Google e Apple e manter apenas o login classico com email/senha, que funciona perfeitamente.

### Alteracoes

**1. `src/pages/Login.tsx`**
- Remover import do `lovable`, `Separator`, e estado `socialLoading`
- Remover toda a secao de botoes Google/Apple e o separador "ou"
- Manter apenas o formulario de email/senha limpo e funcional

**2. `src/pages/Register.tsx`**
- Mesmo tratamento: remover botoes sociais, import do `lovable`, `Separator`, `socialLoading`
- Manter formulario de cadastro com nome, email e senha

**3. `src/contexts/AuthContext.tsx`**
- Simplificar a logica de deteccao de OAuth callback que ja nao sera necessaria
- Remover as verificacoes de `hasOAuthCallback` e `authEventFired` que foram adicionadas para lidar com o fluxo social

O resultado sera um fluxo de autenticacao simples, confiavel e sem erros.

