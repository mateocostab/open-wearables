import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  HeartPulse,
  Activity,
  Moon,
  Dumbbell,
  Scale,
  Settings,
  Search,
} from 'lucide-react';

interface CommandPaletteProps {
  onNavigateToSection: (section: string) => void;
}

export function CommandPalette({ onNavigateToSection }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (section: string) => {
    onNavigateToSection(section);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command dialog */}
      <div className="relative flex items-start justify-center pt-[20vh]">
        <Command
          className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
          label="Command Palette"
        >
          <div className="flex items-center gap-2 px-4 border-b border-zinc-800">
            <Search className="h-4 w-4 text-zinc-500" />
            <Command.Input
              placeholder="Type a command or search..."
              className="w-full py-3 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>

          <Command.List className="max-h-[300px] overflow-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-zinc-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'recovery', label: 'Recovery & HRV', icon: HeartPulse },
                { id: 'activity', label: 'Activity', icon: Activity },
                { id: 'sleep', label: 'Sleep', icon: Moon },
                { id: 'workouts', label: 'Workouts', icon: Dumbbell },
                { id: 'body', label: 'Body', icon: Scale },
              ].map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.label}
                  onSelect={() => handleSelect(item.id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white"
                >
                  <item.icon className="h-4 w-4 text-zinc-500" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="System" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500">
              <Command.Item
                value="Settings"
                onSelect={() => {
                  setOpen(false);
                  window.location.href = '/settings';
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white"
              >
                <Settings className="h-4 w-4 text-zinc-500" />
                Settings
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
