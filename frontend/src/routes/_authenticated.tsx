import { createFileRoute, Outlet, redirect, useNavigate, useSearch } from '@tanstack/react-router';
import { isAuthenticated } from '@/lib/auth/session';
import { DEFAULT_REDIRECTS, ROUTES } from '@/lib/constants/routes';
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
  validateSearch: (search: Record<string, unknown>) => ({
    section: (search.section as string) ?? 'overview',
  }),
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { section } = Route.useSearch();
  const activeSection = section ?? 'overview';

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
    <div className="min-h-screen bg-zinc-950">
      <HealthOSSidebar
        activeSection={activeSection}
        onNavigateToSection={handleNavigateToSection}
      />
      <main className="ml-60 min-h-screen overflow-auto">
        <Outlet />
      </main>
      <CommandPalette onNavigateToSection={handleNavigateToSection} />
    </div>
  );
}
