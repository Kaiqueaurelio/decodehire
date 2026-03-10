import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Lock, Mail, CreditCard } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [planName, setPlanName] = useState("Gratuito");
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const [profileRes, subRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("user_subscriptions")
          .select("plan_id, subscription_plans(name)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);
      if (profileRes.data?.full_name) setFullName(profileRes.data.full_name);
      if (subRes.data) {
        const plan = subRes.data as any;
        setPlanName(plan.subscription_plans?.name || "Gratuito");
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdateName = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success("Nome atualizado com sucesso!");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      toast.error("Erro ao alterar senha: " + error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Atualize seu nome de exibição</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Plano atual:</Label>
            <Badge variant="default">{planName}</Badge>
          </div>
          <Button onClick={handleUpdateName} disabled={loading}>
            {loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5 text-primary" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Defina uma nova senha para sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Confirmar nova senha</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={handleChangePassword} disabled={passwordLoading}>
            {passwordLoading ? "Alterando..." : "Alterar senha"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
