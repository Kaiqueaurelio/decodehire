

## Analisador de Currículos IA — Plano de Implementação

### 1. Setup Lovable Cloud
- Habilitar Lovable Cloud (banco de dados, autenticação, edge functions)
- Configurar autenticação com email/senha
- Criar tabelas: `profiles`, `user_roles`, `subscription_plans`, `user_subscriptions`, `pix_config`, `payment_requests`, `parsed_resumes`, `job_parameters`, `analysis_results`

### 2. Autenticação e Páginas Base
- Página de login/cadastro em PT-BR
- Layout principal com sidebar e footer "© 2026 Decode Analytics — Criado por Kaique Aurélio"
- Proteção de rotas (autenticado vs admin)
- Sistema de roles (admin/user) com tabela separada e RLS

### 3. Dashboard Principal (Análise de Currículos)
- **Painel Esquerdo**: Formulário de parâmetros da vaga (cargo, área, habilidades obrigatórias/desejáveis, experiência mínima, responsabilidades, formação, certificações, idiomas, palavras-chave)
- **Painel Direito**: Upload de currículo (PDF/DOCX) + resultados da análise
- Resultados exibem: barra de score (0-100), classificação, lista de pontos fortes, requisitos ausentes, resumo profissional

### 4. Edge Functions de IA (Lovable AI Gateway)
- **Função `parse-resume`**: Recebe texto extraído do currículo e estrutura em campos (nome, experiências, habilidades, formação, etc.) usando tool calling para JSON estruturado
- **Função `analyze-resume`**: Compara dados estruturados do currículo com parâmetros da vaga, retorna score, classificação, compatibilidades e lacunas
- Cache de currículos já processados no banco

### 5. Upload e Extração de Texto
- Upload de PDF/DOCX via Lovable Cloud Storage
- Extração de texto no backend (edge function) para normalização antes da análise IA
- Armazenamento do texto extraído para reuso

### 6. Planos de Assinatura e Pagamento Pix
- Página de planos (Grátis com limite de análises + Plano Pro ilimitado)
- Tela de pagamento Pix: QR code gerado dinamicamente, código copia e cola, instruções em PT-BR
- Botão "Já realizei o pagamento" registra solicitação pendente

### 7. Painel Admin
- `/admin/payments/pix` — Configuração da chave Pix, nome do comerciante, mensagem de instruções, status (ativo/inativo)
- `/admin/payments/review` — Tabela de pagamentos pendentes com ações confirmar/rejeitar
- Confirmação ativa o plano do usuário
- Gestão de usuários

### 8. Otimizações
- Cache de currículos já analisados
- Reutilização de parâmetros de vaga entre análises
- Respostas estruturadas via tool calling (redução de tokens)
- Resumo do currículo antes da análise profunda

