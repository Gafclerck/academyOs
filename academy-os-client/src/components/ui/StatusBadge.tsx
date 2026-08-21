import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case 'actif':
    case 'active':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Actif
        </span>
      );

    case 'inactif':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/10 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-slate-400" />
          Inactif
        </span>
      );

    case 'en_cours':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
          En cours
        </span>
      );

    case 'terminee':
    case 'termine':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/10 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-slate-400" />
          Terminé
        </span>
      );

    case 'a_venir':
    case 'en_attente':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          À venir
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 ${className}`}
        >
          {status}
        </span>
      );
  }
};
