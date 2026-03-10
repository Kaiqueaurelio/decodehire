import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Package, Plus, Edit2, Users } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  plan_type: string;
  price: number;
  daily_limit: number | null;
  analysis_limit: number | null;
  is_active: boolean;
  features: any;
  created_at: string;
}

const emptyPlan = {
  name: "",
  description: "",
  plan_type: "free",
  price: 0,
  daily_limit: 5,
  analysis_limit: null as number | null,
  is_active: true,
  features: [] as string[],
};

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subCounts, setSubCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyPlan);
  const [featuresText, setFeaturesText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    const [plansRes, subsRes] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("price", { ascending: true }),
      supabase.from("user_subscriptions").select("plan_id, status").eq("status", "active"),
    ]);
    setPlans(plansRes.data || []);

    const counts: Record<string, number> = {};
    (subsRes.data || []).forEach((s) => {
      counts[s.plan_id] = (counts[s.plan_id] || 0) + 1;
    });
    setSubCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPlan);
    setFeaturesText("");
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description || "",
      plan_type: plan.plan_type,
      price: plan.price,
      daily_limit: plan.daily_limit,
      analysis_limit: plan.analysis_limit,
      is_active: plan.is_active,
      features: Array.isArray(plan.features) ? plan.features : [],
    });
    setFeaturesText(
      Array.isArray(plan.features) ? plan.features.join("\n") : ""
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);

    const features = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      description: form.description || null,
      plan_type: form.plan_type,
      price: form.price,
      daily_limit: form.daily_limit,
      analysis_limit: form.analysis_limit,
      is_active: form.is_active,
      features,
    };

    const typedPayload = {
      ...payload,
      plan_type: payload.plan_type as "free" | "pro" | "business",
    };

    if (editing) {
      const { error } = await supabase
        .from("subscription_plans")
        .update(typedPayload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Erro ao atualizar: " + error.message);
      } else {
        toast.success("Plano atualizado!");
      }
    } else {
      const { error } = await supabase
        .from("subscription_plans")
        .insert(typedPayload);
      if (error) {
        toast.error("Erro ao criar: " + error.message);
      } else {
        toast.success("Plano criado!");
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchPlans();
  };

  const toggleActive = async (plan: Plan) => {
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);
    if (error) {
      toast.error("Erro ao atualizar");
    } else {
      toast.success(plan.is_active ? "Plano desativado" : "Plano ativado");
      fetchPlans();
    }
  };

  const planTypeBadge = (type: string) => {
    switch (type) {
      case "free": return <Badge variant="secondary">Gratuito</Badge>;
      case "pro": return <Badge className="bg-primary/10 text-primary border-primary/20">Pro</Badge>;
      case "business": return <Badge className="bg-accent/10 text-accent border-accent/20">Business</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gerenciamento de Planos</h1>
          <p className="text-muted-foreground text-sm mt-1">Crie e edite os planos de assinatura</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Novo Plano
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${!plan.is_active ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">{plan.name}</CardTitle>
                  {planTypeBadge(plan.plan_type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-bold font-display">
                  {plan.price === 0
                    ? "Grátis"
                    : `R$ ${plan.price.toFixed(2).replace(".", ",")}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mês</span>}
                </p>

                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Limite diário</span>
                    <span className="font-medium">
                      {plan.daily_limit === null ? "Ilimitado" : plan.daily_limit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assinantes ativos</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {subCounts[plan.id] || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={plan.is_active ? "default" : "secondary"} className="text-xs">
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>

                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Recursos:</p>
                    <ul className="space-y-1">
                      {(plan.features as string[]).slice(0, 5).map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-accent mt-0.5">•</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => openEdit(plan)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant={plan.is_active ? "secondary" : "default"}
                    className="text-xs"
                    onClick={() => toggleActive(plan)}
                  >
                    {plan.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Plano Pro"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Descrição curta do plano"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.plan_type} onValueChange={(v) => setForm({ ...form, plan_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Gratuito</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limite diário</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.daily_limit ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      daily_limit: e.target.value === "" ? null : parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Vazio = ilimitado"
                />
              </div>

              <div className="space-y-2">
                <Label>Limite total</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.analysis_limit ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      analysis_limit: e.target.value === "" ? null : parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Vazio = ilimitado"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recursos (um por linha)</Label>
              <Textarea
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={4}
                placeholder={"Análise de currículos com IA\nExportação CSV\nSuporte prioritário"}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Plano ativo</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
