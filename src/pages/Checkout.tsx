import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, CheckCircle, Loader2, Upload, ImageIcon, X, CreditCard } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generatePixCode } from "@/lib/pix";
import { STRIPE_PLANS, type StripePlanType } from "@/lib/stripe";
import PixCheckout from "@/components/checkout/PixCheckout";

type PaymentMethod = "stripe" | "pix";

export default function Checkout() {
  const { planId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [pixConfig, setPixConfig] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [stripeLoading, setStripeLoading] = useState(false);

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

  const handleStripeCheckout = async () => {
    if (!plan || !user) return;
    const planType = plan.plan_type as StripePlanType;
    const stripeInfo = STRIPE_PLANS[planType];
    if (!stripeInfo) {
      toast.error("Este plano não suporta pagamento via cartão.");
      return;
    }

    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: stripeInfo.price_id },
      });

      if (error) throw new Error(error.message);
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao iniciar checkout");
    } finally {
      setStripeLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-center">Pagamento</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-center">{plan.name}</CardTitle>
          <p className="text-center text-2xl font-display font-bold text-primary">
            R$ {Number(plan.price).toFixed(2).replace(".", ",")}
            <span className="text-sm text-muted-foreground font-normal">/mês</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment method selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Forma de pagamento:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  paymentMethod === "stripe"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Cartão
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  paymentMethod === "pix"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.2 14.6c-.4.4-1 .6-1.6.6s-1.2-.2-1.6-.6l-2.4-2.4c-.2-.2-.5-.2-.7 0l-2.4 2.4c-.4.4-1 .6-1.6.6s-1.2-.2-1.6-.6l-1.8-1.8 3.3-3.3c.6-.6 1.5-.6 2.1 0l2.4 2.4c.2.2.5.2.7 0l2.4-2.4c.6-.6 1.5-.6 2.1 0l3.3 3.3-1.8 1.8zm3.5-3.5L18 8.4c-.4-.4-1-.6-1.6-.6s-1.2.2-1.6.6l-2.4 2.4c-.2.2-.5.2-.7 0L9.3 8.4c-.4-.4-1-.6-1.6-.6s-1.2.2-1.6.6L3.3 11.1 1.1 8.9c-.3-.3-.3-.8 0-1.1l6.7-6.7c.3-.3.8-.3 1.1 0l2.2 2.2c.6.6 1.5.6 2.1 0l2.2-2.2c.3-.3.8-.3 1.1 0l6.7 6.7c.3.3.3.8 0 1.1l-2.2 2.2zm0 1.8l2.2 2.2c.3.3.3.8 0 1.1l-6.7 6.7c-.3.3-.8.3-1.1 0l-2.2-2.2c-.6-.6-1.5-.6-2.1 0l-2.2 2.2c-.3.3-.8.3-1.1 0l-6.7-6.7c-.3-.3-.3-.8 0-1.1l2.2-2.2 2.8 2.8c.4.4 1 .6 1.6.6s1.2-.2 1.6-.6l2.4-2.4c.2-.2.5-.2.7 0l2.4 2.4c.4.4 1 .6 1.6.6s1.2-.2 1.6-.6l2.8-2.8z"/>
                </svg>
                Pix
              </button>
            </div>
          </div>

          {/* Stripe checkout */}
          {paymentMethod === "stripe" && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                Você será redirecionado para o ambiente seguro do Stripe para concluir o pagamento com cartão de crédito ou débito.
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleStripeCheckout}
                disabled={stripeLoading}
              >
                {stripeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecionando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pagar com Cartão
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Pix checkout */}
          {paymentMethod === "pix" && pixConfig && (
            <PixCheckout plan={plan} pixConfig={pixConfig} user={user} />
          )}

          {paymentMethod === "pix" && !pixConfig && (
            <p className="text-sm text-muted-foreground text-center">
              Pagamento via Pix indisponível no momento.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
