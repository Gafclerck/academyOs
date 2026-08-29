
import React, { useEffect, useMemo, useState } from 'react'
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
  Loader2,
  MessageSquare,
  X,
  Send,
  CircleDot,
} from 'lucide-react'

import {
  getClaims,
  createClaim,
  type Claim,
  type ClaimStatus,
} from '@/services/reclamations/ClaimService'

/* ============================================================
   TYPES
============================================================ */

export interface MesCertificatsItem {
  id: string
  program_title: string
  cohort_name: string
  status: string
  date_generation: string | null
  date_envoi: string | null
  file_path: string | null
  url: string | null
}

/* ============================================================
   STATUTS CERTIFICATS
============================================================ */

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  ENVOYE: {
    label: 'Envoyé',
    className:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },

  EN_ATTENTE: {
    label: 'En attente',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },

  GENERATED: {
    label: 'Généré',
    className:
      'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },

  SENT: {
    label: 'Envoyé',
    className:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },

  PENDING: {
    label: 'En attente',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },

  REVOKED: {
    label: 'Révoqué',
    className:
      'bg-red-500/10 text-red-600 dark:text-red-400',
  },
}

/* ============================================================
   STATUTS RÉCLAMATIONS
============================================================ */

const CLAIM_STATUS_CONFIG: Record<
  ClaimStatus,
  {
    label: string
    className: string
  }
