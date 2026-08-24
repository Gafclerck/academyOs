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
     SUPPRIMER
  ======================================================== */



  /* ========================================================
     COLUMNS
  ======================================================== */

  const columns = useMemo<ColumnDef<Rentree>[]>(
    () => [
      /* ======================================================
         NOM
      ====================================================== */

      {
        accessorKey: 'name',

        header: 'Nom de la Rentrée',

        cell: ({ row }) => {
          const rentree = row.original

          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10">
                <Calendar className="size-4 text-[#FF6B0B]" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {rentree.name || 'Sans nom'}
                </p>
              </div>
            </div>
          )
        },
      },

      /* ======================================================
         DATE DEBUT
      ====================================================== */

      {
        accessorKey: 'start_date',

        header: 'Date de début',

        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {rentreeDate(
              row.original.start_date,
            )}
          </span>
        ),
      },

      /* ======================================================
         STATUT
      ====================================================== */

      {
        accessorKey: 'status',

        header: 'Statut',

        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
          />
        ),
      },

      /* ======================================================
         ACTIONS
      ====================================================== */

      {
        id: 'actions',

        header: () => (
          <div className="pr-2 text-right">
            Actions
          </div>
        ),

        cell: ({ row }) => {
          const rentree = row.original

          return (
            <div className="flex items-center justify-end gap-2">

              {/* VOIR DETAILS */}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/rentrees/${rentree.id}`,
                  )
                }
                className="
                  h-8
                  rounded-xl
                  border-[#FF6B0B]/30
                  px-3
                  text-xs
                  font-semibold
                  text-[#FF6B0B]
                  hover:border-[#FF6B0B]
                  hover:bg-[#FF6B0B]
                  hover:text-white
                "
              >
                <Eye className="mr-1.5 size-3.5" />
                Voir détails
              </Button>



            </div>
          )
        },
      },
    ],
    [navigate],
  )

  /* ========================================================
     KPI
  ======================================================== */

  const totalRentrees = rentrees.length

  const rentreesActives = rentrees.filter(
    (rentree) =>
      rentree.status === 'ongoing',
  ).length

  const rentreesAVenir = rentrees.filter(
    (rentree) =>
      rentree.status === 'upcoming',
  ).length

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Toutes les Rentrées
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gérez les rentrées académiques.
          </p>
        </div>

        <Button
          onClick={() =>
            navigate('/rentrees/new')
          }
          className="
            h-11
            shrink-0
            rounded-xl
            bg-[#FF6B0B]
            px-5
            font-semibold
            text-white
            shadow-lg
            shadow-[#FF6B0B]/25
            transition-all
            hover:bg-[#ff7a24]
            hover:shadow-[#FF6B0B]/40
          "
        >
          <Plus className="mr-2 size-4" />
          Nouvelle Rentrée
        </Button>

      </div>

      {/* ERROR */}

      {isError && (
        <div className="
          flex
          items-center
          justify-between
          gap-4
          rounded-2xl
          border
          border-red-200
          bg-red-50
          p-4
          dark:border-red-500/20
          dark:bg-red-500/10
        ">

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
                isFetching
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Réessayer
          </Button>

        </div>
      )}

      {/* KPI */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">

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

const rentreeDate = (
  date: string,
): string => {
  if (!date) {
    return '—'
  }

  const parsedDate = new Date(date)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date
  }

  return parsedDate.toLocaleDateString(
    'fr-FR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  )
}

export default RentreeListPage