import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Trash2, FileText, Scale } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </Link>

        <div className="text-center mb-12">
          <img
            src={logo}
            alt="Decode Analytics"
            className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover shadow-lg"
          />
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Termos de Uso e Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: Março de 2026</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                1. Termos Gerais
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao utilizar a plataforma Decode Analytics — Analisador de Currículos com IA, você concorda com os 
                termos e condições descritos neste documento. A plataforma é destinada à análise automatizada de 
                currículos utilizando inteligência artificial, com o objetivo de auxiliar candidatos a melhorar 
                seus documentos profissionais.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                2. Proteção de Dados e LGPD
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A Decode Analytics está em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>. 
                Respeitamos a privacidade dos nossos usuários e adotamos as melhores práticas de segurança da informação.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-sm font-medium text-foreground mb-2">⚠️ Importante:</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Nenhum dado sensível é armazenado em nosso banco de dados.</strong> Os currículos enviados para análise 
                  são processados temporariamente pela inteligência artificial e não são retidos de forma permanente. 
                  Apenas metadados como o nome do arquivo e o resultado da análise são salvos para fins de histórico do usuário.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                3. Coleta e Uso de Dados
              </h2>
              <ul className="text-muted-foreground leading-relaxed space-y-2">
                <li>• <strong>Dados de cadastro:</strong> Email e nome completo para identificação e acesso à plataforma.</li>
                <li>• <strong>Dados de uso:</strong> Histórico de análises e pontuações para exibição ao próprio usuário.</li>
                <li>• <strong>Currículos:</strong> Processados apenas para gerar a análise. O conteúdo textual extraído é utilizado temporariamente e não é compartilhado com terceiros.</li>
                <li>• <strong>Dados de pagamento:</strong> Informações de transação são tratadas de forma segura e não incluem dados bancários sensíveis.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                4. Direitos do Usuário
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Em conformidade com a LGPD, você tem os seguintes direitos:
              </p>
              <ul className="text-muted-foreground leading-relaxed space-y-2">
                <li>• <strong>Acesso:</strong> Solicitar uma cópia dos dados que mantemos sobre você.</li>
                <li>• <strong>Correção:</strong> Atualizar informações incorretas ou desatualizadas na página de perfil.</li>
                <li>• <strong>Exclusão:</strong> Solicitar a remoção completa dos seus dados e conta.</li>
                <li>• <strong>Portabilidade:</strong> Solicitar a exportação dos seus dados em formato acessível.</li>
                <li>• <strong>Revogação:</strong> Revogar o consentimento para uso dos dados a qualquer momento.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-primary" />
                5. Retenção e Exclusão de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Os dados são mantidos apenas pelo tempo necessário para fornecer os serviços contratados. 
                Ao excluir sua conta, todos os dados associados serão permanentemente removidos de nossos sistemas. 
                Para solicitar a exclusão de dados, entre em contato através do email do administrador da plataforma.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-lg font-semibold mb-3">6. Alterações nos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Decode Analytics se reserva o direito de alterar estes termos a qualquer momento. 
                As alterações entrarão em vigor imediatamente após a publicação nesta página. 
                Recomendamos que você revise periodicamente este documento.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-xs text-muted-foreground">
            © 2026 Decode Analytics — Criado por Kaique Aurélio
          </p>
        </div>
      </div>
    </div>
  );
}
