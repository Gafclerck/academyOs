import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Calendar,
  Eye,
  Plus,
  RefreshCw,
} from 'lucide-react'

import { useRentrees } from '@/hooks/rentrees/useRentrees'

import type { Rentree } from '@/types/rentree'

import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'

import {
  DataTable,
  type ColumnDef,
} from '@/components/ui/DataTable'

import { Button } from '@/components/ui/button'

export const RentreeListPage: React.FC = () => {
  const navigate = useNavigate()

  const {
    data: rentrees = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useRentrees()

  
  /* ========================================================
     COLUMNS
  ======================================================== */

  const columns = useMemo<ColumnDef<Rentree>[]>(
    () => [
      {
        accessorKey: 'name',

        header: 'Nom de la Rentrée',

        cell: ({ row }) => {
          const rentree = row.original

          return (
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
                <Calendar className="size-4 text-[#FF6B0B]" />
              </div>

              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {rentree.name || 'Sans nom'}
                </p>
              </div>
            </div>
          )
        },
      },

      {
        accessorKey: 'start_date',

        header: 'Date de début',

        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {rentreeDate(row.original.start_date)}
          </span>
        ),
      },

      {
        accessorKey: 'status',

        header: 'Statut',

        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
          />
        ),
      },

      {
        header: () => (
          <div className="text-right pr-2">
            Actions
          </div>
        ),

        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/rentrees/${row.original.id}`)
              }
              className="h-8 px-3 rounded-xl border-[#FF6B0B]/30 hover:border-[#FF6B0B] hover:bg-[#FF6B0B] hover:text-white text-[#FF6B0B] font-semibold text-xs transition-colors"
            >
              <Eye className="size-3.5 mr-1.5" />
              Voir Détails
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  )

  /* ========================================================
     KPI
  ======================================================== */

  const totalRentrees = rentrees.length

  const rentreesActives = rentrees.filter(
    (rentree) => rentree.status === 'ongoing',
  ).length

  const rentreesAVenir = rentrees.filter(
    (rentree) => rentree.status === 'upcoming',
  ).length

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Toutes les Rentrées
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gérez les rentrées académiques.
          </p>
        </div>

        <Button
          onClick={() => navigate('/rentrees/new')}
          className="h-11 px-5 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 hover:shadow-[#FF6B0B]/40 transition-all shrink-0"
        >
          <Plus className="size-4 mr-2" />
          Nouvelle Rentrée
        </Button>
      </div>

      {/* ERROR */}

      {isError && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">

          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              Impossible de récupérer les rentrées.
            </p>

            <p className="mt-1 text-xs text-red-600 dark:text-red-300">
              {error instanceof Error
                ? error.message
                : 'Une erreur est survenue lors de la requête API.'}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 size-4 ${
                isFetching ? 'animate-spin' : ''
              }`}
            />

            Réessayer
          </Button>

        </div>
      )}

      {/* KPI */}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

        <StatCard
          title="Total Rentrées"
          value={totalRentrees}
          subtitle="Rentrées enregistrées"
          icon={Calendar}
        />

        <StatCard
          title="Rentrées Actives"
          value={rentreesActives}
          subtitle="En cours"
          icon={Calendar}
        />

        <StatCard
          title="À venir"
          value={rentreesAVenir}
          subtitle="Planifiées"
          icon={Calendar}
        />

      </div>

      {/* TABLE */}

      <DataTable
        columns={columns}
        data={rentrees}
        isLoading={isLoading}
        searchPlaceholder="Rechercher une rentrée..."
        emptyMessage={
          isError
            ? 'Impossible de charger les rentrées.'
            : 'Aucune rentrée enregistrée.'
        }
      />

    </div>
  )
}

/* ============================================================
   DATE
============================================================ */

const rentreeDate = (date: string): string => {
  if (!date) {
    return '—'
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default RentreeListPage

