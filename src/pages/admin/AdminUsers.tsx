import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ShieldCheck, ShieldOff } from "lucide-react";
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

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = async () => {
    const [usersRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setUsers(usersRes.data || []);
    setRoles(rolesRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
        toast.success("Permissão de admin removida.");
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" } as any);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">Visualize e gerencie permissões dos usuários</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Users className="w-5 h-5 text-primary" />
            Usuários ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum usuário cadastrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const admin = isUserAdmin(u.user_id);
                    const isSelf = u.user_id === user?.id;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell className="text-sm">{u.email || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {getUserRoles(u.user_id).map((role) => (
                              <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={admin ? "destructive" : "outline"}
                            disabled={isSelf || toggling === u.user_id}
                            onClick={() => toggleAdmin(u.user_id, admin)}
                          >
                            {admin ? (
                              <><ShieldOff className="w-4 h-4 mr-1" /> Remover Admin</>
                            ) : (
                              <><ShieldCheck className="w-4 h-4 mr-1" /> Promover Admin</>
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
