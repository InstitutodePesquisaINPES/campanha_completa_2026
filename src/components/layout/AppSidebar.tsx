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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useUserRoles";
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
  { title: "Plano 90 dias", url: "/plano", icon: Vote },
];

const modulesItems = [
  { title: "Territórios", url: "/territorios", icon: MapPin },
  { title: "Pessoas (CRM)", url: "/pessoas", icon: Users },
  { title: "Demandas", url: "/demandas", icon: ClipboardList },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Campo", url: "/campo", icon: Truck },
  { title: "Materiais", url: "/materiais", icon: Package },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
];

const analyticsItems = [
  { title: "Mapa Estratégico", url: "/mapa-estrategico", icon: Target },
  { title: "BI / Dashboards", url: "/bi", icon: BarChart3 },
  { title: "Mapas", url: "/mapas", icon: Map },
];

const systemItems = [
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Comunicação", url: "/comunicacao", icon: MessageSquare },
];

const adminItems = [
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            S
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground">SIGT</h2>
              <p className="text-[10px] text-sidebar-foreground/60">Gestão Territorial</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarNavGroup label="Principal" items={mainItems} collapsed={collapsed} />
        <SidebarNavGroup label="Módulos" items={modulesItems} collapsed={collapsed} />
        <SidebarNavGroup label="Inteligência" items={analyticsItems} collapsed={collapsed} />
        <SidebarNavGroup label="Sistema" items={systemItems} collapsed={collapsed} />
        {isAdmin && <SidebarNavGroup label="Administração" items={adminItems} collapsed={collapsed} />}
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
