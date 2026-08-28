import React, { useMemo, useState } from 'react'

import {
  Award,
  Send,
  CheckCheck,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  MailCheck,
  FileDown,
  Inbox,
  BriefcaseBusiness,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/context/AuthContext'

import { useProgrammes } from '@/hooks/useProgrammes'
import { useCohortes } from '@/hooks/cohortes/useCohortes'

import {
  Button,
} from '@/components/ui/button'
import {
  DataTable,
  type ColumnDef,
} from '@/components/ui/DataTable'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatCard } from '@/components/ui/StatCard'

import {
  getCertificats,
  sendCertificats,
} from '@/services/certificats/certificatService'

import type {
  CertificateAdminItem,
  StatutCertificat,
} from '@/types/programme'

// ============================================================
// STATUT
// ============================================================

const STATUS_CONFIG: Record<
  StatutCertificat,
  { label: string; className: string }
> = {
  EN_ATTENTE: {
    label: 'En attente',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  ENVOYE: {
    label: 'Envoyé',
    className:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
}

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ============================================================
   CERTIFICATS PAGE
============================================================ */

export const CertificatsPage: React.FC = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const {
    data: programmes = [],
    isLoading: programmesLoading,
  } = useProgrammes()

  const {
    data: cohortes = [],
    isLoading: cohortesLoading,
  } = useCohortes()

  // ==========================================================
  // FILTRES
  // ==========================================================

  const [statusTab, setStatusTab] = useState<
    StatutCertificat
  >('EN_ATTENTE')
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('all')
  const [cohort, setCohort] = useState('all')

  // ==========================================================
  // DONNÉES
  // ==========================================================

  const [certificates, setCertificates] = useState<
    CertificateAdminItem[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // ==========================================================
  // SÉLECTION + ENVOI
  // ==========================================================

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(),
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const params: Record<string, string> = {
        status: statusTab,
        page_size: '100',
      }
      if (program !== 'all') params.program = program
      if (cohort !== 'all') params.cohort = cohort
      if (search.trim()) params.search = search.trim()

      const response = await getCertificats(params)
      setCertificates(response.results)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    setSelectedIds(new Set())
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, program, cohort])

  // Recherche avec délai pour éviter un appel à chaque frappe
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedIds(new Set())
      void load()
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // ==========================================================
  // SÉLECTION
  // ==========================================================

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCertificates = certificates.filter((c) =>
    selectedIds.has(c.id),
  )

  // ==========================================================
  // ENVOI
  // ==========================================================

  const handleSend = async (ids: string[]) => {
    if (ids.length === 0) return
    setSending(true)
    try {
      const results = await sendCertificats({ ids })
      const sentCount = results.filter((r) => r.ok).length
      toast.success(
        `${sentCount} certificat${sentCount > 1 ? 's' : ''} envoyé${sentCount > 1 ? 's' : ''}.`,
      )
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Impossible d'envoyer les certificats.",
      )
    } finally {
      setSending(false)
      setConfirmOpen(false)
      setSelectedIds(new Set())
      void load()
    }
  }

  // ==========================================================
  // KPIs
  // ==========================================================

  const totalCertificats = certificates.length
  const envoyes = certificates.filter(
    (c) => c.status === 'ENVOYE',
  ).length
  const enAttente = certificates.filter(
    (c) => c.status === 'EN_ATTENTE',
  ).length

  // ==========================================================
  // COLONNES
  // ==========================================================

  const columns = useMemo<ColumnDef<CertificateAdminItem>[]>(
    () => [
      {
        id: 'selection',
        header: () => null,
        cell: ({ row }) => {
          const cert = row.original
          return (
            <input
              type="checkbox"
              checked={selectedIds.has(cert.id)}
              onChange={() => toggleSelection(cert.id)}
              className="size-4 accent-[#FF6B0B]"
            />
          )
        },
      },
      {
        accessorKey: 'learner_name',
        header: 'Apprenant',
        cell: ({ row }) => {
          const cert = row.original
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {cert.learner_name || '—'}
              </p>
              <p className="truncate text-xs text-slate-400">
                {cert.learner_email}
              </p>
            </div>
          )
        },
      },
      {
        accessorKey: 'program_title',
        header: 'Programme',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {row.original.program_title || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'cohort_name',
        header: 'Cohorte',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {row.original.cohort_name || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'date_generation',
        header: 'Généré le',
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {formatDate(row.original.date_generation)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const status = row.original.status
          const config =
            STATUS_CONFIG[status] ?? {
              label: status,
              className:
                'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300',
            }
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
            >
              {status === 'ENVOYE' ? (
                <CheckCheck className="size-3.5" />
              ) : (
                <Clock className="size-3.5" />
              )}
              {config.label}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="pr-2 text-right">Actions</div>
        ),
        cell: ({ row }) => {
          const cert = row.original
          const isSent = cert.status === 'ENVOYE'
          return (
            <div className="flex justify-end gap-2">
              {isSent ? (
                cert.url ? (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl border-slate-200 px-3 text-xs font-semibold dark:border-white/10"
                    >
                      <FileDown className="mr-1.5 size-3.5" />
                      Télécharger
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">
                    PDF indisponible
                  </span>
                )
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend([cert.id])}
                  disabled={sending}
                  className="h-8 rounded-xl border-[#FF6B0B]/30 px-3 text-xs font-semibold text-[#FF6B0B] hover:border-[#FF6B0B] hover:bg-[#FF6B0B] hover:text-white"
                >
                  <Send className="mr-1.5 size-3.5" />
                  Envoyer
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, sending],
  )

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {isAdmin ? (
              <ShieldCheck className="size-4 text-[#FF6B0B]" />
            ) : (
              <BriefcaseBusiness className="size-4 text-[#FF6B0B]" />
            )}
            <span className="text-sm font-semibold text-[#FF6B0B]">
              {isAdmin ? 'Administrateur' : 'Organisateur'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Certificats
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Consultez et envoyez les certificats aux
            apprenants.
          </p>
        </div>

        <Button
          onClick={load}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2 self-start rounded-xl border-slate-200 dark:border-white/10"
        >
          <RefreshCw className="size-3.5" />
          Actualiser
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total"
          value={totalCertificats}
          subtitle="Certificats affichés"
          icon={Award}
        />
        <StatCard
          title="En attente"
          value={enAttente}
          subtitle="À envoyer"
          icon={Inbox}
        />
        <StatCard
          title="Envoyés"
          value={envoyes}
          subtitle="Certificats transmis"
          icon={MailCheck}
        />
      </div>

      {/* TABS */}
      <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]">
        {(
          [
            { value: 'EN_ATTENTE' as const, label: 'En attente', icon: Inbox },
            { value: 'ENVOYE' as const, label: 'Envoyés', icon: CheckCheck },
          ]
        ).map((tab) => {
          const Icon = tab.icon
          const active = statusTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={`
                flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all
                ${
                  active
                    ? 'bg-[#FF6B0B] text-white shadow-md shadow-[#FF6B0B]/25'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                }
              `}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* FILTRES */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:min-w-[240px] sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un apprenant"
              className="h-10 pl-9 rounded-xl border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-white/[0.04]"
            />
          </div>

          <Select
            value={program}
            onValueChange={(v) => setProgram(v)}
          >
            <SelectTrigger className="h-10 w-full sm:w-48 rounded-xl border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-white/[0.04]">
              <SelectValue placeholder="Programme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Tous les programmes
              </SelectItem>
              {programmes.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={cohort}
            onValueChange={(v) => setCohort(v)}
          >
            <SelectTrigger className="h-10 w-full sm:w-48 rounded-xl border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-white/[0.04]">
              <SelectValue placeholder="Cohorte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les cohortes</SelectItem>
              {cohortes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedIds.size > 0 && statusTab === 'EN_ATTENTE' && (
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={sending}
            className="h-10 rounded-xl bg-[#FF6B0B] px-4 font-semibold text-white shadow-lg shadow-[#FF6B0B]/25 hover:bg-[#ff7a24]"
          >
            <Send className="mr-2 size-4" />
            Envoyer la sélection ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#1f1f38]">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertCircle className="size-6" />
          </div>
          <p className="text-sm text-slate-500">
            Impossible de charger les certificats.
          </p>
          <Button onClick={load} variant="outline" className="gap-2">
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={certificates}
          isLoading={programmesLoading || cohortesLoading}
          hideSearch
          emptyMessage={
            statusTab === 'EN_ATTENTE'
              ? 'Aucun certificat en attente.'
              : 'Aucun certificat envoyé.'
          }
        />
      )}

      {/* DIALOG CONFIRMATION */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-900 dark:text-white">
              Envoyer les certificats
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-500">
              Vous êtes sur le point d'envoyer l'email
              de certificat à{' '}
              <span className="font-semibold text-slate-800 dark:text-white">
                {selectedIds.size} apprenant
                {selectedIds.size > 1 ? 's' : ''}
              </span>
              . Cette action est définitive.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/[0.02]">
            {selectedCertificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0 dark:border-white/5"
              >
                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                  {cert.learner_name || cert.learner_email}
                </span>
                <span className="ml-3 shrink-0 text-xs text-slate-400">
                  {cert.program_title}
                </span>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
            >
              Annuler
            </Button>
            <Button
              onClick={() =>
                handleSend(Array.from(selectedIds))
              }
              disabled={sending}
              className="bg-[#FF6B0B] text-white hover:bg-[#ff7a24]"
            >
              {sending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Confirmer l'envoi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CertificatsPage
