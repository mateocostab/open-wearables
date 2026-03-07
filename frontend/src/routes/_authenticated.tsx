import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { isAuthenticated } from '@/lib/auth/session';
import { DEFAULT_REDIRECTS, ROUTES } from '@/lib/constants/routes';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { HealthOSSidebar } from '@/components/layout/healthos-sidebar';
import { CommandPalette } from '@/components/layout/command-palette';
import { useCallback } from 'react';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: () => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!isAuthenticated()) {
      throw redirect({ to: DEFAULT_REDIRECTS.unauthenticated });
    }
  },
});

function AuthenticatedLayout() {
  const navigate = useNavigate();

  const section =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('section') ?? 'overview'
      : 'overview';

  const handleNavigateToSection = useCallback(
    (newSection: string) => {
      navigate({
        to: ROUTES.dashboard,
        search: { section: newSection },
      });
    },
    [navigate]
  );

  return (
    <SidebarProvider>
      <HealthOSSidebar
        activeSection={section}
        onNavigateToSection={handleNavigateToSection}
      />
      <SidebarInset className="overflow-auto bg-zinc-950">
        <div className="flex items-center gap-2 p-2 md:hidden border-b border-zinc-800/50">
          <SidebarTrigger />
        </div>
        <Outlet />
      </SidebarInset>
      <CommandPalette onNavigateToSection={handleNavigateToSection} />
    </SidebarProvider>
  );
}
