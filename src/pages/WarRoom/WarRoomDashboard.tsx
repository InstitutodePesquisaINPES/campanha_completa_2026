import React from 'react';
import { useStrategy } from '../../hooks/useStrategy';
import { Map, Target, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Animações Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function WarRoomDashboard() {
  const { campanhasQuery } = useStrategy();

  if (campanhasQuery.isLoading) {
    return <div className="p-6 text-gray-500 animate-pulse">Iniciando satélites do Command Center...</div>;
  }

  const campanhas = campanhasQuery.data || [];

  return (
    <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
          <Map className="mr-3 text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" /> 
          War Room <span className="font-light ml-2 text-slate-400">| Geopolítica</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Command Center. Controle de Orçamento, Sub-Campanhas e Dobradinhas em tempo real.</p>
      </motion.div>

      {campanhas.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 rounded-2xl text-center"
        >
          <Target className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nenhuma Estratégia Mestre Detectada</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Inicie o seu plano de voo criando a Primeira Campanha.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {campanhas.map((campanha: any) => {
            // Cálculos para o Gráfico de Orçamento
            const orcamentoTotal = campanha.orcamentoGlobal || 1;
            // Simulando um gasto de 30% se não houver dados reais (para UI Preview)
            const gastoReal = 0; 
            const disponivel = orcamentoTotal - gastoReal;
            
            const chartData = [
              { name: 'Executado', value: gastoReal, color: '#ef4444' }, // red-500
              { name: 'Disponível', value: disponivel, color: '#10b981' } // emerald-500
            ];

            return (
              <motion.div key={campanha.id} variants={itemVariants as any} className="glass-card rounded-2xl overflow-hidden group">
                {/* Header Premium */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-3">
                        {campanha.abrangencia}
                      </span>
                      <h2 className="text-3xl font-black tracking-tight">{campanha.nome}</h2>
                      <div className="flex gap-4 mt-3 text-sm text-slate-400 font-medium">
                        <span className="flex items-center"><Target className="w-4 h-4 mr-1" /> Meta: {campanha.metaVotos?.toLocaleString()} Votos</span>
                      </div>
                    </div>
                    
                    {/* Donut Chart de Orçamento */}
                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                      <div className="w-24 h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              innerRadius={25}
                              outerRadius={40}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Orçamento Global</div>
                        <div className="text-2xl font-black text-emerald-400 glow-text">R$ {campanha.orcamentoGlobal?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-campanhas Regionais */}
                <div className="p-8 bg-white/50 dark:bg-slate-900/50">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase mb-6 flex items-center tracking-wider">
                    <Activity className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Pólos Regionais (Sub-Campanhas)
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {campanha.subCampanhas?.map((sub: any) => (
                      <motion.div 
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        key={sub.id} 
                        className="glass-card p-6 rounded-xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{sub.nome}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{sub.abrangencia} • {sub.eixos?.length || 0} Eixos</p>
                        
                        {sub.parcerias && sub.parcerias.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Rede de Parcerias (Dobradinhas)</div>
                            <div className="space-y-2">
                              {sub.parcerias.map((p: any) => (
                                <div key={p.id} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.candidatoParceiroNome}</span>
                                  <span className="flex text-yellow-500 text-sm">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <span key={i} className={i < p.pesoEstrategico ? "opacity-100" : "opacity-30"}>★</span>
                                    ))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {campanha.subCampanhas?.length === 0 && (
                      <div className="col-span-full text-sm text-slate-400 italic p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                        O mapa está vazio. Crie sub-campanhas regionais para iniciar a expansão geopolítica.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
