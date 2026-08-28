import React, { useEffect, useState } from 'react'
import API from '@/api/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Award,
  AlertCircle,
  RefreshCw,
  FileDown,
  Download,
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export interface MesCertificatsItem {
  id: string
  program_title: string
  cohort_name: string
  status: string
  date_generation: string | null
  date_envoi: string | null
  file_path: string | null
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  GENERATED: {
    label: 'Généré',
    className: 'bg-sky-500/10 text-sky-600',
  },
  SENT: {
    label: 'Envoyé',
    className: 'bg-emerald-500/10 text-emerald-600',
  },
  PENDING: {
    label: 'En attente',
    className: 'bg-amber-500/10 text-amber-600',
  },
  REVOKED: {
    label: 'Révoqué',
    className: 'bg-red-500/10 text-red-600',
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

const MesCertificatsPage: React.FC = () => {
  const [certificates, setCertificates] = useState<
    MesCertificatsItem[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await API.get<MesCertificatsItem[]>(
        '/certificates/me/',
      )
      setCertificates(response.data ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Mes Certificats
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Les certificats obtenus au fil de votre formation.
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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <Card className="flex h-64 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertCircle className="size-6" />
          </div>
          <p className="text-sm text-slate-500">
            Impossible de charger vos certificats.
          </p>
          <Button onClick={load} variant="outline" className="gap-2">
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
        </Card>
      ) : certificates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5">
            <Award className="size-6" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
            Aucun certificat pour le moment
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Votre certificat apparaîtra ici une fois vos projets
            validés à 80% et le document généré.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((cert) => {
            const status =
              STATUS_CONFIG[cert.status] ?? {
                label: cert.status,
                className:
                  'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300',
              }
            const isSent = cert.status === 'SENT'

            return (
              <Card
                key={cert.id}
                className="flex flex-col overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151528]"
              >
                <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
                    <Award className="size-6" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {isSent ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <Clock className="size-3.5" />
                    )}
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {cert.program_title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <GraduationCap className="size-4 text-slate-400" />
                      {cert.cohort_name}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-slate-400" />
                      Généré le {formatDate(cert.date_generation)}
                    </p>
                    {isSent && (
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-slate-400" />
                        Envoyé le {formatDate(cert.date_envoi)}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-2">
                    {isSent && cert.file_path ? (
                      <a
                        href={cert.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <Button
                          className="w-full bg-[#FF6B0B] text-white hover:bg-[#e85f08]"
                          size="sm"
                        >
                          <Download className="mr-2 size-4" />
                          Télécharger le certificat
                        </Button>
                      </a>
                    ) : (
                      <div className="w-full rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500 dark:bg-white/5">
                        <FileDown className="mx-auto mb-1 size-4" />
                        Le document sera disponible une fois envoyé
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MesCertificatsPage
