import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Plan {
  id: string;
  name: string;
  plan_type: string;
  price: number;
  analysis_limit: number | null;
  description: string;
  features: string[];
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price")
      .then(({ data }) => {
        setPlans(
          (data || []).map((p: any) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features : [],
          }))
        );
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Planos</h1>
        <p className="text-muted-foreground text-sm mt-1">Escolha o melhor plano para suas necessidades</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.plan_type === "pro" ? "border-primary shadow-lg" : ""}>
            <CardHeader className="text-center">
              {plan.plan_type === "pro" && (
                <Badge className="w-fit mx-auto mb-2">Recomendado</Badge>
              )}
              <CardTitle className="font-display">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-display font-bold">
                  {plan.price === 0 ? "Grátis" : `R$ ${plan.price.toFixed(2).replace(".", ",")}`}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground text-sm">/mês</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.plan_type === "pro" ? (
                <Button className="w-full" onClick={() => navigate(`/checkout/${plan.id}`)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Assinar Pro
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Plano Atual
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
