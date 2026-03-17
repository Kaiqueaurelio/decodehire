

## Diagnóstico e Plano de Correção

### Problemas Encontrados

1. **FK ausente**: `user_subscriptions.plan_id` não tem foreign key para `subscription_plans.id` — o join na página de Perfil (`subscription_plans(name)`) falha silenciosamente, mostrando sempre "Gratuito"

2. **Sem feedback pós-checkout Stripe**: O usuário retorna do Stripe para `/dashboard?checkout=success` mas nada acontece — sem toast, sem refresh do plano

3. **Perfil não mostra assinatura Stripe**: A página Profile só consulta `user_subscriptions` (Pix), ignorando completamente assinaturas ativas no Stripe

4. **Sem botão "Gerenciar Assinatura"**: A edge function `customer-portal` existe mas nunca é chamada — não há como cancelar/alterar plano pelo Stripe

5. **Plans page sem indicador de Stripe**: Se o usuário tem uma assinatura Stripe, a página de planos pode não marcar corretamente o plano atual (depende do `useUserPlan` que já funciona, mas não há botão para gerenciar)

---

### Plano de Implementação

**1. Migração: adicionar FK em user_subscriptions**
- `ALTER TABLE user_subscriptions ADD CONSTRAINT fk_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);`
- Isso faz o join no Profile funcionar corretamente

**2. Dashboard: tratar retorno do Stripe**
- Detectar `?checkout=success` nos search params
- Mostrar toast de sucesso e forçar refresh do `useUserPlan`
- Limpar o query param da URL

**3. Profile: integrar com Stripe**
- Usar `useUserPlan()` em vez de query manual para mostrar plano atual (já prioriza Stripe)
- Mostrar data de expiração se `subscriptionEnd` existir
- Adicionar botão "Gerenciar Assinatura" que chama `customer-portal` e abre em nova aba

**4. Plans page: botão gerenciar**
- Se o plano atual é Stripe (`isStripeSubscription`), mostrar botão "Gerenciar Assinatura" no card do plano atual em vez de "Plano Atual" desabilitado

**5. Validação final**
- Garantir que edge functions estão deployed (já confirmado)
- Stripe products/prices estão corretos (já confirmado)
- STRIPE_SECRET_KEY está configurado (já confirmado)

### Detalhes Técnicos

- **Arquivos editados**: `src/pages/Dashboard.tsx`, `src/pages/Profile.tsx`, `src/pages/Plans.tsx`
- **Migração SQL**: 1 migration para FK
- **Nenhuma edge function precisa mudar** — todas estão corretas

