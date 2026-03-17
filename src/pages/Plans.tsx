import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Crown, Zap, Sparkles, Rocket, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Plan {
  id: string;
  name: string;
  plan_type: string;
  price: number;
  daily_limit: number | null;
  description: string;
  features: string[];
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="w-6 h-6" />,
  starter: <Rocket className="w-6 h-6" />,
  pro: <Sparkles className="w-6 h-6" />,
  business: <Crown className="w-6 h-6" />,
};

const planOrder = ["free", "starter", "pro", "business"];

const planBadges: Record<string, { label: string; variant: "default" | "secondary" | "outline" } | null> = {
  free: null,
  starter: null,
  pro: { label: "Mais Popular", variant: "default" },
  business: { label: "Máximo Poder", variant: "secondary" },
};

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const { planType: currentPlanType, loading: planLoading } = useUserPlan();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price")
      .then(({ data }) => {
        const mapped = (data || []).map((p: any) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : [],
        }));
        mapped.sort((a: Plan, b: Plan) => planOrder.indexOf(a.plan_type) - planOrder.indexOf(b.plan_type));
        setPlans(mapped);
      });
  }, []);

  const isCurrentPlan = (type: string) => currentPlanType === type;
  const isUpgrade = (type: string) => {
    const current = planOrder.indexOf(currentPlanType);
    const target = planOrder.indexOf(type);
    return target > current;
  };

  if (isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="p-4 rounded-full bg-primary/10 text-primary">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="font-display text-2xl font-bold">Acesso Administrativo</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Como administrador, você já possui acesso ilimitado a todas as funcionalidades da plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Escolha seu Plano</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Comece gratuitamente e escale conforme suas necessidades crescem
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.plan_type);
          const isPro = plan.plan_type === "pro";
          const badge = planBadges[plan.plan_type];

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col transition-all ${
                isPro
                  ? "border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02]"
                  : plan.plan_type === "business"
                    ? "border-accent shadow-md"
                    : ""
              }`}
            >
              {badge && (
                <Badge variant={badge.variant} className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs whitespace-nowrap">
                  {badge.label}
                </Badge>
              )}

              <CardHeader className="text-center pt-8 pb-4">
                <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 text-primary w-fit">
                  {planIcons[plan.plan_type] || <Zap className="w-6 h-6" />}
                </div>
                <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold">
                    {plan.price === 0 ? "Grátis" : `R$ ${plan.price.toFixed(2).replace(".", ",")}`}
                  </span>
                  {plan.price > 0 && <span className="text-muted-foreground text-sm">/mês</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
                <div className="mt-3 text-sm font-semibold text-primary">
                  {plan.daily_limit === null ? "Análises ilimitadas" : `${plan.daily_limit} análises/dia`}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano Atual
                  </Button>
                ) : isUpgrade(plan.plan_type) ? (
                  <Button
                    className="w-full"
                    variant={isPro ? "default" : "default"}
                    onClick={() => navigate(`/checkout/${plan.id}`)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Assinar {plan.name}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Incluído no seu plano
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
