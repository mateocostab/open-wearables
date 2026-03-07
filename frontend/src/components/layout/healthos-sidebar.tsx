import { Link } from '@tanstack/react-router';
import {
  Activity,
  Dumbbell,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Moon,
  Scale,
  Settings,
} from 'lucide-react';

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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useUserConnections } from '@/hooks/api/use-health';
import { useUsers } from '@/hooks/api/use-users';
import { providerDisplayNames } from '@/components/user/connection-card';
import { ROUTES } from '@/lib/constants/routes';
import logotype from '@/logotype.svg';

interface HealthOSSidebarProps {
  activeSection: string;
  onNavigateToSection: (section: string) => void;
}

const dashboardItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'recovery', label: 'Recovery & HRV', icon: HeartPulse },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'body', label: 'Body', icon: Scale },
] as const;

export function HealthOSSidebar({
  activeSection,
  onNavigateToSection,
}: HealthOSSidebarProps) {
  const { logout, isLoggingOut } = useAuth();
  const { data: usersData } = useUsers();
  const userId = usersData?.items?.[0]?.id ?? '';
  const { data: connections } = useUserConnections(userId);

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-1">
          <img src={logotype} alt="Open Wearables" className="h-auto max-h-8" />
          <SidebarTrigger className="md:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard Group */}
        <SidebarGroup>
          <SidebarGroupLabel>DASHBOARD</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onNavigateToSection(item.id)}
                      tooltip={item.label}
                      className={cn(
                        isActive &&
                          'border-l-2 border-cyan-400 rounded-l-none'
                      )}
                    >
                      <item.icon className="shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Devices Group */}
        <SidebarGroup>
          <SidebarGroupLabel>DEVICES</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {connections?.map((conn) => (
                <SidebarMenuItem key={conn.id}>
                  <SidebarMenuButton tooltip={providerDisplayNames[conn.provider] ?? conn.provider}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>
                      {providerDisplayNames[conn.provider] ?? conn.provider}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {(!connections || connections.length === 0) && (
                <p className="px-2 py-1.5 text-xs text-sidebar-foreground/50">
                  No devices connected
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Group */}
        <SidebarGroup>
          <SidebarGroupLabel>SYSTEM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link to={ROUTES.settings}>
                    <Settings className="shrink-0" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
