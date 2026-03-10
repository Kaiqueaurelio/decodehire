import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ShieldCheck, ShieldOff, Search, CreditCard, FileText, ArrowUpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface UserSub {
  user_id: string;
  plan_id: string;
  status: string;
  id: string;
}

interface Plan {
  id: string;
  name: string;
  plan_type: string;
}

type FilterType = "all" | "admin" | "with_plan" | "free";

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [subs, setSubs] = useState<UserSub[]>([]);
  const [plansList, setPlansList] = useState<Plan[]>([]);
  const [plans, setPlans] = useState<Map<string, string>>(new Map());
  const [analysisCounts, setAnalysisCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchData = async () => {
    const [usersRes, rolesRes, analysesRes, subsRes, plansRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("analysis_results").select("user_id"),
      supabase.from("user_subscriptions").select("id, user_id, plan_id, status").eq("status", "active"),
      supabase.from("subscription_plans").select("id, name, plan_type").eq("is_active", true),
    ]);
    setUsers(usersRes.data || []);
    setRoles(rolesRes.data || []);
    setSubs(subsRes.data || []);
    setPlansList(plansRes.data || []);
    setPlans(new Map((plansRes.data || []).map((p) => [p.id, p.name])));

    const counts: Record<string, number> = {};
    (analysesRes.data || []).forEach((a) => {
      counts[a.user_id] = (counts[a.user_id] || 0) + 1;
    });
    setAnalysisCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserPlan = (userId: string) => {
    const sub = subs.find((s) => s.user_id === userId);
    if (!sub) return null;
    return plans.get(sub.plan_id) || null;
  };

  const getUserPlanId = (userId: string) => {
    const sub = subs.find((s) => s.user_id === userId);
    return sub?.plan_id || "";
  };

  const handleChangePlan = async (userId: string, newPlanId: string) => {
    setChangingPlan(userId);
    try {
      const existingSub = subs.find((s) => s.user_id === userId);
      if (existingSub) {
        const { error } = await supabase
          .from("user_subscriptions")
          .update({ plan_id: newPlanId, started_at: new Date().toISOString() })
          .eq("id", existingSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_subscriptions")
          .insert({ user_id: userId, plan_id: newPlanId, status: "active" });
        if (error) throw error;
      }
      toast.success("Plano do usuário atualizado!");
      await fetchData();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setChangingPlan(null);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      );
    }
    if (filter === "admin") {
      result = result.filter((u) => roles.some((r) => r.user_id === u.user_id && r.role === "admin"));
    } else if (filter === "with_plan") {
      result = result.filter((u) => subs.some((s) => s.user_id === u.user_id));
    } else if (filter === "free") {
      result = result.filter((u) => !subs.some((s) => s.user_id === u.user_id));
    }
    return result;
  }, [users, search, filter, roles, subs]);

  const getUserRoles = (userId: string) =>
    roles.filter((r) => r.user_id === userId).map((r) => r.role);

  const isUserAdmin = (userId: string) =>
    roles.some((r) => r.user_id === userId && r.role === "admin");

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === user?.id) {
      toast.error("Você não pode alterar seu próprio papel de admin.");
      return;
    }
    setToggling(userId);
    try {
      if (currentlyAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
        toast.success("Permissão de admin removida.");
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" } as any);
        if (error) throw error;
        toast.success("Usuário promovido a admin.");
      }
      await fetchData();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setToggling(null);
    }
  };

  const adminCount = roles.filter((r) => r.role === "admin").length;
  const activeSubCount = subs.length;
  const totalAnalyses = Object.values(analysisCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">Visualize, gerencie permissões e planos dos usuários</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <p className="text-lg font-bold font-display">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <div>
              <p className="text-lg font-bold font-display">{adminCount}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-primary" />
            <div>
              <p className="text-lg font-bold font-display">{activeSubCount}</p>
              <p className="text-xs text-muted-foreground">Com plano</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <FileText className="w-4 h-4 text-info" />
            <div>
              <p className="text-lg font-bold font-display">{totalAnalyses}</p>
              <p className="text-xs text-muted-foreground">Análises</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 font-display">
              <Users className="w-5 h-5 text-primary" />
              Usuários ({filteredUsers.length})
            </CardTitle>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="with_plan">Com plano</SelectItem>
                  <SelectItem value="free">Gratuitos</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {search || filter !== "all" ? "Nenhum resultado encontrado" : "Nenhum usuário cadastrado"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Alterar Plano</TableHead>
                    <TableHead>Análises</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const admin = isUserAdmin(u.user_id);
                    const isSelf = u.user_id === user?.id;
                    const userPlan = getUserPlan(u.user_id);
                    const userPlanId = getUserPlanId(u.user_id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                        <TableCell>
                          {userPlan ? (
                            <Badge variant="default" className="text-xs">{userPlan}</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Gratuito</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={userPlanId}
                            onValueChange={(v) => handleChangePlan(u.user_id, v)}
                            disabled={changingPlan === u.user_id}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Selecionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {plansList.map((p) => (
                                <SelectItem key={p.id} value={p.id} className="text-xs">
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{analysisCounts[u.user_id] || 0}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {getUserRoles(u.user_id).map((role) => (
                              <Badge key={role} variant={role === "admin" ? "default" : "secondary"} className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={admin ? "destructive" : "outline"}
                            disabled={isSelf || toggling === u.user_id}
                            onClick={() => toggleAdmin(u.user_id, admin)}
                            className="text-xs h-8"
                          >
                            {admin ? (
                              <><ShieldOff className="w-3.5 h-3.5 mr-1" /> Remover</>
                            ) : (
                              <><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Promover</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
