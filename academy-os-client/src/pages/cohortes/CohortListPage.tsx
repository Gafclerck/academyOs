import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Plus,
  Users,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react'

import { useCohortes } from '@/hooks/cohortes/useCohortes'
import { useProgrammes } from '@/hooks/useProgrammes'
import { useRentrees } from '@/hooks/rentrees/useRentrees'

import type { Cohorte } from '@/types/cohorte'

import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'

import {
  DataTable,
  type ColumnDef,
} from '@/components/ui/DataTable'

import { Button } from '@/components/ui/button'

export const CohorteListPage: React.FC = () => {
  const navigate = useNavigate()

  /* ============================================================
     COHORTES
  ============================================================ */

  const {
    data: cohortes = [],
    isLoading: cohortesLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCohortes()

  /* ============================================================
     PROGRAMMES
  ============================================================ */

  const {
    data: programmes = [],
    isLoading: programmesLoading,
  } = useProgrammes()

  /* ============================================================
     RENTRÉES
  ============================================================ */

  const {
    data: rentrees = [],
    isLoading: rentreesLoading,
  } = useRentrees()

  /* ============================================================
     LOADING GLOBAL
  ============================================================ */

  const isLoading =
    cohortesLoading ||
    programmesLoading ||
    rentreesLoading

  /* ============================================================
     MAP PROGRAMMES
     
     Permet de retrouver rapidement le nom du programme
     à partir de son ID.
  ============================================================ */

  const programmeMap = useMemo(() => {
    const map = new Map<string, string>()

    programmes.forEach((programme) => {
      map.set(
        String(programme.id),
        programme.nom,
      )
    })

    return map
  }, [programmes])

  /* ============================================================
     MAP RENTRÉES
  ============================================================ */

  const rentreeMap = useMemo(() => {
    const map = new Map<string, string>()

    rentrees.forEach((rentree) => {
      map.set(
        String(rentree.id),
        rentree.name,
      )
    })

    return map
  }, [rentrees])

  /* ============================================================
     COLONNES
  ============================================================ */

  const columns = useMemo<
    ColumnDef<Cohorte>[]
  >(
    () => [
      /* ========================================================
         NOM
      ======================================================== */

      {
        accessorKey: 'name',

        header: 'Nom de la cohorte',

        cell: ({ row }) => {
          const cohorte = row.original

          return (
            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  size-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#FF6B0B]/10
                "
              >
                <Users
                  className="
                    size-5
                    text-[#FF6B0B]
                  "
                />
              </div>

              <div className="min-w-0">

                <p
                  className="
                    truncate
                    text-sm
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {cohorte.name || 'Sans nom'}
                </p>



              </div>

            </div>
          )
        },
      },

      /* ========================================================
         PROGRAMME
      ======================================================== */

      {
        accessorKey: 'program',

        header: 'Programme',

        cell: ({ row }) => {
          const cohorte = row.original

          const programmeName =
            cohorte.program_name ||
            programmeMap.get(
              String(cohorte.program),
            )

          return (
            <span
              className="
                text-sm
                font-medium
                text-slate-700
                dark:text-slate-300
              "
            >
              {programmeName || '—'}
            </span>
          )
        },
      },

      /* ========================================================
         RENTRÉE
      ======================================================== */

      {
        accessorKey: 'intake',

        header: 'Rentrée',

        cell: ({ row }) => {
          const cohorte = row.original

          const rentreeName =
            cohorte.intake_name ||
            rentreeMap.get(
              String(cohorte.intake),
            )

          return (
            <span
              className="
                text-sm
                font-medium
                text-slate-700
                dark:text-slate-300
              "
            >
              {rentreeName || '—'}
            </span>
          )
        },
      },

      /* ========================================================
         DATE DE DÉBUT
      ======================================================== */

      {
        accessorKey: 'start_date',

        header: 'Début',

        cell: ({ row }) => (
          <span
            className="
              text-xs
              font-medium
              text-slate-600
              dark:text-slate-300
            "
          >
            {formatDate(
              row.original.start_date,
            )}
          </span>
        ),
      },

      /* ========================================================
         DATE DE FIN
      ======================================================== */

      {
        accessorKey: 'end_date',

        header: 'Fin',

        cell: ({ row }) => (
          <span
            className="
              text-xs
              font-medium
              text-slate-600
              dark:text-slate-300
            "
          >
            {formatDate(
              row.original.end_date,
            )}
          </span>
        ),
      },

      /* ========================================================
         STATUT
      ======================================================== */

      {
        accessorKey: 'status',

        header: 'Statut',

        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
          />
        ),
      },

      /* ========================================================
         ACTIONS
      ======================================================== */

      {
        id: 'actions',

        header: () => (
          <div className="pr-2 text-right">
            Actions
          </div>
        ),

        cell: ({ row }) => {
          const cohorte = row.original

          return (
            <div className="flex items-center justify-end gap-2">

              {/* ==================================================
                  VOIR DÉTAILS
              ================================================== */}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/cohortes/${cohorte.id}`,
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
    [
      navigate,
      programmeMap,
      rentreeMap,
    ],
  )

  /* ============================================================
     KPI
  ============================================================ */

  const totalCohortes =
    cohortes.length

  const cohortesEnCours =
    cohortes.filter(
      (cohorte) =>
        cohorte.status === 'ongoing' ||
        cohorte.status === 'active',
    ).length

  const cohortesAVenir =
    cohortes.filter(
      (cohorte) =>
        cohorte.status === 'upcoming',
    ).length

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          flex-col
          items-start
          justify-between
          gap-4
          sm:flex-row
          sm:items-center
        "
      >

        <div>

          <h1
            className="
              text-2xl
              font-extrabold
              tracking-tight
              text-slate-900
              dark:text-white
              sm:text-3xl
            "
          >
            Cohortes
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Gérez les cohortes de vos programmes.
          </p>

        </div>

        <Button
          onClick={() =>
            navigate('/cohortes/new')
          }
          className="
            h-11
            rounded-xl
            bg-[#FF6B0B]
            px-5
            font-semibold
            text-white
            shadow-lg
            shadow-[#FF6B0B]/25
            hover:bg-[#ff7a24]
          "
        >
          <Plus className="mr-2 size-4" />
          Nouvelle cohorte
        </Button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {isError && (
        <div
          className="
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
          "
        >

          <div>

            <p
              className="
                font-semibold
                text-red-700
                dark:text-red-400
              "
            >
              Impossible de récupérer les cohortes.
            </p>

            <p
              className="
                mt-1
                text-xs
                text-red-600
                dark:text-red-300
              "
            >
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
              className={`
                mr-2
                size-4
                ${
                  isFetching
                    ? 'animate-spin'
                    : ''
                }
              `}
            />

            Réessayer
          </Button>

        </div>
      )}

      {/* ======================================================
          KPI
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-2
          gap-4
          lg:grid-cols-3
        "
      >

        <StatCard
          title="Total Cohortes"
          value={totalCohortes}
          subtitle="Cohortes enregistrées"
          icon={Users}
        />

        <StatCard
          title="En cours"
          value={cohortesEnCours}
          subtitle="Cohortes actives"
          icon={Calendar}
        />

        <StatCard
          title="À venir"
          value={cohortesAVenir}
          subtitle="Cohortes planifiées"
          icon={Calendar}
        />

      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <DataTable
        columns={columns}
        data={cohortes}
        isLoading={isLoading}
        searchPlaceholder="Rechercher une cohorte..."
        emptyMessage={
          isError
            ? 'Impossible de charger les cohortes.'
            : 'Aucune cohorte enregistrée.'
        }
      />

    </div>
  )
}

/* ============================================================
   FORMAT DATE
============================================================ */

const formatDate = (
  date?: string | null,
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

export default CohorteListPage