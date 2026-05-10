import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import {
  LayoutDashboard,
  MapPin,
  Users,
  ClipboardList,
  Calendar,
  Truck,
  Package,
  DollarSign,
  BarChart3,
  Map,
  Settings,
  FileText,
  MessageSquare,
  Shield,
  LogOut,
  User,
  Vote,
  Target,
  Activity,
  ShieldCheck,
  Brain,
  Sparkles,
  TrendingUp,
  BarChartBig,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Plano Estratégico", url: "/plano-estrategico", icon: Target },
  { title: "Sala de Situação", url: "/comando", icon: Activity },
  { title: "Plano de Campanha", url: "/plano", icon: Vote },
];

const modulesItems = [
  { title: "Territórios", url: "/territorios", icon: MapPin },
  { title: "Pessoas (CRM)", url: "/pessoas", icon: Users },
  { title: "Demandas", url: "/demandas", icon: ClipboardList },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Campo", url: "/campo", icon: Truck },
  { title: "Materiais", url: "/materiais", icon: Package },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Compliance", url: "/compliance", icon: ShieldCheck },
];

const analyticsItems = [
  { title: "Inteligência Política", url: "/inteligencia-politica", icon: Brain },
  { title: "Dashboard Eleitoral TSE", url: "/eleitoral", icon: BarChartBig },
  { title: "Mapa Estratégico", url: "/mapa-estrategico", icon: Target },
  { title: "Inteligência Territorial", url: "/inteligencia", icon: Brain },
  { title: "Copilots IA", url: "/copilot", icon: Sparkles },
  { title: "Pesquisas", url: "/pesquisas", icon: TrendingUp },
  { title: "BI / Dashboards", url: "/bi", icon: BarChart3 },
  { title: "Mapas", url: "/mapas", icon: Map },
];

const systemItems = [
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Comunicação", url: "/comunicacao", icon: MessageSquare },
];

const adminItems = [
  { title: "Gestão de Equipe", url: "/equipe", icon: Users },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Admin Geral", url: "/admin", icon: Shield },
];

const enterpriseItems = [
  { title: "War Room", url: "/war-room", icon: Target },
  { title: "Ranking (Gamificação)", url: "/gamificacao/ranking", icon: Sparkles },
  { title: "Disparo Omnichannel", url: "/comunicacao/disparo", icon: MessageSquare },
];

function SidebarNavGroup({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  collapsed: boolean;
}) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.url}
                tooltip={item.title}
              >
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-2"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const isAdmin = useIsAdmin();
  
  // Apenas quem gerencia vê a aba de Administração
  const { data: roles = [] } = useUserRoles();
  const canManage = roles.some(r => ["admin", "coord_geral", "coord_mobilizacao", "lideranca_regional", "lideranca_local"].includes(r));

  // Buscar configurações de Branding em tempo real
  const { data: settings = {} } = useSystemSettings();

  const brandName = settings["brand_name"] || "KIRIBAMBA";
  const brandNumber = settings["brand_number"] || "70";
  const brandSubtitle = settings["brand_subtitle"] || "Avante · Dep. Federal";

  const { mode, setMode, effectiveMode } = useTheme();

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="brand-number flex h-10 w-10 items-center justify-center rounded-lg text-base shadow-md">
            {brandNumber}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-sidebar-foreground leading-tight uppercase" style={{ fontFamily: "'Sora', sans-serif" }}>{brandName}</h2>
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/70 font-semibold truncate">
                {brandSubtitle}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarNavGroup label="Principal" items={mainItems} collapsed={collapsed} />
        <SidebarNavGroup label="Enterprise (War Room)" items={enterpriseItems} collapsed={collapsed} />
        <SidebarNavGroup label="Módulos" items={modulesItems} collapsed={collapsed} />
        <SidebarNavGroup label="Inteligência" items={analyticsItems} collapsed={collapsed} />
        <SidebarNavGroup label="Sistema" items={systemItems} collapsed={collapsed} />
        {canManage && <SidebarNavGroup label="Gestão & Admin" items={adminItems} collapsed={collapsed} />}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Meu perfil">
              <NavLink to="/perfil" className="flex items-center gap-2">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <span className="truncate text-xs">{profile?.full_name || "Meu Perfil"}</span>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setMode(effectiveMode === "dark" ? "light" : "dark")}
              tooltip={effectiveMode === "dark" ? "Modo Claro" : "Modo Escuro"}
            >
              {effectiveMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {!collapsed && <span>{effectiveMode === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sair">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
