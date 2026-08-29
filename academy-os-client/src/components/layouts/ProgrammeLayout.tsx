import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

import { ProgrammeSidebar } from './ProgrammeSidebar'
import { ProgrammeBreadcrumbs } from './ProgrammeBreadcrumbs'

import ThemeToggle from '@/components/theme-toggle'

import { Button } from '@/components/ui/button'
import NotificationBell from '@/pages/notifications/NotificationBell'

export const ProgrammeLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-[#151528] dark:text-white">
      
      {/* ── SIDEBAR DESKTOP ─────────────────────────────────────────────── */}

      <div className="hidden shrink-0 lg:flex">
        <ProgrammeSidebar />
      </div>

      {/* ── SIDEBAR MOBILE ──────────────────────────────────────────────── */}

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          <div className="relative z-50 flex w-64 max-w-xs flex-col bg-white shadow-2xl dark:bg-[#151528]">
            <div className="absolute right-3 top-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(false)}
                className="size-8 rounded-lg"
              >
                <X className="size-4" />
              </Button>
            </div>

            <ProgrammeSidebar
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── CONTENEUR PRINCIPAL ─────────────────────────────────────────── */}

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

        {/* ── TOPBAR ───────────────────────────────────────────────────── */}

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

          {/* ACTIONS EN HAUT À DROITE */}

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
          </div>

        </header>

        {/* ── ZONE DE CONTENU ───────────────────────────────────────────── */}

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 dark:bg-[#19192D]/40 sm:p-6 lg:p-8">

          <div className="mx-auto max-w-7xl space-y-6">
            <Outlet />
          </div>

        </main>

      </div>
    </div>
  )
}