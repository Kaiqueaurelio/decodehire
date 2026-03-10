import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Briefcase, Save, ChevronDown, BookmarkPlus, Trash2, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useJobTemplates } from "@/hooks/useJobTemplates";
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [generating, setGenerating] = useState(false);

  const { templates, loading: templatesLoading, saveTemplate, deleteTemplate } = useJobTemplates();

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

  const handleSelectTemplate = (value: string) => {
    if (value === "new") {
      setParams(defaultParams);
      setSelectedTemplateId("");
      return;
    }
    const template = templates.find((t) => t.id === value);
    if (template) {
      setParams(template.parameters);
      setSelectedTemplateId(value);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Informe um nome para o template.");
      return;
    }
    if (!params.cargo.trim()) {
      toast.error("Preencha ao menos o cargo antes de salvar.");
      return;
    }
    await saveTemplate(templateName.trim(), params);
    setTemplateName("");
    setSaveDialogOpen(false);
    toast.success("Template salvo com sucesso!");
  };

  const handleGenerateDescription = async () => {
    if (!params.cargo.trim()) {
      toast.error("Informe o cargo antes de gerar a descrição.");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-description", {
        body: {
          cargo: params.cargo,
          formacao: params.formacao,
          experienciaMinima: params.experienciaMinima,
          certificacoes: params.certificacoes,
          idiomas: params.idiomas,
        },
      });
      if (error) throw error;
      if (data?.description) {
        update("descricao", data.description);
        toast.success("Descrição gerada com sucesso!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar descrição");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    if (selectedTemplateId === id) {
      setSelectedTemplateId("");
      setParams(defaultParams);
    }
    toast.success("Template excluído.");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Briefcase className="w-5 h-5 text-primary" />
            Parâmetros da Vaga
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Template salvo</Label>
            <div className="flex gap-2">
              <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={templatesLoading ? "Carregando..." : "Começar do zero"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Novo (do zero)</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDeleteTemplate(selectedTemplateId)}
                  title="Excluir template"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

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

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Salvar Parâmetros
            </Button>
            <Button variant="outline" onClick={() => setSaveDialogOpen(true)} title="Salvar como template">
              <BookmarkPlus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Salvar como Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome do template</Label>
            <Input
              placeholder="Ex: Analista de Marketing - Sênior"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveAsTemplate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAsTemplate}>
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
