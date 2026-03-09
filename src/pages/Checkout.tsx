import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, CheckCircle, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Checkout() {
  const { planId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [pixConfig, setPixConfig] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!planId) return;
    Promise.all([
      supabase.from("subscription_plans").select("*").eq("id", planId).single(),
      supabase.from("pix_config").select("*").eq("is_enabled", true).limit(1).single(),
    ]).then(([planRes, pixRes]) => {
      setPlan(planRes.data);
      setPixConfig(pixRes.data);
    });
  }, [planId]);

  const handleCopy = () => {
    if (pixConfig?.pix_code) {
      navigator.clipboard.writeText(pixConfig.pix_code);
      toast.success("Código Pix copiado!");
    }
  };

  const handleConfirm = async () => {
    if (!user || !plan) return;
    setSubmitting(true);
    const { error } = await supabase.from("payment_requests").insert({
      user_id: user.id,
      plan_id: plan.id,
      amount: plan.price,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao registrar pagamento");
    } else {
      setSubmitted(true);
      toast.success("Solicitação registrada! Aguarde confirmação.");
    }
  };

  if (!plan || !pixConfig) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12 animate-fade-in">
        <CheckCircle className="w-16 h-16 text-success mx-auto" />
        <h1 className="font-display text-2xl font-bold">Pagamento Registrado!</h1>
        <p className="text-muted-foreground">
          Sua solicitação foi enviada. Após a confirmação do pagamento, seu plano será ativado automaticamente.
        </p>
        <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-center">Pagamento via Pix</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-center">{plan.name}</CardTitle>
          <p className="text-center text-2xl font-display font-bold text-primary">
            R$ {Number(plan.price).toFixed(2).replace(".", ",")}
            <span className="text-sm text-muted-foreground font-normal">/mês</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-card p-4 rounded-xl border border-border">
              <QRCodeSVG value={pixConfig.pix_code} size={200} />
            </div>
          </div>

          {/* Pix Code */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Código Copia e Cola:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg p-3 text-xs break-all font-mono max-h-20 overflow-auto">
                {pixConfig.pix_code}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Merchant */}
          <div className="text-sm">
            <p className="text-muted-foreground">Beneficiário:</p>
            <p className="font-medium">{pixConfig.merchant_name}</p>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            {pixConfig.payment_instructions}
          </div>

          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Já realizei o pagamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
