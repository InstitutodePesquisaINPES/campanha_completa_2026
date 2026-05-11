import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

export interface TenantSettingsData {
  id: string;
  tenantId: string;
  primaryColor?: string | null;
  logoUrl?: string | null;
  themeConfig?: any | null;
}

export function useTenantSettings() {
  return useQuery({
    queryKey: ["tenant-settings"],
    queryFn: async () => {
      const data = await api.get<TenantSettingsData>('/tenants/settings/current');
      return data;
    },
    enabled: !!api.getToken(),
  });
}

export function useUpdateTenantSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<TenantSettingsData>) => {
      return api.patch('/tenants/settings/current', settings);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-settings"] });
      toast.success("Configuração visual salva com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
