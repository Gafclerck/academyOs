import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  GraduationCap,
  FolderGit2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    name: 'Programmes',
    href: '/programmes',
    icon: BookOpen,
    description: 'Offres de formation & cursus',
  },
  {
    name: 'Sessions',
    href: '/sessions',
    icon: Calendar,
    description: 'Promotions semestrielles',
  },
  {
    name: 'Cohortes',
    href: '/cohortes',
    icon: GraduationCap,
    description: 'Groupes d’apprenants actifs',
  },
  {
    name: 'Projets',
    href: '/projets',
    icon: FolderGit2,
    description: 'Suivi des livrables & jalons',
  },
];

interface ProgrammeSidebarProps {
  onCloseMobile?: () => void;
}

export const ProgrammeSidebar: React.FC<ProgrammeSidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();

  return (
    <aside className="w-64 flex flex-col h-full bg-white dark:bg-[#151528] border-r border-slate-200 dark:border-white/10 select-none">
      {/* ── LOGO & BRAND HEADER ────────────────────────────────────────────── */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-white/10">
        <div className="size-9 rounded-xl bg-gradient-to-br from-[#FF6B0B] to-[#FF8C38] flex items-center justify-center text-white shadow-md shadow-[#FF6B0B]/20">
          <Sparkles className="size-5" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            Xarala <span className="text-[#FF6B0B] font-black">OS</span>
          </span>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Academy Management
          </p>
        </div>
      </div>

      {/* ── NAVIGATION HIÉRARCHIQUE ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Hiérarchie Métier
          </p>
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/programmes'
                  ? location.pathname.startsWith('/programmes')
                  : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#FF6B0B] text-white shadow-md shadow-[#FF6B0B]/25 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:text-[#FF6B0B] group-hover:bg-[#FF6B0B]/10'
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="truncate">
                      <p className="truncate text-sm leading-tight">{item.name}</p>
                      <p
                        className={`text-[10px] truncate ${
                          isActive
                            ? 'text-white/80'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        Niveau {index + 1}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={`size-4 transition-transform ${
                      isActive
                        ? 'text-white opacity-80'
                        : 'text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                    }`}
                  />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* ── WORKFLOW BANNER ──────────────────────────────────────────────── */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-2">
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            Architecture P-S-C-P
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-[#FF6B0B]">Prog</span>
            <span>→</span>
            <span>Sess</span>
            <span>→</span>
            <span>Coh</span>
            <span>→</span>
            <span>Proj</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Créez une session depuis un programme, puis rattachez-y vos cohortes.
          </p>
        </div>
      </div>

      {/* ── FOOTER DE LA SIDEBAR ───────────────────────────────────────────── */}
      <div className="p-3 border-t border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
          <div className="size-8 rounded-full bg-[#FF6B0B]/15 text-[#FF6B0B] font-bold text-xs flex items-center justify-center">
            XP
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              Admin Academy
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              admin@xarala.co
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
