import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  UserPlus,
  Search,
  Mail,
  CheckCircle2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

const InviterApprenant: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [search, setSearch] = useState('')
  const [selectedApprenants, setSelectedApprenants] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // ============================================================
  // DONNÉES TEMPORAIRES
  // À remplacer plus tard par les données venant de l'API
  // ============================================================

  const apprenants = [
    {
      id: 1,
      prenom: 'Awa',
      nom: 'Diop',
      email: 'awa.diop@example.com',
    },
    {
      id: 2,
      prenom: 'Mamadou',
      nom: 'Fall',
      email: 'mamadou.fall@example.com',
    },
    {
      id: 3,
      prenom: 'Fatou',
      nom: 'Sow',
      email: 'fatou.sow@example.com',
    },
    {
      id: 4,
      prenom: 'Aliou',
      nom: 'Ndiaye',
      email: 'aliou.ndiaye@example.com',
    },
  ]

  // ============================================================
  // RECHERCHE
  // ============================================================

  const filteredApprenants = apprenants.filter((apprenant) => {
    const value = search.toLowerCase().trim()

    return (
      apprenant.prenom.toLowerCase().includes(value) ||
      apprenant.nom.toLowerCase().includes(value) ||
      apprenant.email.toLowerCase().includes(value)
    )
  })

  // ============================================================
  // SÉLECTION D'UN APPRENANT
  // ============================================================

  const toggleApprenant = (apprenantId: number) => {
    setSelectedApprenants((prev) =>
      prev.includes(apprenantId)
        ? prev.filter((id) => id !== apprenantId)
        : [...prev, apprenantId]
    )
  }

  // ============================================================
  // INVITATION
  // ============================================================

  const handleInvitation = () => {
    if (selectedApprenants.length === 0) {
      return
    }

    setLoading(true)

    console.log('Cohorte :', id)
    console.log('Apprenants sélectionnés :', selectedApprenants)

    // ==========================================================
    // SIMULATION DE L'APPEL API
    // Plus tard, on remplacera cette partie par l'API réelle
    // ==========================================================

    setTimeout(() => {
      setLoading(false)
      setSuccess(true)

      // Retour automatique vers la cohorte après 2 secondes
      setTimeout(() => {
        navigate(`/cohortes/${id}`)
      }, 2000)
    }, 1000)
  }

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 p-6 rounded-2xl shadow-sm">

        <div className="flex items-center gap-3">

          {/* RETOUR */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/cohortes/${id}`)}
            className="size-9 rounded-lg border-slate-200 dark:border-white/10"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Inviter des apprenants
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sélectionnez les apprenants à inviter dans cette cohorte.
            </p>
          </div>

        </div>

      </div>

      {/* ======================================================
          MESSAGE DE SUCCÈS
      ====================================================== */}

      {success && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20">

          <div className="size-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>

          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">
              Invitations envoyées avec succès
            </p>

            <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
              {selectedApprenants.length}{' '}
              {selectedApprenants.length > 1
                ? 'apprenants ont été invités'
                : 'apprenant a été invité'}{' '}
              dans cette cohorte.
            </p>

            <p className="text-xs text-emerald-600/70 dark:text-emerald-300/70 mt-2">
              Redirection vers la cohorte...
            </p>
          </div>

        </div>
      )}

      {/* ======================================================
          CONTENU
      ====================================================== */}

      {!success && (
        <div className="bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">

          {/* ==================================================
              RECHERCHE
          ================================================== */}

          <div className="p-5 border-b border-slate-200 dark:border-white/10">

            <div className="relative">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un apprenant..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF6B0B]/30"
              />

            </div>

          </div>

          {/* ==================================================
              LISTE DES APPRENANTS
          ================================================== */}

          <div className="divide-y divide-slate-200 dark:divide-white/10">

            {filteredApprenants.length === 0 ? (

              <div className="p-10 text-center">

                <div className="mx-auto size-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">

                  <UserPlus className="size-5 text-slate-400" />

                </div>

                <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Aucun apprenant trouvé
                </p>

                {search && (
                  <p className="mt-1 text-xs text-slate-400">
                    Essayez avec un autre nom ou une autre adresse email.
                  </p>
                )}

              </div>

            ) : (

              filteredApprenants.map((apprenant) => {

                const selected = selectedApprenants.includes(
                  apprenant.id
                )

                return (
                  <div
                    key={apprenant.id}
                    onClick={() =>
                      toggleApprenant(apprenant.id)
                    }
                    className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${
                      selected
                        ? 'bg-[#FF6B0B]/5 dark:bg-[#FF6B0B]/10'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >

                    {/* INFORMATIONS */}
                    <div className="flex items-center gap-3">

                      {/* AVATAR */}
                      <div className="size-10 rounded-full bg-gradient-to-br from-[#FF6B0B] to-[#FF8C38] text-white font-bold flex items-center justify-center text-sm shrink-0">

                        {apprenant.prenom[0]}
                        {apprenant.nom[0]}

                      </div>

                      {/* NOM + EMAIL */}
                      <div>

                        <p className="font-bold text-sm text-slate-900 dark:text-white">

                          {apprenant.prenom}{' '}
                          {apprenant.nom}

                        </p>

                        <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">

                          <Mail className="size-3" />

                          {apprenant.email}

                        </p>

                      </div>

                    </div>

                    {/* CHECKBOX */}
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleApprenant(apprenant.id)
                      }
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      className="size-4 accent-[#FF6B0B] cursor-pointer"
                    />

                  </div>
                )
              })

            )}

          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="p-5 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* COMPTEUR */}
            <p className="text-sm text-slate-500 dark:text-slate-400">

              <strong className="text-slate-900 dark:text-white">
                {selectedApprenants.length}
              </strong>{' '}

              {selectedApprenants.length > 1
                ? 'apprenants sélectionnés'
                : 'apprenant sélectionné'}

            </p>

            {/* BOUTONS */}
            <div className="flex gap-2 w-full sm:w-auto">

              {/* ANNULER */}
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/cohortes/${id}`)
                }
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                Annuler
              </Button>

              {/* INVITER */}
              <Button
                onClick={handleInvitation}
                disabled={
                  selectedApprenants.length === 0 ||
                  loading
                }
                className="gap-2 bg-[#FF6B0B] hover:bg-[#e85f08] text-white flex-1 sm:flex-none"
              >

                <UserPlus className="size-4" />

                {loading
                  ? 'Invitation en cours...'
                  : 'Inviter'}

              </Button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default InviterApprenant