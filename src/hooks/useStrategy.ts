import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export const useStrategy = () => {
  const queryClient = useQueryClient();

  const campanhasQuery = useQuery({
    queryKey: ['campanhas-estrategia'],
    queryFn: async () => {
      const res = await api.get<any>('/strategy/campanhas');
      return res;
    },
  });

  const warRoomStatsQuery = (campanhaId: string) => useQuery({
    queryKey: ['war-room-stats', campanhaId],
    queryFn: async () => {
      const res = await api.get<any>(`/strategy/war-room/${campanhaId}`);
      return res;
    },
    enabled: !!campanhaId,
  });

  const createCampanhaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post<any>('/strategy/campanhas', data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas-estrategia'] });
    },
  });

  const createEixoMutation = useMutation({
    mutationFn: async ({ campanhaId, data }: { campanhaId: string; data: any }) => {
      const res = await api.post<any>(`/strategy/campanhas/${campanhaId}/eixos`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas-estrategia'] });
    },
  });

  const createParceriaMutation = useMutation({
    mutationFn: async ({ campanhaId, data }: { campanhaId: string; data: any }) => {
      const res = await api.post<any>(`/strategy/campanhas/${campanhaId}/parcerias`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas-estrategia'] });
    },
  });

  return {
    campanhasQuery,
    warRoomStatsQuery,
    createCampanhaMutation,
    createEixoMutation,
    createParceriaMutation,
  };
};
