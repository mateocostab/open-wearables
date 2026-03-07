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
  Search,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useUserConnections } from '@/hooks/api/use-health';
import { useUsers } from '@/hooks/api/use-users';
import { providerDisplayNames } from '@/components/user/connection-card';
import { ROUTES } from '@/lib/constants/routes';
import logotype from '@/logotype.svg';
import { Button } from '@/components/ui/button';

interface HealthOSSidebarProps {
  activeSection: string;
  onNavigateToSection: (section: string) => void;
}

const dashboardItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'heart', label: 'Heart', icon: HeartPulse },
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
    <aside className="fixed inset-y-0 left-0 z-30 w-60 flex flex-col bg-[hsl(var(--sidebar))] border-r border-zinc-800/50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/30">
        <div className="flex items-center gap-2 mb-1">
          <img src={logotype} alt="HealthOS" className="h-5" />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-zinc-500">Local health node online</span>
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            document.dispatchEvent(event);
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900/50 border border-zinc-800/50 text-xs text-zinc-500 hover:border-zinc-700 transition-colors"
        >
          <Search className="h-3 w-3" />
          Search sections
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-3 space-y-5 overflow-y-auto">
        {/* Dashboard group */}
        <div>
          <p className="px-2 mb-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            Dashboard
          </p>
          <div className="space-y-0.5">
            {dashboardItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigateToSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all',
                    isActive
                      ? 'bg-cyan-500/10 text-white border-l-2 border-cyan-400 -ml-[1px]'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-cyan-400')} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Devices group */}
        <div>
          <p className="px-2 mb-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            Devices
          </p>
          <div className="space-y-0.5">
            {connections?.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-zinc-400"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">
                  {providerDisplayNames[conn.provider] ?? conn.provider}
                </span>
              </div>
            ))}
            {(!connections || connections.length === 0) && (
              <p className="px-2.5 py-1.5 text-xs text-zinc-600">
                No devices connected
              </p>
            )}
          </div>
        </div>

        {/* System group */}
        <div>
          <p className="px-2 mb-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            System
          </p>
          <div className="space-y-0.5">
            <Link
              to={ROUTES.settings}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800/30">
        <Button
          variant="ghost"
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="w-full justify-start gap-2 px-2.5 text-zinc-500 hover:text-red-400 text-sm"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </aside>
  );
}
