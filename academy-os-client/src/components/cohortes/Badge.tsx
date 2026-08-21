/**
 * Badge réutilisable pour afficher le statut d'une cohorte ou d'un projet.
 */

import type { CohorteStatut, ProjetStatut } from '@/types/cohorte';

// ─── Badge Statut Cohorte ─────────────────────────────────────────────────────

interface CohorteStatusBadgeProps {
  statut: CohorteStatut;
  className?: string;
}

const COHORT_STATUS_CONFIG: Record<
  CohorteStatut,
  { label: string; className: string; dot: string }
> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  terminee: {
    label: 'Terminée',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
};

export function CohorteStatusBadge({ statut, className = '' }: CohorteStatusBadgeProps) {
  const config = COHORT_STATUS_CONFIG[statut];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ─── Badge Statut Projet ──────────────────────────────────────────────────────

interface ProjetStatusBadgeProps {
  statut: ProjetStatut;
  className?: string;
}

const PROJECT_STATUS_CONFIG: Record<
  ProjetStatut,
  { label: string; className: string }
> = {
  en_cours: {
    label: 'En cours',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  termine: {
    label: 'Terminé',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  en_attente: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  abandonne: {
    label: 'Abandonné',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function ProjetStatusBadge({ statut, className = '' }: ProjetStatusBadgeProps) {
  const config = PROJECT_STATUS_CONFIG[statut];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}

// ─── Badge Rôle Membre ────────────────────────────────────────────────────────

interface RoleBadgeProps {
  role: string;
  className?: string;
}


const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  etudiant: {
    label: 'Étudiant',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  },
  formateur: {
    label: 'Formateur',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  mentor: {
    label: 'Mentor',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  lead: {
    label: 'Team Lead',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  admin: {
    label: 'Admin',
    className: 'bg-primary/10 text-primary',
  },
};

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.etudiant;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}

// ─── Barre de progression ─────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const progressColor = (value: number): string => {
  if (value >= 80) return 'bg-emerald-500';
  if (value >= 50) return 'bg-blue-500';
  if (value >= 25) return 'bg-amber-500';
  return 'bg-red-400';
};

const progressHeight: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({ value, className = '', showLabel = false, size = 'md' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 bg-muted rounded-full overflow-hidden ${progressHeight[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${progressColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-muted-foreground w-9 text-right shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  );
}
