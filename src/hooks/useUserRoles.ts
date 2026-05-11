import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = 
  | "candidato"
  | "admin"
  | "coord_geral"
  | "coord_financeiro"
  | "coord_juridico"
  | "coord_comunicacao"
  | "coord_mobilizacao"
  | "lideranca_regional"
  | "lideranca_local"
  | "cabo_eleitoral"
  | "operador_crm"
  | "analista_dados";

const MANAGE_ROLES: AppRole[] = [
  "admin", 
  "coord_geral", 
  "coord_financeiro", 
  "coord_juridico", 
  "coord_comunicacao", 
  "coord_mobilizacao", 
  "lideranca_regional"
];

export function useUserRoles() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // The API now returns roles in the user object from the JWT/API Me endpoint
      return user.roles as AppRole[];
    },
    enabled: !!user && !loading,
    staleTime: Infinity,
  });
}

export function useHasRole(role: AppRole) {
  const { data: roles = [] } = useUserRoles();
  return roles.includes(role);
}

export function useIsAdmin() {
  return useHasRole("admin");
}

export function useCanManage() {
  const { data: roles = [] } = useUserRoles();
  return roles.some((role) => MANAGE_ROLES.includes(role));
}
