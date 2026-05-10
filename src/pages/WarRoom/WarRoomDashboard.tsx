import React from 'react';
import { useStrategy } from '../../hooks/useStrategy';
import { Map, TrendingUp, Users, Target, Activity } from 'lucide-react';

export default function WarRoomDashboard() {
  const { campanhasQuery } = useStrategy();

  if (campanhasQuery.isLoading) {
    return <div className="p-6 text-gray-500">Carregando mapa estratégico geopolítico...</div>;
  }

  const campanhas = campanhasQuery.data || [];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Map className="mr-3 text-red-600" /> War Room (Geopolítica)
        </h1>
        <p className="text-gray-500 mt-2">Centro de Comando. Controle de Sub-Campanhas, Dobradinhas e Custos.</p>
      </div>

      {campanhas.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhuma Estratégia Mestre Encontrada</h3>
          <p className="text-gray-500 mt-1">Crie a sua Campanha Principal para iniciar o War Room.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {campanhas.map((campanha: any) => (
            <div key={campanha.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">{campanha.abrangencia}</span>
                  <h2 className="text-2xl font-bold">{campanha.nome}</h2>
                  <p className="text-gray-400 text-sm mt-1">Meta: {campanha.metaVotos?.toLocaleString()} votos | Orçamento: R$ {campanha.orcamentoGlobal?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
                  <div className="text-xs text-gray-400 uppercase">Sub-Campanhas</div>
                  <div className="text-xl font-bold text-blue-400">{campanha.subCampanhas?.length || 0}</div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-blue-500" />
                  Redutos Regionais (Sub-Campanhas)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campanha.subCampanhas?.map((sub: any) => (
                    <div key={sub.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-gray-900">{sub.nome}</h4>
                      <p className="text-xs text-gray-500 mb-3">{sub.abrangencia} • {sub.eixos?.length || 0} Eixos Ativos</p>
                      
                      {sub.parcerias && sub.parcerias.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs font-semibold text-gray-500 mb-2">Dobradinhas (Parceiros):</div>
                          {sub.parcerias.map((p: any) => (
                            <div key={p.id} className="flex justify-between items-center text-sm bg-blue-50 px-2 py-1 rounded">
                              <span className="text-blue-800 font-medium">{p.candidatoParceiroNome}</span>
                              <span className="text-yellow-600 font-bold">{p.pesoEstrategico}★</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {campanha.subCampanhas?.length === 0 && (
                    <div className="text-sm text-gray-500 italic p-4 border border-dashed border-gray-300 rounded-lg">
                      Nenhuma sub-campanha regional cadastrada.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
