import React from 'react';
import { useGamificacao } from '../../hooks/useGamificacao';
import { Loader2, Trophy, Users, Star } from 'lucide-react';

export default function RankingLideres() {
  const { rankingQuery } = useGamificacao();

  if (rankingQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Trophy className="mr-3 text-yellow-500" /> 
          Top Cabos Eleitorais (Gamificação)
        </h1>
        <p className="text-gray-500">Acompanhe as lideranças que mais engajam a base de eleitores.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liderança</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eleitores Captados</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rankingQuery.data?.map((lider: any, idx: number) => (
              <tr key={lider.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  #{idx + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {lider.nome.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{lider.nome}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Users className="w-3 h-3 mr-1" />
                    {lider.eleitoresCaptados}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="flex items-center text-yellow-600 font-bold">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    {lider.scoreLider} pts
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
