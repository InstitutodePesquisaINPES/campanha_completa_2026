import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';

export const useStrategy = () => {
  const queryClient = useQueryClient();

  const campanhasQuery = useQuery({
    queryKey: ['campanhas-estrategia'],
    queryFn: async () => {
      const res = await ApiClient.get('/strategy/campanhas');
      return res.data;
    },
  });

  const warRoomStatsQuery = (campanhaId: string) => useQuery({
    queryKey: ['war-room-stats', campanhaId],
    queryFn: async () => {
      const res = await ApiClient.get(`/strategy/war-room/${campanhaId}`);
      return res.data;
    },
    enabled: !!campanhaId,
  });

  const createCampanhaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await ApiClient.post('/strategy/campanhas', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas-estrategia'] });
    },
  });

  const createEixoMutation = useMutation({
    mutationFn: async ({ campanhaId, data }: { campanhaId: string; data: any }) => {
      const res = await ApiClient.post(`/strategy/campanhas/${campanhaId}/eixos`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas-estrategia'] });
    },
  });

  const createParceriaMutation = useMutation({
    mutationFn: async ({ campanhaId, data }: { campanhaId: string; data: any }) => {
      const res = await ApiClient.post(`/strategy/campanhas/${campanhaId}/parcerias`, data);
      return res.data;
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
