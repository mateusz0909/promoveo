import { useCallback, useEffect, useState } from "react";
import type { TemplateSummary } from "@/types/project";

interface UseTemplatesResult {
  templates: TemplateSummary[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useTemplates = (device?: string): UseTemplatesResult => {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (device) {
        params.set("device", device);
      }

      const response = await fetch(`/api/templates${params.size ? `?${params.toString()}` : ""}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch templates (${response.status})`);
      }

      const payload = await response.json();
      const list: TemplateSummary[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.templates)
          ? payload.templates
          : [];

      setTemplates(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch templates"));
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [device]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    error,
    refresh: fetchTemplates,
  };
};
