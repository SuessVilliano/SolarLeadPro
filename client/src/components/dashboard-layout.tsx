import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Sun, Moon, LayoutDashboard, Users, FileText, MessageCircle, Settings,
  BarChart3, Zap, ClipboardList, LogOut, HelpCircle, BookOpen, Bot, ChevronUp,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const adminNav = [
  { title: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Leads", icon: Users, href: "/dashboard/leads" },
  { title: "Projects", icon: Zap, href: "/dashboard/projects" },
  { title: "Team", icon: Users, href: "/dashboard/team" },
  { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

const repNav = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "My Leads", icon: Users, href: "/dashboard/leads" },
  { title: "My Projects", icon: Zap, href: "/dashboard/projects" },
  { title: "Tasks", icon: ClipboardList, href: "/dashboard/tasks" },
  { title: "Messages", icon: MessageCircle, href: "/dashboard/messages" },
];

const clientNav = [
  { title: "My Project", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Solar Details", icon: Zap, href: "/dashboard/solar" },
  { title: "Documents", icon: FileText, href: "/dashboard/documents" },
  { title: "Messages", icon: MessageCircle, href: "/dashboard/messages" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [location, navigate] = useLocation();

  const navItems = user?.role === "admin" ? adminNav : user?.role === "rep" ? repNav : clientNav;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "U";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-poppins font-semibold">LIV8 Solar</span>
                      <span className="text-xs text-muted-foreground capitalize">{user?.role} Portal</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href))}
                        tooltip={item.title}
                      >
                        <a href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Support</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/dashboard/help"} tooltip="Help Docs">
                      <a href="/dashboard/help">
                        <BookOpen className="h-4 w-4" />
                        <span>Help Docs</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="AI Assistant" onClick={() => {
                      const event = new CustomEvent("toggle-ai-assistant");
                      window.dispatchEvent(event);
                    }}>
                      <button>
                        <Bot className="h-4 w-4" />
                        <span>AI Assistant</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              {/* Theme Toggle */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                >
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* User Menu */}
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-medium text-sm">{user?.firstName} {user?.lastName}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                      <ChevronUp className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-56">
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/help")}>
                      <HelpCircle className="mr-2 h-4 w-4" /> Help
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="flex items-center gap-2 border-b p-3 md:p-4 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground capitalize">{user?.role} Dashboard</span>
          </div>
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
