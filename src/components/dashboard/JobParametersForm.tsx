import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Briefcase, Save, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export interface JobParameters {
  cargo: string;
  descricao: string;
  experienciaMinima: number;
  formacao: string;
  certificacoes: string;
  idiomas: string;
}

const defaultParams: JobParameters = {
  cargo: "",
  descricao: "",
  experienciaMinima: 0,
  formacao: "",
  certificacoes: "",
  idiomas: "",
};

interface Props {
  onSave: (params: JobParameters) => void;
  savedParams: JobParameters | null;
}

export function JobParametersForm({ onSave, savedParams }: Props) {
  const [params, setParams] = useState<JobParameters>(savedParams || defaultParams);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = (field: keyof JobParameters, value: string | number) => {
    setParams((p) => ({ ...p, [field]: value }));
  };

  const handleSave = () => {
    if (!params.cargo.trim()) {
      toast.error("Informe o cargo da vaga.");
      return;
    }
    onSave(params);
    toast.success("Parâmetros salvos!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Briefcase className="w-5 h-5 text-primary" />
          Parâmetros da Vaga
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cargo da vaga *</Label>
            <Input placeholder="Ex: Analista de Marketing" value={params.cargo} onChange={(e) => update("cargo", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Experiência mínima (anos)</Label>
            <Input type="number" min={0} value={params.experienciaMinima} onChange={(e) => update("experienciaMinima", parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descrição da vaga *</Label>
          <Textarea
            placeholder="Descreva as responsabilidades, habilidades necessárias, requisitos e diferenciais da vaga..."
            value={params.descricao}
            onChange={(e) => update("descricao", e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">A IA extrairá automaticamente habilidades e palavras-chave desta descrição.</p>
        </div>

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
              Configurações avançadas
              <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Formação acadêmica</Label>
              <Input placeholder="Ex: Graduação em Administração" value={params.formacao} onChange={(e) => update("formacao", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Certificações</Label>
                <Input placeholder="Ex: Google Ads, HubSpot" value={params.certificacoes} onChange={(e) => update("certificacoes", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Idiomas</Label>
                <Input placeholder="Ex: Inglês avançado" value={params.idiomas} onChange={(e) => update("idiomas", e.target.value)} />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Salvar Parâmetros
        </Button>
      </CardContent>
    </Card>
  );
}
