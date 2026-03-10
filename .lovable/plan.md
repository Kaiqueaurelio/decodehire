

## Plano: Templates de Parâmetros de Vaga Salvos

Ideia excelente. O usuário poderá salvar configurações de vaga como templates reutilizáveis, evitando retrabalho ao analisar múltiplos currículos para a mesma posição.

### O que muda

**1. Nova tabela `job_templates` no banco de dados**
- Colunas: `id`, `user_id`, `name` (ex: "Analista de Marketing - Sênior"), `parameters` (jsonb com cargo, descricao, etc.), `created_at`, `updated_at`
- RLS: cada usuário só vê/edita/deleta os próprios templates

**2. Atualização do `JobParametersForm`**
- Acima do formulário, um seletor (Select/Combobox) com os templates salvos do usuário
- Ao selecionar um template, os campos são preenchidos automaticamente
- Opção "Novo parâmetro" para começar do zero
- Botão "Salvar como template" que pede um nome e persiste no banco
- Botão para deletar template selecionado

**3. Fluxo do usuário**
```text
┌─────────────────────────────────────┐
│  [▼ Selecionar template salvo    ]  │
│  ┌─────────────┬─────────────────┐  │
│  │ + Novo      │ Template X  ✕   │  │
│  │             │ Template Y  ✕   │  │
│  └─────────────┴─────────────────┘  │
│                                     │
│  Cargo: [Analista de Marketing   ]  │
│  Descrição: [................... ]  │
│  ...                                │
│                                     │
│  [Salvar Parâmetros] [💾 Salvar como Template] │
└─────────────────────────────────────┘
```

### Detalhes técnicos

- Migration SQL cria a tabela `job_templates` com RLS (user CRUD nos próprios registros)
- Hook `useJobTemplates` para carregar/salvar/deletar templates via Supabase
- Dialog simples para nomear o template ao salvar
- O botão "Salvar Parâmetros" continua funcionando como antes (aplica para análise atual), enquanto "Salvar como Template" persiste no banco para uso futuro

