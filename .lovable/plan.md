

## Plano: Gerar Código Pix Dinâmico com Valor do Plano

### Problema Atual
O código Pix configurado no admin é estático -- o mesmo código é exibido para todos os planos, sem valor embutido. O usuário precisa digitar o valor manualmente no app do banco.

### Solução
Criar uma função utilitária que gera o payload Pix (padrão EMV/BR Code) dinamicamente, inserindo o valor correto do plano no código. O QR Code e o "Copia e Cola" já terão o valor preenchido automaticamente.

### Como Funciona o Pix EMV

O código Pix segue o padrão EMV QR Code. O campo `54` (Transaction Amount) define o valor. Hoje o código salvo no admin **não tem valor** (campo 54 ausente). A função vai:

1. Extrair a chave Pix e dados do merchant do código base salvo no admin
2. Reconstruir o payload inserindo o campo `54` com o preço do plano
3. Recalcular o CRC16 (checksum obrigatório do padrão)

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/lib/pix.ts` | **Novo** -- Função `generatePixCode(baseCode, amount)` que parseia o EMV, injeta o valor e recalcula o CRC16 |
| `src/pages/Checkout.tsx` | Usar `generatePixCode` para gerar código dinâmico com o preço do plano antes de exibir QR Code e Copia/Cola |

### Detalhes

**`src/lib/pix.ts`:**
- Parser EMV que lê os campos TLV (Tag-Length-Value) do código base
- Função que insere/substitui o campo `54` (valor) com `plan.price`
- Cálculo CRC16-CCITT para o campo `63` (checksum)
- Exporta `generatePixCode(basePixCode: string, amount: number): string`

**`src/pages/Checkout.tsx`:**
- Importar `generatePixCode`
- No render, gerar `dynamicPixCode = generatePixCode(pixConfig.pix_code, plan.price)`
- Usar `dynamicPixCode` no QRCodeSVG e no Copia/Cola em vez do `pixConfig.pix_code` estático

O admin continua configurando o Pix normalmente (sem valor). O valor é injetado automaticamente no checkout de acordo com o plano escolhido.

