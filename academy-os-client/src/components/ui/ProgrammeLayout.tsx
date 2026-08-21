import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ProgrammeSidebar } from './ProgrammeSidebar';
import { ProgrammeBreadcrumbs } from './ProgrammeBreadcrumbs';
import ThemeToggle from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export const ProgrammeLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#151528] text-slate-900 dark:text-white overflow-hidden transition-colors">
      {/* ── SIDEBAR DESKTOP ────────────────────────────────────────────────── */}
      <div className="hidden lg:flex shrink-0">
        <ProgrammeSidebar />
      </div>

      {/* ── SIDEBAR MOBILE (DRAWER) ────────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-50 flex flex-col w-64 max-w-xs bg-white dark:bg-[#151528] shadow-2xl">
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(false)}
                className="size-8 rounded-lg"
              >
                <X className="size-4" />
              </Button>
            </div>
            <ProgrammeSidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── CONTENEUR PRINCIPAL ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between gap-4 px-4 sm:px-8 bg-white/80 dark:bg-[#19192D]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden size-9 rounded-xl border-slate-200 dark:border-white/10"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0">
              <ProgrammeBreadcrumbs />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Zone de contenu scrollable */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-[#19192D]/40">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
