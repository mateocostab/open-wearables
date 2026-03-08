import { Link, useLocation } from '@tanstack/react-router';
import {
  Home,
  LogOut,
  Settings,
} from 'lucide-react';
import logotype from '@/logotype.svg';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/lib/constants/routes';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Dashboard',
    url: ROUTES.dashboard,
    icon: Home,
  },
  {
    title: 'Settings',
    url: ROUTES.settings,
    icon: Settings,
  },
];

export function SimpleSidebar() {
  const location = useLocation();
  const { logout, isLoggingOut } = useAuth();

  return (
    <aside className="relative w-64 bg-black flex flex-col border-r border-zinc-900">
      {/* Header */}
      <div className="p-4 border-b border-zinc-900">
        <img src={logotype} alt="Mateo's HealthOS" className="h-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.url);

          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200',
                isActive
                  ? 'bg-zinc-900 text-white border-l-2 border-white -ml-[2px] pl-[calc(0.75rem+2px)]'
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-white' : 'text-zinc-500'
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-zinc-900" />

      {/* Footer */}
      <div className="p-3">
        <Button
          variant="ghost"
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="w-full justify-start gap-3 px-3 text-zinc-400 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </aside>
  );
}
