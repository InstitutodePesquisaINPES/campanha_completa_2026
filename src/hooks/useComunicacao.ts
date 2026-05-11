import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export const useComunicacao = () => {
  const dispararEmMassaMutation = useMutation({
    mutationFn: async (campanhaId: string) => {
      const res = await api.post<any>('/comunicacao/enviar/massa', { campanhaId });
      return res;
    },
  });

  const gerarSegmentacaoMutation = useMutation({
    mutationFn: async (filtros: any) => {
      const res = await api.post<any>('/pessoas/segmentacao', filtros);
      return res;
    },
  });

  return {
    dispararEmMassaMutation,
    gerarSegmentacaoMutation,
  };
};
