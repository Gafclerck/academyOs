import React from 'react'

interface StatusBadgeProps {
  status: string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const normalized = status
    .toLowerCase()
    .trim()

  switch (normalized) {
    // ============================================================
    // ACTIF
    // ============================================================

    case 'actif':
    case 'active':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Actif
        </span>
      )

    // ============================================================
    // INACTIF
    // ============================================================

    case 'inactif':
    case 'inactive':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-slate-400" />
          Inactif
        </span>
      )

    // ============================================================
    // EN COURS
    // ============================================================

    case 'en_cours':
    case 'ongoing':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 ${className}`}
        >
          <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
          En cours
        </span>
      )

    // ============================================================
    // TERMINÉ
    // ============================================================

    case 'terminee':
    case 'termine':
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-slate-400" />
          Terminée
        </span>
      )

    // ============================================================
    // À VENIR
    // ============================================================

    case 'a_venir':
    case 'en_attente':
    case 'upcoming':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          À venir
        </span>
      )

    // ============================================================
    // STATUT INCONNU
    // ============================================================

    default:
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-white/5 dark:text-slate-300 ${className}`}
        >
          {status}
        </span>
      )
  }
}