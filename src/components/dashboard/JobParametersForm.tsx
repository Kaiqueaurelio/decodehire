import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase, Save } from "lucide-react";
import { toast } from "sonner";

export interface JobParameters {
  cargo: string;
  area: string;
  habilidadesObrigatorias: string;
  habilidadesDesejaveis: string;
  experienciaMinima: number;
  responsabilidades: string;
  formacao: string;
  certificacoes: string;
  idiomas: string;
  palavrasChave: string;
}

const defaultParams: JobParameters = {
  cargo: "",
  area: "",
  habilidadesObrigatorias: "",
  habilidadesDesejaveis: "",
  experienciaMinima: 0,
  responsabilidades: "",
  formacao: "",
  certificacoes: "",
  idiomas: "",
  palavrasChave: "",
};

interface Props {
  onSave: (params: JobParameters) => void;
  savedParams: JobParameters | null;
}

export function JobParametersForm({ onSave, savedParams }: Props) {
  const [params, setParams] = useState<JobParameters>(savedParams || defaultParams);

  const update = (field: keyof JobParameters, value: string | number) => {
    setParams((p) => ({ ...p, [field]: value }));
  };

  const handleSave = () => {
    if (!params.cargo.trim()) {
      toast.error("Informe o cargo da vaga.");
      return;
    }
    onSave(params);
    toast.success("Parâmetros da vaga salvos!");
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
            <Label>Área profissional</Label>
            <Input placeholder="Ex: Marketing Digital" value={params.area} onChange={(e) => update("area", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Habilidades obrigatórias</Label>
          <Textarea placeholder="Separe por vírgula: SEO, Google Ads, Analytics" value={params.habilidadesObrigatorias} onChange={(e) => update("habilidadesObrigatorias", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Habilidades desejáveis</Label>
          <Textarea placeholder="Separe por vírgula: Copywriting, Social Media" value={params.habilidadesDesejaveis} onChange={(e) => update("habilidadesDesejaveis", e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Experiência mínima (anos)</Label>
            <Input type="number" min={0} value={params.experienciaMinima} onChange={(e) => update("experienciaMinima", parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Formação acadêmica</Label>
            <Input placeholder="Ex: Graduação em Administração" value={params.formacao} onChange={(e) => update("formacao", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Responsabilidades da função</Label>
          <Textarea placeholder="Descreva as principais responsabilidades" value={params.responsabilidades} onChange={(e) => update("responsabilidades", e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Certificações relevantes</Label>
            <Input placeholder="Ex: Google Ads, HubSpot" value={params.certificacoes} onChange={(e) => update("certificacoes", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Idiomas</Label>
            <Input placeholder="Ex: Inglês avançado, Espanhol" value={params.idiomas} onChange={(e) => update("idiomas", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Palavras-chave da vaga</Label>
          <Input placeholder="Separe por vírgula" value={params.palavrasChave} onChange={(e) => update("palavrasChave", e.target.value)} />
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Salvar Parâmetros
        </Button>
      </CardContent>
    </Card>
  );
}
