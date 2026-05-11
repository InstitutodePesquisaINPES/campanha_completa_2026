import React, { useState } from 'react';
import { useComunicacao } from '../../hooks/useComunicacao';
import { Send, Filter, Users, CheckCircle2 } from 'lucide-react';

export default function DisparoEmMassa() {
  const { gerarSegmentacaoMutation, dispararEmMassaMutation } = useComunicacao();
  const [bairro, setBairro] = useState('');
  const [scoreMin, setScoreMin] = useState(0);
  const [segmentoResult, setSegmentoResult] = useState<any>(null);

  const handleSimular = async () => {
    // Na prática, bairroId viria de um select
    const filtros = { scoreMin, bairroIds: bairro ? [bairro] : [] };
    const res = await gerarSegmentacaoMutation.mutateAsync(filtros);
    setSegmentoResult(res);
  };

  const handleDisparar = async () => {
    // Na prática criaria a Campanha no backend e enviaria o ID. Aqui é simplificado para mockup.
    alert("5.000 Mensagens enviadas para a fila do BullMQ com sucesso!");
    setSegmentoResult(null);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Send className="mr-3 text-blue-500" /> 
          Disparo Omnichannel (BullMQ)
        </h1>
        <p className="text-gray-500">Crie públicos-alvo cirúrgicos cruzando dados do CRM para disparos massivos em plano de fundo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center mb-4"><Filter className="w-5 h-5 mr-2" /> Segmentação Preditiva</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Score de Engajamento Mínimo</label>
              <input 
                type="number" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                value={scoreMin} onChange={(e) => setScoreMin(Number(e.target.value))} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Filtro Geográfico (Bairro ID Exemplo)</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                placeholder="Ex: uuid-do-bairro"
                value={bairro} onChange={(e) => setBairro(e.target.value)} 
              />
            </div>

            <button 
              onClick={handleSimular}
              disabled={gerarSegmentacaoMutation.isPending}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none"
            >
              {gerarSegmentacaoMutation.isPending ? 'Calculando...' : 'Calcular Audiência'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          {segmentoResult ? (
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <Users className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{segmentoResult.total} Eleitores Encontrados</h3>
              <p className="text-gray-500">O sistema filtrará todos os eleitores aptos para esta campanha.</p>
              
              <button 
                onClick={handleDisparar}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" /> Disparar Campanha
              </button>
            </div>
          ) : (
            <div className="text-gray-400">
              <Filter className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Aplique filtros ao lado para descobrir o tamanho do seu público-alvo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
