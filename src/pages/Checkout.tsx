import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, CheckCircle, Loader2, Upload, ImageIcon, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generatePixCode } from "@/lib/pix";

export default function Checkout() {
  const { planId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [pixConfig, setPixConfig] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Envie uma imagem (JPG, PNG) ou PDF.");
      return;
    }

    setReceiptFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setReceiptPreview(url);
    } else {
      setReceiptPreview(null);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirm = async () => {
    if (!user || !plan) return;

    if (!receiptFile) {
      toast.error("Por favor, envie o comprovante de pagamento.");
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      // Upload receipt
      const ext = receiptFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, receiptFile);

      if (uploadError) throw new Error("Erro ao enviar comprovante: " + uploadError.message);

      setUploading(false);

      // Create payment request with receipt
      const { error } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        plan_id: plan.id,
        amount: plan.price,
        status: "pending",
        receipt_url: filePath,
      } as any);

      if (error) throw new Error("Erro ao registrar pagamento");

      setSubmitted(true);
      toast.success("Comprovante enviado! Aguarde a confirmação.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao processar pagamento");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (!plan || !pixConfig) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12 animate-fade-in">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="font-display text-2xl font-bold">Comprovante Enviado!</h1>
        <p className="text-muted-foreground">
          Seu comprovante foi recebido e está em análise. Após a confirmação, seu plano será ativado automaticamente.
        </p>
        <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-center">Pagamento via Pix</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-center">{plan.name}</CardTitle>
          <p className="text-center text-2xl font-display font-bold text-primary">
            R$ {Number(plan.price).toFixed(2).replace(".", ",")}
            <span className="text-sm text-muted-foreground font-normal">/mês</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          {(() => {
            const dynamicPixCode = generatePixCode(pixConfig.pix_code, Number(plan.price));
            return (
              <>
                <div className="flex justify-center">
                  <div className="bg-card p-4 rounded-xl border border-border">
                    <QRCodeSVG value={dynamicPixCode} size={200} />
                  </div>
                </div>

                {/* Pix Code */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Código Copia e Cola:</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted rounded-lg p-3 text-xs break-all font-mono max-h-20 overflow-auto">
                      {dynamicPixCode}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => {
                      navigator.clipboard.writeText(dynamicPixCode);
                      toast.success("Código Pix copiado!");
                    }} className="shrink-0">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Merchant */}
          <div className="text-sm">
            <p className="text-muted-foreground">Beneficiário:</p>
            <p className="font-medium">{pixConfig.merchant_name}</p>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            {pixConfig.payment_instructions}
          </div>

          {/* Receipt Upload */}
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Enviar Comprovante de Pagamento
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!receiptFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground group-hover:text-primary/70 transition-colors" />
                <p className="text-sm text-muted-foreground mt-2">
                  Clique para enviar o comprovante
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  JPG, PNG ou PDF • Máx. 5MB
                </p>
              </button>
            ) : (
              <div className="relative border border-border rounded-xl p-4 bg-muted/30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={removeReceipt}
                >
                  <X className="w-4 h-4" />
                </Button>

                {receiptPreview ? (
                  <img
                    src={receiptPreview}
                    alt="Comprovante"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-3 pr-8">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ImageIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{receiptFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(receiptFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-green-600 mt-2 text-center flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Comprovante selecionado
                </p>
              </div>
            )}
          </div>

          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={submitting || !receiptFile}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploading ? "Enviando comprovante..." : "Registrando..."}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Enviar comprovante e confirmar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
