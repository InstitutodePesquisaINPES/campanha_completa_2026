import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
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
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/campo" element={<PlaceholderPage title="Campo" stage={5} />} />
            <Route path="/materiais" element={<PlaceholderPage title="Materiais" stage={5} />} />
            <Route path="/financeiro" element={<PlaceholderPage title="Financeiro" stage={5} />} />
            <Route path="/bi" element={<PlaceholderPage title="BI / Dashboards" stage={6} />} />
            <Route path="/mapas" element={<PlaceholderPage title="Mapas" stage={6} />} />
            <Route path="/documentos" element={<PlaceholderPage title="Documentos" stage={6} />} />
            <Route path="/comunicacao" element={<PlaceholderPage title="Comunicação" stage={6} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
