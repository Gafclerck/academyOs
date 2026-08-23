import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Plus,
  BookOpen,
  CheckCircle2,
  Calendar,
  Users,
  ChevronDown,
  RefreshCw,
  Pencil,
  Trash2,
} from 'lucide-react'

import {
  useProgrammes,
  useProgrammeKPIs,
} from '../../hooks/useProgrammes'

import type { Programme } from '../../types/programme'

import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/StatusBadge'

import {
  DataTable,
  type ColumnDef,
} from '../../components/ui/DataTable'

import { Button } from '@/components/ui/button'

export const ProgrammeListPage: React.FC = () => {
  const navigate = useNavigate()

  const [statutFilter, setStatutFilter] = useState<
    'all' | 'actif' | 'inactif'
  >('all')

  const {
    data: programmes = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProgrammes()

  const {
    data: kpis,
    isLoading: kpisLoading,
  } = useProgrammeKPIs()

  const filteredData = useMemo(() => {
    if (statutFilter === 'all') {
      return programmes
    }

    return programmes.filter(
      (programme) =>
        programme.statut === statutFilter,
    )
  }, [programmes, statutFilter])

  const columns = useMemo<
    ColumnDef<Programme>[]
  >(
    () => [
      /* ======================================================
         NOM DU PROGRAMME
      ====================================================== */
      {
        accessorKey: 'nom',

        header: 'Nom du Programme',

        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className="
                flex size-10 shrink-0
                items-center justify-center
                rounded-xl
                bg-[#FF6B0B]/10
              "
            >
              <BookOpen
                className="size-5 text-[#FF6B0B]"
              />
            </div>

            <div className="min-w-0">
              <p
                className="
                  truncate text-sm
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {row.original.nom}
              </p>
            </div>
          </div>
        ),
      },

      /* ======================================================
         DESCRIPTION
      ====================================================== */
      {
        accessorKey: 'description',

        header: 'Description',

        cell: ({ row }) => (
          <p
            className="
              line-clamp-2
              max-w-md
              text-xs
              text-slate-600
              dark:text-slate-300
            "
          >
            {row.original.description || '—'}
          </p>
        ),
      },

      /* ======================================================
         STATUT
      ====================================================== */
      {
        accessorKey: 'statut',

        header: 'Statut',

        cell: ({ row }) => (
          <StatusBadge
            status={row.original.statut}
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

        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">

            {/* MODIFIER */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/programmes/${row.original.id}/edit`,
                )
              }
              className="
                h-8
                rounded-xl
                border-blue-200
                px-3
                text-xs
                font-semibold
                text-blue-600
                hover:border-blue-500
                hover:bg-blue-500
                hover:text-white
                dark:border-blue-500/30
                dark:text-blue-400
              "
            >
              <Pencil className="mr-1.5 size-3.5" />
              Modifier
            </Button>

            {/* SUPPRIMER */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log(
                  'Supprimer programme:',
                  row.original.id,
                )
              }}
              className="
                h-8
                rounded-xl
                border-red-200
                px-3
                text-xs
                font-semibold
                text-red-600
                hover:border-red-500
                hover:bg-red-500
                hover:text-white
                dark:border-red-500/30
                dark:text-red-400
              "
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Supprimer
            </Button>

          </div>
        ),
      },
    ],
    [navigate],
  )

  return (
    <div className="space-y-6">

      {/* HEADER */}

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
            Programmes Académiques
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Gérez et supervisez l'ensemble
            des parcours et formations.
          </p>
        </div>

        <Button
          onClick={() =>
            navigate('/programmes/new')
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
            transition-all
            hover:bg-[#ff7a24]
          "
        >
          <Plus className="mr-2 size-4" />
          Nouveau Programme
        </Button>
      </div>

      {/* ERROR */}

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
              Impossible de récupérer les
              programmes.
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
                : 'Une erreur est survenue lors de la requête API. Vérifiez que le backend tourne sur http://localhost:8000.'}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`
                mr-2 size-4
                ${isFetching ? 'animate-spin' : ''}
              `}
            />

            Réessayer
          </Button>
        </div>
      )}

      {/* KPIs */}

      <div
        className="
          grid
          grid-cols-2
          gap-4
          lg:grid-cols-4
        "
      >
        <StatCard
          title="Total Programmes"
          value={
            kpisLoading
              ? '...'
              : kpis?.total_programmes ??
                programmes.length
          }
          subtitle="Formations enregistrées"
          icon={BookOpen}
        />

        <StatCard
          title="Programmes Actifs"
          value={
            kpisLoading
              ? '...'
              : kpis?.programmes_actifs ??
                programmes.filter(
                  (p) => p.statut === 'actif',
                ).length
          }
          subtitle="Actuellement ouverts"
          icon={CheckCircle2}
          trend="Actifs"
        />

        <StatCard
          title="Total Rentrées"
          value={
            kpisLoading
              ? '...'
              : kpis?.total_rentrees ?? 0
          }
          subtitle="Promotions organisées"
          icon={Calendar}
        />

        <StatCard
          title="Total Étudiants"
          value={
            kpisLoading
              ? '...'
              : kpis?.total_etudiants ?? 0
          }
          subtitle="Apprenants inscrits"
          icon={Users}
        />
      </div>

      {/* TABLE */}

      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        searchPlaceholder="Rechercher un programme..."
        emptyMessage={
          isError
            ? 'Impossible de charger les programmes.'
            : 'Aucun programme trouvé.'
        }
        filtersSlot={
          <div className="relative min-w-[170px]">
            <select
              value={statutFilter}
              onChange={(event) =>
                setStatutFilter(
                  event.target.value as
                    | 'all'
                    | 'actif'
                    | 'inactif',
                )
              }
              className="
                h-10
                w-full
                cursor-pointer
                appearance-none
                rounded-xl
                border
                border-slate-200
                bg-white
                pl-3.5
                pr-9
                text-xs
                font-semibold
                text-slate-800
                outline-none
                focus:ring-1
                focus:ring-[#FF6B0B]
                dark:border-white/10
                dark:bg-[#1f1f38]
                dark:text-slate-200
              "
            >
              <option value="all">
                Tous les statuts
              </option>

              <option value="actif">
                Actifs uniquement
              </option>

              <option value="inactif">
                Inactifs uniquement
              </option>
            </select>

            <ChevronDown
              className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                size-4
                -translate-y-1/2
                text-slate-400
              "
            />
          </div>
        }
      />
    </div>
  )
}

export default ProgrammeListPage