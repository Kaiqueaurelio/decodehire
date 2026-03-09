import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";

export default function PixConfig() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("pix_config")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => setConfig(data));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase
      .from("pix_config")
      .update({
        pix_code: config.pix_code,
        merchant_name: config.merchant_name,
        payment_instructions: config.payment_instructions,
        is_enabled: config.is_enabled,
      })
      .eq("id", config.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else toast.success("Configuração salva!");
  };

  if (!config) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Configuração Pix</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as configurações de pagamento via Pix</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Settings className="w-5 h-5 text-primary" />
            Dados do Pix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Pagamento via Pix habilitado</Label>
            <Switch checked={config.is_enabled} onCheckedChange={(v) => setConfig({ ...config, is_enabled: v })} />
          </div>

          <div className="space-y-2">
            <Label>Código Pix (Copia e Cola)</Label>
            <Textarea
              value={config.pix_code}
              onChange={(e) => setConfig({ ...config, pix_code: e.target.value })}
              rows={4}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label>Nome do beneficiário</Label>
            <Input value={config.merchant_name} onChange={(e) => setConfig({ ...config, merchant_name: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Instruções de pagamento</Label>
            <Textarea
              value={config.payment_instructions || ""}
              onChange={(e) => setConfig({ ...config, payment_instructions: e.target.value })}
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
