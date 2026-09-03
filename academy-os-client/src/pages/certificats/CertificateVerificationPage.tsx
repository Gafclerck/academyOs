import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Loader2,
  ShieldCheck,
  ShieldX,
  WifiOff,
  Award,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import ThemeToggle from '@/components/theme-toggle'
import logoXarala from '@/assets/logo-xarala.png'
import { Badge } from '@/components/ui/badge'
import { getCertificatPublic } from '@/services/certificats/certificatService'
import type { CertificatePublic } from '@/types/programme'

type VerifyStatus = 'loading' | 'valid' | 'not_found' | 'error'

const CertificateVerificationPage = () => {
  const { id } = useParams<{ id: string }>()

  const [status, setStatus] = useState<VerifyStatus>('loading')
  const [certificate, setCertificate] = useState<CertificatePublic | null>(null)
  const [message, setMessage] = useState('')

  const hasLaunched = useRef(false)

  useEffect(() => {
    if (!id || hasLaunched.current) return
    hasLaunched.current = true

    ;(async () => {
      try {
        const data = await getCertificatPublic(id)
        setCertificate(data)
        setStatus('valid')
      } catch (err) {
        const statusCode = (err as Error & { status?: number | null }).status
        if (statusCode === 404) {
          setStatus('not_found')
          setMessage(
            "Ce certificat est introuvable ou n'a pas encore été officiellement émis.",
          )
        } else {
          setStatus('error')
          setMessage(
            err instanceof Error
              ? err.message
              : 'Impossible de vérifier ce certificat pour le moment.',
          )
        }
      }
    })()
  }, [id])

  const formattedDate = useMemo(() => {
    if (!certificate?.date_envoi) return null
    const date = new Date(certificate.date_envoi)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }, [certificate])

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-slate-50 p-4 transition-colors duration-500 dark:bg-[#19192D]">

      <div className="fixed right-5 top-5 z-50">
        <ThemeToggle />
      </div>

      {/* Glow décoratif */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#FF6B0B]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#FF6B0B]/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img
            src={logoXarala}
            alt="Logo Xarala"
            className="mx-auto h-auto w-[200px] object-contain"
          />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Vérification de certificat
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-300/30 transition-colors duration-500 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/30 dark:backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#FF6B0B]/10 blur-3xl" />

          {/* ═════════ LOADING ═════════ */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="size-10 animate-spin text-[#FF6B0B]" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Vérification du certificat en cours...
              </p>
            </div>
          )}

          {/* ═════════ VALID ═════════ */}
          {status === 'valid' && certificate && (
            <div className="relative flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                <ShieldCheck className="size-9 text-green-600 dark:text-green-400" />
              </div>

              <Badge className="mb-4 border-green-200 bg-green-50 px-3 py-1 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
                <CheckCircle2 className="mr-1 size-3.5" />
                Certificat authentique
              </Badge>

              <Award className="mb-2 size-8 text-[#FF6B0B]" />

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {certificate.learner_name}
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                a validé avec succès la formation :
              </p>

              <p className="mt-3 text-lg font-semibold text-[#FF6B0B]">
                {certificate.program_title}
              </p>

              <div className="mt-6 w-full space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left text-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">ID</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                    {certificate.id}
                  </span>
                </div>
                {formattedDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Émis le
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formattedDate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════ NOT FOUND ═════════ */}
          {status === 'not_found' && (
            <div className="relative flex flex-col items-center py-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                <ShieldX className="size-9 text-red-600 dark:text-red-400" />
              </div>

              <Badge className="mb-4 border-red-200 bg-red-50 px-3 py-1 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                <XCircle className="mr-1 size-3.5" />
                Certificat introuvable
              </Badge>

              <p className="max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
                {message}
              </p>
            </div>
          )}

          {/* ═════════ ERROR ═════════ */}
          {status === 'error' && (
            <div className="relative flex flex-col items-center py-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/15">
                <WifiOff className="size-9 text-amber-600 dark:text-amber-400" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Service temporairement indisponible
              </h2>

              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
                {message}
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} Xarala — La technologie dans votre langue.
        </p>
      </div>
    </main>
  )
}

export default CertificateVerificationPage
