import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, XCircle, Shield } from "lucide-react";

interface PaymentRequest {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  status: string;
  created_at: string;
  profiles?: { email: string; full_name: string } | null;
  subscription_plans?: { name: string } | null;
}

export default function PaymentReview() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("payment_requests")
      .select("*, profiles:user_id(email, full_name), subscription_plans:plan_id(name)")
      .order("created_at", { ascending: false });
    setRequests((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, status: "confirmed" | "rejected", userId: string, planId: string) => {
    const { error } = await supabase
      .from("payment_requests")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }

    if (status === "confirmed") {
      await supabase.from("user_subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        status: "active",
      });
      toast.success("Pagamento confirmado e plano ativado!");
    } else {
      toast.info("Pagamento rejeitado.");
    }
    fetchRequests();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pendente</Badge>;
      case "confirmed": return <Badge className="bg-success text-success-foreground">Confirmado</Badge>;
      case "rejected": return <Badge variant="destructive">Rejeitado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Revisão de Pagamentos</h1>
        <p className="text-muted-foreground text-sm mt-1">Confirme ou rejeite pagamentos Pix pendentes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Shield className="w-5 h-5 text-primary" />
            Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : requests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum pagamento registrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{(req.profiles as any)?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{(req.profiles as any)?.email || req.user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{(req.subscription_plans as any)?.name || "—"}</TableCell>
                    <TableCell>R$ {Number(req.amount).toFixed(2).replace(".", ",")}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(req.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell>{statusBadge(req.status)}</TableCell>
                    <TableCell>
                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-success" onClick={() => handleAction(req.id, "confirmed", req.user_id, req.plan_id)}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Confirmar
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleAction(req.id, "rejected", req.user_id, req.plan_id)}>
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
