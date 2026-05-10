import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';

export const useGamificacao = () => {
  const rankingQuery = useQuery({
    queryKey: ['gamificacao-ranking'],
    queryFn: async () => {
      const res = await ApiClient.get('/gamificacao/ranking');
      return res.data;
    },
  });

  return {
    rankingQuery,
  };
};
