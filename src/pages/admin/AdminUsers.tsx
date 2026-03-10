import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getUserRoles = (userId: string) =>
    roles.filter((r) => r.user_id === userId).map((r) => r.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">Visualize todos os usuários cadastrados</p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
