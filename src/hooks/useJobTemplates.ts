import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { JobParameters } from "@/components/dashboard/JobParametersForm";

export interface JobTemplate {
  id: string;
  name: string;
  parameters: JobParameters;
  created_at: string;
  updated_at: string;
}

export function useJobTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) { setTemplates([]); setLoading(false); return; }
    const { data } = await supabase
      .from("job_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setTemplates(
      (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        parameters: t.parameters as JobParameters,
        created_at: t.created_at,
        updated_at: t.updated_at,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const saveTemplate = async (name: string, parameters: JobParameters) => {
    if (!user) throw new Error("Usuário não autenticado");
    const { error } = await supabase.from("job_templates").insert({
      user_id: user.id,
      name,
      parameters: parameters as any,
    });
    if (error) {
      console.error("Erro ao salvar template:", error);
      throw error;
    }
    await fetchTemplates();
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("job_templates").delete().eq("id", id);
    await fetchTemplates();
  };

  return { templates, loading, saveTemplate, deleteTemplate, refresh: fetchTemplates };
}
