import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTrainerDashboard } from '@/hooks/useTrainerDashboard'
import { TrainerStatsCards } from '@/components/dashboard/TrainerStatsCards'
import { TrainerPendingQueue } from '@/components/dashboard/TrainerPendingQueue'
import { TrainerCohortCards } from '@/components/dashboard/TrainerCohortCards'
import { TrainerRecentReviews } from '@/components/dashboard/TrainerRecentReviews'
import { Spinner } from '@/components/ui/spinner'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const TrainerDashboard: React.FC = () => {
  const { user } = useAuth()
  const { data: stats, isLoading, error, refetch } = useTrainerDashboard()

  const firstName = user?.first_name || 'Formateur'

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-xs text-slate-400">Chargement de votre espace formateur...</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Erreur de synchronisation
          </h3>
          <p className="text-sm text-slate-500">
            Impossible de récupérer vos indicateurs formateur.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="size-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* HEADER DE BIENVENUE */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Voici la synthèse de vos promotions et des corrections en attente aujourd'hui.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="gap-2 self-start rounded-xl border-slate-200 dark:border-white/10"
        >
          <RefreshCw className="size-3.5" />
          Actualiser
        </Button>
      </div>

      {/* 1. CARTES KPIS */}
      <TrainerStatsCards stats={stats} />

      {/* 2. FILE DE CORRECTION PRIORITAIRE */}
      <TrainerPendingQueue pendingReviews={stats.pending_reviews || []} />

      {/* 3. COHORTES ACTIVES */}
      {stats.cohorts_summary && stats.cohorts_summary.length > 0 && (
        <TrainerCohortCards cohorts={stats.cohorts_summary} />
      )}

      {/* 4. HISTORIQUE RÉCENT */}
      <TrainerRecentReviews recentReviews={stats.recent_reviews || []} />
    </div>
  )
}

export default TrainerDashboard
