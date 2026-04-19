import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TerritoriosPage from "./pages/territorial/TerritoriosPage";
import PessoasPage from "./pages/crm/PessoasPage";
import DemandasPage from "./pages/demandas/DemandasPage";
import AgendaPage from "./pages/agenda/AgendaPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/admin/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import MateriaisPageRoute from "./pages/materiais/MateriaisPageRoute";
import FinanceiroPageRoute from "./pages/financeiro/FinanceiroPageRoute";
import BIPage from "./pages/bi/BIPage";
import MapasPage from "./pages/mapas/MapasPage";
import ComunicacaoPage from "./pages/comunicacao/ComunicacaoPage";
import PlanoCampanhaPage from "./pages/plano/PlanoCampanhaPage";
import MapaEstrategicoPage from "./pages/mapa-estrategico/MapaEstrategicoPage";
import InteligenciaPoliticaPage from "./pages/inteligencia-politica/InteligenciaPoliticaPage";
import PlanoEstrategicoPage from "./pages/plano-estrategico/PlanoEstrategicoPage";

import CampoPage from "./pages/campo/CampoPage";
import DocumentosPage from "./pages/documentos/DocumentosPage";
import ComandoPage from "./pages/comando/ComandoPage";
import CompliancePage from "./pages/compliance/CompliancePage";
import InteligenciaPage from "./pages/inteligencia/InteligenciaPage";
import CopilotPage from "./pages/copilot/CopilotPage";
import PesquisasPage from "./pages/pesquisas/PesquisasPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<SignupPage />} />
              <Route path="/" element={<Index />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="/territorios" element={<TerritoriosPage />} />
              <Route path="/pessoas" element={<PessoasPage />} />
              <Route path="/demandas" element={<DemandasPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/campo" element={<CampoPage />} />
              <Route path="/materiais" element={<MateriaisPageRoute />} />
              <Route path="/financeiro" element={<FinanceiroPageRoute />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/inteligencia" element={<InteligenciaPage />} />
              <Route path="/comando" element={<ComandoPage />} />
              <Route path="/plano" element={<PlanoCampanhaPage />} />
              <Route path="/mapa-estrategico" element={<MapaEstrategicoPage />} />
              <Route path="/inteligencia-politica" element={<InteligenciaPoliticaPage />} />
              <Route path="/plano-estrategico" element={<PlanoEstrategicoPage />} />
              <Route path="/bi" element={<BIPage />} />
              <Route path="/mapas" element={<MapasPage />} />
              <Route path="/documentos" element={<DocumentosPage />} />
              <Route path="/comunicacao" element={<ComunicacaoPage />} />
              <Route path="/copilot" element={<CopilotPage />} />
              <Route path="/pesquisas" element={<PesquisasPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
