import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

type StatusFilter = "all" | "pending" | "confirmed" | "rejected";

export default function PaymentReview() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    id: string;
    action: "confirmed" | "rejected";
    userId: string;
    planId: string;
  } | null>(null);

  const fetchRequests = async () => {
    // Fetch payment requests
    const { data: payments } = await supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!payments || payments.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Fetch profiles and plans separately to avoid FK join issues
    const userIds = [...new Set(payments.map((p) => p.user_id))];
    const planIds = [...new Set(payments.map((p) => p.plan_id))];

    const [profilesRes, plansRes] = await Promise.all([
      supabase.from("profiles").select("user_id, email, full_name").in("user_id", userIds),
      supabase.from("subscription_plans").select("id, name").in("id", planIds),
    ]);

    const profilesMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
    const plansMap = new Map((plansRes.data || []).map((p) => [p.id, p]));

    const enriched = payments.map((req) => ({
      ...req,
      profiles: profilesMap.get(req.user_id) || null,
      subscription_plans: plansMap.get(req.plan_id) || null,
    }));

    setRequests(enriched as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

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
      await supabase.from("user_subscriptions").insert({ user_id: userId, plan_id: planId, status: "active" });
      toast.success("Pagamento confirmado e plano ativado!");
    } else {
      toast.info("Pagamento rejeitado.");
    }
    fetchRequests();
    setConfirmDialog(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Confirmado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "Todos", value: "all" },
    { label: "Pendentes", value: "pending" },
    { label: "Confirmados", value: "confirmed" },
    { label: "Rejeitados", value: "rejected" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Revisão de Pagamentos</h1>
        <p className="text-muted-foreground text-sm mt-1">Confirme ou rejeite pagamentos Pix pendentes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 font-display">
              <Shield className="w-5 h-5 text-primary" />
              Pagamentos
            </CardTitle>
            <div className="flex gap-1.5">
              {filters.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={statusFilter === f.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(f.value)}
                  className="text-xs"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum pagamento encontrado</p>
          ) : (
            <div className="overflow-x-auto">
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
                  {filteredRequests.map((req) => (
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
                        {new Date(req.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell>
                        {req.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() =>
                                setConfirmDialog({ open: true, id: req.id, action: "confirmed", userId: req.user_id, planId: req.plan_id })
                              }
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() =>
                                setConfirmDialog({ open: true, id: req.id, action: "rejected", userId: req.user_id, planId: req.plan_id })
                              }
                            >
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === "confirmed" ? "Confirmar pagamento?" : "Rejeitar pagamento?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "confirmed"
                ? "O plano será ativado automaticamente para o usuário."
                : "O pagamento será marcado como rejeitado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDialog && handleAction(confirmDialog.id, confirmDialog.action, confirmDialog.userId, confirmDialog.planId)
              }
              className={confirmDialog?.action === "rejected" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmDialog?.action === "confirmed" ? "Confirmar" : "Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
