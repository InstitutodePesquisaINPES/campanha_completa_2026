import { useMutation } from '@tanstack/react-query';
import { ApiClient } from '../services/api';

export const useComunicacao = () => {
  const dispararEmMassaMutation = useMutation({
    mutationFn: async (campanhaId: string) => {
      const res = await ApiClient.post('/comunicacao/enviar/massa', { campanhaId });
      return res.data;
    },
  });

  const gerarSegmentacaoMutation = useMutation({
    mutationFn: async (filtros: any) => {
      const res = await ApiClient.post('/pessoas/segmentacao', filtros);
      return res.data;
    },
  });

  return {
    dispararEmMassaMutation,
    gerarSegmentacaoMutation,
  };
};
