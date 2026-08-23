import {
  LayoutDashboard,
  FileText,
  Users,
  ScrollText,
  Terminal,
  ChevronLeft,
  Hexagon,
  Zap,
  Home,
  Code2,
  ChevronDown,
  KanbanSquare,
  Briefcase,
  BarChart2,
  UserCheck,
  Bot,
  Workflow,
  Globe
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import straxonLogo from "@/assets/straxonlogo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/lib/workspaces";

const navItems = [
  { tKey: "home", url: "/", icon: Home },
  { tKey: "dashboard", url: "/dashboard", icon: LayoutDashboard },
  { tKey: "intelligence", url: "/intelligence", icon: BarChart2 },
  { tKey: "deals", url: "/deals", icon: KanbanSquare },
  { tKey: "projects", url: "/projects", icon: Briefcase },
  { tKey: "invoices", url: "/invoices", icon: FileText },
  { tKey: "clients", url: "/clients", icon: Users },
  { tKey: "proposals", url: "/proposals", icon: ScrollText },
  { tKey: "team", url: "/team", icon: UserCheck },
  { tKey: "auditVault", url: "/audit-log", icon: Terminal },
  { tKey: "devTools", url: "/dev-tools", icon: Bot },
  { tKey: "automations", url: "/automations", icon: Workflow },
  { tKey: "straxonLabs", url: "https://straxonlabs.vercel.app/", icon: Globe },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { workspace, workspaces, setWorkspaceById } = useWorkspace();
  const { t, i18n } = useTranslation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden">
              <img src={straxonLogo} alt="Straxon Labs Logo" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" />
          </div>
          {!collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col min-w-0 text-left group cursor-pointer outline-none">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 flex-shrink-0" style={{ color: `hsl(${workspace.accentHue} 100% 50%)` }} />
                  <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: `hsl(${workspace.accentHue} 100% 50%)` }}>
                    {workspace.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground tracking-widest uppercase">{workspace.tagline.split(" ").slice(0, 2).join(" ")}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-popover border-border">
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => setWorkspaceById(ws.id)}
                    className={`cursor-pointer ${ws.id === workspace.id ? "bg-primary/10" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: `hsl(${ws.accentHue} 100% 50%)` }}
                      />
                      <div>
                        <p className="text-xs font-medium text-foreground">{ws.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ws.tagline}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isExternal = item.url.startsWith("http");
                const isActive = !isExternal && location.pathname === item.url;
                const title = t(`sidebar.${item.tKey}`);
                
                return (
                  <SidebarMenuItem key={item.tKey}>
                    <SidebarMenuButton asChild>
                      {isExternal ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && <span className="font-medium">{title}</span>}
                        </a>
                      ) : (
                        <NavLink
                          to={item.url}
                          end
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                          activeClassName=""
                        >
                          <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                          {!collapsed && <span className="font-medium">{title}</span>}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="flex gap-2 mb-2 px-2 pb-2 border-b border-border/50 justify-center">
            <button onClick={() => i18n.changeLanguage('en')} className={`text-xs px-2 py-1 rounded transition-colors ${i18n.language === 'en' ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>EN</button>
            <button onClick={() => i18n.changeLanguage('es')} className={`text-xs px-2 py-1 rounded transition-colors ${i18n.language === 'es' ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>ES</button>
            <button onClick={() => i18n.changeLanguage('fr')} className={`text-xs px-2 py-1 rounded transition-colors ${i18n.language === 'fr' ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>FR</button>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
