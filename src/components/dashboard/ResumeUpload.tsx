import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onTextExtracted: (text: string, fileName: string) => void;
  fileName: string;
  onAnalyze: () => void;
  analyzing: boolean;
  canAnalyze: boolean;
}

export function ResumeUpload({ onTextExtracted, fileName, onAnalyze, analyzing, canAnalyze }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Envie um arquivo PDF ou DOCX.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const { data, error } = await supabase.functions.invoke("extract-text", {
        body: { fileBase64: base64, fileName: file.name, fileType: file.type },
      });

      if (error) throw error;
      if (!data?.text) throw new Error("Texto não extraído");

      onTextExtracted(data.text, file.name);
      toast.success("Currículo processado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao processar arquivo: " + (err.message || "Tente novamente"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Upload className="w-5 h-5 text-primary" />
          Upload do Currículo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Processando arquivo...</p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-success" />
              <p className="text-sm font-medium text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">Clique para trocar o arquivo</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Arraste ou clique para enviar</p>
              <p className="text-xs text-muted-foreground">PDF ou DOCX (máx. 10MB)</p>
            </div>
          )}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={onAnalyze}
          disabled={!canAnalyze || analyzing}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analisar Currículo com IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