> = {
  pending: {
    label: 'En attente',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },

  in_progress: {
    label: 'En cours',
    className:
      'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },

  resolved: {
    label: 'Résolue',
    className:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },

  rejected: {
    label: 'Rejetée',
    className:
      'bg-red-500/10 text-red-600 dark:text-red-400',
  },
}

/* ============================================================
   HELPERS
============================================================ */

const normalizeStatus = (status: string) =>
  status?.toUpperCase?.() ?? ''

const formatDate = (value: string | null) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ============================================================
   COMPONENT
============================================================ */

const MesCertificatsPage: React.FC = () => {
  /* ============================================================
     CERTIFICATS
  ============================================================ */

  const [certificates, setCertificates] = useState<
    MesCertificatsItem[]
  >([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  /* ============================================================
     RÉCLAMATIONS
  ============================================================ */

  const [claims, setClaims] = useState<Claim[]>([])

  const [claimsLoading, setClaimsLoading] = useState(true)

  const [claimsError, setClaimsError] = useState<string | null>(
    null,
  )

  /* ============================================================
     MODAL RÉCLAMATION
  ============================================================ */

  const [selectedCertificate, setSelectedCertificate] =
    useState<MesCertificatsItem | null>(null)

  const [claimMessage, setClaimMessage] = useState('')

  const [submittingClaim, setSubmittingClaim] =
    useState(false)

  const [claimSubmitError, setClaimSubmitError] =
    useState<string | null>(null)

  /* ============================================================
     SUCCESS
  ============================================================ */

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null)

  /* ============================================================
     CHARGER LES CERTIFICATS
  ============================================================ */

  const loadCertificates = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await API.get<MesCertificatsItem[]>(
        '/certificates/me/',
      )

      setCertificates(
        Array.isArray(response.data)
          ? response.data
          : [],
      )
    } catch (err) {
      console.error(
        'Erreur lors du chargement des certificats :',
        err,
      )

      setError(
        'Impossible de charger vos certificats pour le moment.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* ============================================================
     CHARGER LES RÉCLAMATIONS
  ============================================================ */

  const loadClaims = async () => {
    setClaimsLoading(true)
    setClaimsError(null)

    try {
      const response = await getClaims({
        page: 1,
        page_size: 100,
      })

      setClaims(
        Array.isArray(response.results)
          ? response.results
          : [],
      )
    } catch (err) {
      console.error(
        'Erreur lors du chargement des réclamations :',
        err,
      )

      setClaimsError(
        'Impossible de charger le statut de vos réclamations.',
      )
    } finally {
      setClaimsLoading(false)
    }
  }

  /* ============================================================
     CHARGEMENT INITIAL
  ============================================================ */

  const loadAll = async () => {
    await Promise.all([
      loadCertificates(),
      loadClaims(),
    ])
  }

  useEffect(() => {
    void loadAll()
  }, [])

  /* ============================================================
     RÉCLAMATIONS PAR CERTIFICAT
  ============================================================ */

  const claimsByCertificate = useMemo(() => {
    const map = new Map<string, Claim>()

    claims.forEach((claim) => {
      if (!claim.certificate) return

      const existing = map.get(claim.certificate)

      if (!existing) {
        map.set(claim.certificate, claim)
        return
      }

      const existingDate = new Date(
        existing.created_at,
      ).getTime()

      const currentDate = new Date(
        claim.created_at,
      ).getTime()

      if (currentDate > existingDate) {
        map.set(claim.certificate, claim)
      }
    })

    return map
  }, [claims])

  /* ============================================================
     OUVRIR LE MODAL
  ============================================================ */

  const openClaimModal = (
    certificate: MesCertificatsItem,
  ) => {
    setSelectedCertificate(certificate)
    setClaimMessage('')
    setClaimSubmitError(null)
    setSuccessMessage(null)
  }

  /* ============================================================
     FERMER LE MODAL
  ============================================================ */

  const closeClaimModal = () => {
    if (submittingClaim) return

    setSelectedCertificate(null)
    setClaimMessage('')
    setClaimSubmitError(null)
  }

  /* ============================================================
     ENVOYER UNE RÉCLAMATION
  ============================================================ */

  const handleSubmitClaim = async () => {
    if (!selectedCertificate) return

    const certificateId = selectedCertificate.id

    const existingClaim =
      claimsByCertificate.get(certificateId)

    /*
     * Une nouvelle réclamation n'est pas autorisée
     * s'il existe déjà une réclamation active ou résolue.
     *
     * Une réclamation rejetée peut être soumise à nouveau.
     */
    if (
      existingClaim &&
      existingClaim.status !== 'rejected'
    ) {
      setClaimSubmitError(
        'Une réclamation existe déjà pour ce certificat.',
      )
      return
    }

    const message = claimMessage.trim()

    if (!message) {
      setClaimSubmitError(
        'Veuillez saisir un message avant d’envoyer votre réclamation.',
      )
      return
    }

    if (message.length < 10) {
      setClaimSubmitError(
        'Votre message doit contenir au moins 10 caractères.',
      )
      return
    }

    setSubmittingClaim(true)
    setClaimSubmitError(null)
    setSuccessMessage(null)

    try {
      const newClaim = await createClaim({
        certificate: certificateId,
        message,
      })

      setClaims((previous) => [
        newClaim,
        ...previous,
      ])

      setSelectedCertificate(null)
      setClaimMessage('')

      setSuccessMessage(
        'Votre réclamation a été envoyée avec succès.',
      )
    } catch (err: any) {
      console.error(
        'Erreur lors de la création de la réclamation :',
        err,
      )

      const responseData = err?.response?.data

      setClaimSubmitError(
        responseData?.detail ||
          responseData?.message?.[0] ||
          responseData?.certificate?.[0] ||
          "Impossible d'envoyer votre réclamation. Veuillez réessayer.",
      )
    } finally {
      setSubmittingClaim(false)
    }
  }

  /* ============================================================
     ACTUALISER
  ============================================================ */

  const handleRefresh = async () => {
    setSuccessMessage(null)

    await loadAll()
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-8">

      {/* ========================================================
          HEADER
      ======================================================== */}

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
          onClick={handleRefresh}
          disabled={loading || claimsLoading}
          variant="outline"
          size="sm"
          className="
            gap-2
            self-start
            rounded-xl
            border-slate-200
            dark:border-white/10
          "
        >
          <RefreshCw
            className={`size-3.5 ${
              loading || claimsLoading
                ? 'animate-spin'
                : ''
            }`}
          />

          Actualiser
        </Button>

      </div>

      {/* ========================================================
          SUCCÈS
      ======================================================== */}

      {successMessage && (
        <div
          className="
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-emerald-200
            bg-emerald-50
            p-4
            dark:border-emerald-500/20
            dark:bg-emerald-500/10
          "
        >
          <CheckCircle2
            className="
              mt-0.5
              size-5
              shrink-0
              text-emerald-500
            "
          />

          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {successMessage}
          </p>
        </div>
      )}

      {/* ========================================================
          ERREUR RÉCLAMATIONS
      ======================================================== */}

      {claimsError && (
        <div
          className="
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-amber-200
            bg-amber-50
            p-4
            dark:border-amber-500/20
            dark:bg-amber-500/10
          "
        >
          <AlertCircle
            className="
              mt-0.5
              size-5
              shrink-0
              text-amber-500
            "
          />

          <p className="text-sm text-amber-700 dark:text-amber-300">
            {claimsError}
          </p>
        </div>
      )}

      {/* ========================================================
          LOADING
      ======================================================== */}

      {loading ? (

        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>

      ) : error ? (

        <Card
          className="
            flex
            h-64
            flex-col
            items-center
            justify-center
            gap-4
            bg-white
            p-8
            text-center
            shadow-sm
            dark:bg-[#1f1f38]
          "
        >
          <div
            className="
              flex
              size-12
              items-center
              justify-center
              rounded-full
              bg-red-500/10
              text-red-500
            "
          >
            <AlertCircle className="size-6" />
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error}
          </p>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
        </Card>

      ) : certificates.length === 0 ? (

        <Card
          className="
            bg-white
            p-12
            text-center
            shadow-sm
            dark:bg-[#1f1f38]
          "
        >
          <div
            className="
              mx-auto
              flex
              size-12
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-slate-400
              dark:bg-white/5
            "
          >
            <Award className="size-6" />
          </div>

          <h3
            className="
              mt-4
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Aucun certificat pour le moment
          </h3>

          <p
            className="
              mx-auto
              mt-1
              max-w-sm
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Votre certificat apparaîtra ici une fois vos projets
            validés à 80 % et le document généré.
          </p>
        </Card>

      ) : (

        /* ======================================================
           LISTE
        ====================================================== */

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-3
          "
        >

          {certificates.map((cert) => {

            const normalizedStatus =
              normalizeStatus(cert.status)

            const status =
              STATUS_CONFIG[normalizedStatus] ?? {
                label: cert.status,
                className:
                  'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300',
              }

            const isSent =
              normalizedStatus === 'ENVOYE' ||
              normalizedStatus === 'SENT'

            const existingClaim =
              claimsByCertificate.get(cert.id)

            const hasClaim =
              Boolean(existingClaim)

            const isClaimResolved =
              existingClaim?.status === 'resolved'

            const isClaimPending =
              existingClaim?.status === 'pending'

            const isClaimInProgress =
              existingClaim?.status === 'in_progress'

            const isClaimRejected =
              existingClaim?.status === 'rejected'

            /*
             * IMPORTANT :
             *
             * Le téléchargement dépend uniquement
             * de cert.url.
             *
             * Une réclamation ne doit JAMAIS masquer
             * le téléchargement si le certificat est disponible.
             */
            const hasCertificateFile =
              Boolean(cert.url)

            /*
             * La réclamation est possible si :
             *
             * - le certificat n'est pas disponible
             * - aucune réclamation active n'existe
             * - ou la dernière réclamation a été rejetée
             *
             * Si le certificat est déjà disponible,
             * l'apprenant n'a normalement plus besoin
             * de réclamer le certificat.
             */
            const canClaim =
              !hasCertificateFile &&
              (!hasClaim || isClaimRejected)

            return (
              <Card
                key={cert.id}
                className="
                  flex
                  flex-col
                  overflow-hidden
                  rounded-2xl
                  border-slate-200
                  bg-white
                  shadow-sm
                  transition-shadow
                  hover:shadow-md
                  dark:border-white/10
                  dark:bg-[#1f1f38]
                "
              >

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-slate-100
                    p-5
                    dark:border-white/5
                  "
                >

                  <div
                    className="
                      flex
                      size-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#FF6B0B]/10
                      text-[#FF6B0B]
                    "
                  >
                    <Award className="size-6" />
                  </div>

                  <span
                    className={`
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      ${status.className}
                    `}
                  >
                    {isSent ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <Clock className="size-3.5" />
                    )}

                    {status.label}
                  </span>

                </div>

                {/* ==================================================
                    CONTENU
                ================================================== */}

                <div className="flex flex-1 flex-col gap-4 p-5">

                  {/* PROGRAMME / COHORTE */}

                  <div>
                    <h3
                      className="
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      {cert.program_title}
                    </h3>

                    <p
                      className="
                        mt-1
                        flex
                        items-center
                        gap-1.5
                        text-sm
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      <GraduationCap className="size-4 text-slate-400" />

                      {cert.cohort_name}
                    </p>
                  </div>

                  {/* DATES */}

                  <div
                    className="
                      space-y-1.5
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    <p className="flex items-center gap-1.5">

                      <CalendarDays className="size-3.5 text-slate-400" />

                      Généré le{' '}
                      {formatDate(cert.date_generation)}

                    </p>

                    {isSent && (
                      <p className="flex items-center gap-1.5">

                        <CheckCircle2 className="size-3.5 text-slate-400" />

                        Envoyé le{' '}
                        {formatDate(cert.date_envoi)}

                      </p>
                    )}
                  </div>

                  {/* ==================================================
                      RÉCLAMATION
                  ================================================== */}

                  {hasClaim && existingClaim && (
                    <div
                      className="
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        p-3
                        dark:border-white/10
                        dark:bg-white/5
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-2
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-xs
                            font-medium
                            text-slate-600
                            dark:text-slate-300
                          "
                        >
                          <MessageSquare className="size-3.5" />

                          Ma réclamation
                        </div>

                        <span
                          className={`
                            rounded-full
                            px-2
                            py-1
                            text-[10px]
                            font-semibold
                            ${
                              CLAIM_STATUS_CONFIG[
                                existingClaim.status
                              ]?.className ??
                              'bg-slate-100 text-slate-600'
                            }
                          `}
                        >
                          {CLAIM_STATUS_CONFIG[
                            existingClaim.status
                          ]?.label ??
                            existingClaim.status}
                        </span>

                      </div>

                      {existingClaim.admin_response && (
                        <div
                          className="
                            mt-2
                            border-t
                            border-slate-200
                            pt-2
                            dark:border-white/10
                          "
                        >
                          <p
                            className="
                              text-xs
                              leading-5
                              text-slate-500
                              dark:text-slate-400
                            "
                          >
                            <span className="font-medium">
                              Réponse :
                            </span>{' '}

                            {existingClaim.admin_response}
                          </p>
                        </div>
                      )}

                    </div>
                  )}

                  {/* ==================================================
                      ACTIONS
                  ================================================== */}

                  <div className="mt-auto space-y-2 pt-2">

                    {/* ==================================================
                        1. TÉLÉCHARGEMENT
                        
                        IMPORTANT :
                        Le bouton dépend uniquement de cert.url.
                        Il reste donc visible même si une réclamation
                        existe ou a été traitée.
                    ================================================== */}

                    {hasCertificateFile && (
                      <a
                        href={cert.url!}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <Button
                          className="
                            w-full
                            rounded-xl
                            bg-[#FF6B0B]
                            text-white
                            shadow-sm
                            shadow-[#FF6B0B]/20
                            transition-all
                            hover:-translate-y-0.5
                            hover:bg-[#e85f08]
                            hover:shadow-md
                          "
                          size="sm"
                        >
                          <Download className="mr-2 size-4" />

                          Télécharger le certificat
                        </Button>
                      </a>
                    )}

                    {/* ==================================================
                        2. RÉCLAMATION
                        
                        Seulement si le certificat n'est pas disponible.
                    ================================================== */}

                    {!hasCertificateFile && canClaim && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          openClaimModal(cert)
                        }
                        className="
                          w-full
                          rounded-xl
                          bg-[#FF6B0B]
                          font-semibold
                          text-white
                          shadow-sm
                          shadow-[#FF6B0B]/20
                          transition-colors
                          hover:bg-[#e85f08]
                        "
                      >
                        <MessageSquare className="mr-2 size-4" />

                        {isClaimRejected
                          ? 'Faire une nouvelle réclamation'
                          : 'Réclamer mon certificat'}
                      </Button>
                    )}

                    {/* ==================================================
                        3. RÉCLAMATION EN ATTENTE
                    ================================================== */}

                    {!hasCertificateFile &&
                      isClaimPending && (
                        <div
                          className="
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-amber-500/10
                            p-3
                            text-center
                            text-xs
                            font-medium
                            text-amber-600
                            dark:text-amber-400
                          "
                        >
                          <Clock className="size-4" />

                          Réclamation en attente
                        </div>
                      )}

                    {/* ==================================================
                        4. RÉCLAMATION EN COURS
                    ================================================== */}

                    {!hasCertificateFile &&
                      isClaimInProgress && (
                        <div
                          className="
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-sky-500/10
                            p-3
                            text-center
                            text-xs
                            font-medium
                            text-sky-600
                            dark:text-sky-400
                          "
                        >
                          <Loader2 className="size-4 animate-spin" />

                          Réclamation en cours de traitement
                        </div>
                      )}

                    {/* ==================================================
                        5. RÉCLAMATION RÉSOLUE
                    ================================================== */}

                    {!hasCertificateFile &&
                      isClaimResolved && (
                        <div
                          className="
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-emerald-500/10
                            p-3
                            text-center
                            text-xs
                            font-medium
                            text-emerald-600
                            dark:text-emerald-400
                          "
                        >
                          <CheckCircle2 className="size-4" />

                          Réclamation traitée
                        </div>
                      )}

                    {/* ==================================================
                        6. DOCUMENT NON DISPONIBLE
                    ================================================== */}

                    {!hasCertificateFile &&
                      !hasClaim && (
                        <div
                          className="
                            w-full
                            rounded-xl
                            bg-slate-50
                            p-3
                            text-center
                            text-xs
                            text-slate-500
                            dark:bg-white/5
                            dark:text-slate-400
                          "
                        >
                          <FileDown
                            className="
                              mx-auto
                              mb-1
                              size-4
                            "
                          />

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

      {/* ==========================================================
          MODAL RÉCLAMATION
      ========================================================== */}

      {selectedCertificate && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeClaimModal()
            }
          }}
        >

          <div
            className="
              relative
              w-full
              max-w-lg
              overflow-hidden
              rounded-3xl
              border
              border-slate-200
              bg-white
              shadow-2xl
              dark:border-white/10
              dark:bg-[#1f1f38]
            "
          >

            {/* ======================================================
                HEADER MODAL
            ====================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                p-5
                dark:border-white/10
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    size-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#FF6B0B]/10
                    text-[#FF6B0B]
                  "
                >
                  <MessageSquare className="size-5" />
                </div>

                <div>

                  <h2
                    className="
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Réclamer mon certificat
                  </h2>

                  <p
                    className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Envoyez une demande à l'équipe administrative.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={closeClaimModal}
                disabled={submittingClaim}
                className="
                  flex
                  size-9
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-400
                  transition-colors
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:cursor-not-allowed
                  dark:hover:bg-white/10
                  dark:hover:text-white
                "
                aria-label="Fermer"
              >
                <X className="size-5" />
              </button>

            </div>

            {/* ======================================================
                CONTENU MODAL
            ====================================================== */}

            <div className="space-y-5 p-5">

              {/* CERTIFICAT */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-4
                  dark:border-white/10
                  dark:bg-white/5
                "
              >

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
                      text-[#FF6B0B]
                    "
                  >
                    <Award className="size-5" />
                  </div>

                  <div className="min-w-0">

                    <p
                      className="
                        truncate
                        font-semibold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      {selectedCertificate.program_title}
                    </p>

                    <p
                      className="
                        mt-0.5
                        flex
                        items-center
                        gap-1
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      <GraduationCap className="size-3.5" />

                      {selectedCertificate.cohort_name}
                    </p>

                  </div>

                </div>

              </div>

              {/* MESSAGE */}

              <div>

                <label
                  htmlFor="claim-message"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Message
                </label>

                <textarea
                  id="claim-message"
                  value={claimMessage}
                  onChange={(event) =>
                    setClaimMessage(event.target.value)
                  }
                  disabled={submittingClaim}
                  rows={5}
                  placeholder="Expliquez brièvement pourquoi vous réclamez votre certificat..."
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-3
                    text-sm
                    text-slate-900
                    outline-none
                    transition-all
                    placeholder:text-slate-400
                    focus:border-[#FF6B0B]/60
                    focus:bg-white
                    focus:ring-4
                    focus:ring-[#FF6B0B]/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    dark:border-white/10
                    dark:bg-white/5
                    dark:text-white
                    dark:placeholder:text-slate-600
                    dark:focus:bg-white/[0.08]
                  "
                />

                <p
                  className="
                    mt-1.5
                    text-right
                    text-xs
                    text-slate-400
                  "
                >
                  {claimMessage.length} caractères
                </p>

              </div>

              {/* ERREUR */}

              {claimSubmitError && (
                <div
                  className="
                    flex
                    items-start
                    gap-2
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    p-3
                    dark:border-red-500/20
                    dark:bg-red-500/10
                  "
                >
                  <AlertCircle
                    className="
                      mt-0.5
                      size-4
                      shrink-0
                      text-red-500
                    "
                  />

                  <p
                    className="
                      text-xs
                      leading-5
                      text-red-600
                      dark:text-red-300
                    "
                  >
                    {claimSubmitError}
                  </p>
                </div>
              )}

              {/* INFORMATION */}

              <div
                className="
                  flex
                  items-start
                  gap-2
                  rounded-xl
                  bg-slate-50
                  p-3
                  dark:bg-white/5
                "
              >
                <CircleDot
                  className="
                    mt-0.5
                    size-4
                    shrink-0
                    text-[#FF6B0B]
                  "
                />

                <p
                  className="
                    text-xs
                    leading-5
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Votre réclamation sera transmise à
                  l'administration. Vous pourrez suivre son
                  traitement depuis cette page.
                </p>
              </div>

            </div>

            {/* ======================================================
                FOOTER MODAL
            ====================================================== */}

            <div
              className="
                flex
                flex-col-reverse
                gap-2
                border-t
                border-slate-100
                p-5
                sm:flex-row
                sm:justify-end
                dark:border-white/10
              "
            >

              <Button
                type="button"
                variant="outline"
                onClick={closeClaimModal}
                disabled={submittingClaim}
                className="
                  rounded-xl
                  border-slate-200
                  dark:border-white/10
                "
              >
                Annuler
              </Button>

              <Button
                type="button"
                onClick={handleSubmitClaim}
                disabled={
                  submittingClaim ||
                  !claimMessage.trim()
                }
                className="
                  rounded-xl
                  bg-[#FF6B0B]
                  font-semibold
                  text-white
                  shadow-sm
                  shadow-[#FF6B0B]/20
                  hover:bg-[#e85f08]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {submittingClaim ? (
                  <>
                    <Loader2
                      className="
                        mr-2
                        size-4
                        animate-spin
                      "
                    />

                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />

                    Envoyer la réclamation
                  </>
                )}

              </Button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default MesCertificatsPage

