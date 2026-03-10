

## Problemas Identificados

**1. Nome do app "Currículo IA"**: O nome que aparece na tela de consentimento OAuth vem do nome do projeto no Lovable. Para mudar para "Decode Analytics", basta clicar no nome do projeto no canto superior esquerdo do editor e selecionar "Rename project". Isso não requer mudanças no codigo.

**2. Login social nao completa**: Apos o OAuth, o usuario e redirecionado para `/` (LandingPage) por causa do `redirect_uri: window.location.origin`. A LandingPage nao detecta que o usuario esta autenticado e nao redireciona para o dashboard. O `onAuthStateChange` no AuthContext processa a sessao, mas nenhuma logica na LandingPage redireciona o usuario logado.

## Plano de Implementacao

### Correcao 1 - Renomear projeto
- Orientar o usuario a renomear o projeto para "Decode Analytics" via settings do Lovable

### Correcao 2 - Redirecionar usuario autenticado na LandingPage
- Adicionar `useAuth` e `useNavigate` na LandingPage
- Se o usuario estiver autenticado (`user` nao nulo e `loading` falso), redirecionar automaticamente para `/dashboard`
- Isso resolve o problema de apos OAuth o usuario ficar preso na landing page

### Correcao 3 - Melhorar redirect_uri do OAuth
- Mudar o `redirect_uri` no Login e Register de `window.location.origin` para `window.location.origin + "/dashboard"` para que apos o OAuth o usuario va direto ao dashboard

### Arquivos a editar
- `src/pages/LandingPage.tsx` - adicionar redirect para usuarios autenticados
- `src/pages/Login.tsx` - ajustar redirect_uri
- `src/pages/Register.tsx` - ajustar redirect_uri

