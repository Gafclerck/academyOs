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

const InviterFormateur: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [search, setSearch] = useState('')
  const [selectedFormateurs, setSelectedFormateurs] = useState<number[]>([])
  const [invitationSent, setInvitationSent] = useState(false)

  // Données temporaires pour tester l'interface
  const formateurs = [
    {
      id: 1,
      prenom: 'Moussa',
      nom: 'Diop',
      email: 'moussa.diop@example.com',
    },
    {
      id: 2,
      prenom: 'Aminata',
      nom: 'Fall',
      email: 'aminata.fall@example.com',
    },
    {
      id: 3,
      prenom: 'Cheikh',
      nom: 'Sow',
      email: 'cheikh.sow@example.com',
    },
    {
      id: 4,
      prenom: 'Fatou',
      nom: 'Ndiaye',
      email: 'fatou.ndiaye@example.com',
    },
  ]

  const filteredFormateurs = formateurs.filter((formateur) => {
    const value = search.toLowerCase()

    return (
      formateur.prenom.toLowerCase().includes(value) ||
      formateur.nom.toLowerCase().includes(value) ||
      formateur.email.toLowerCase().includes(value)
    )
  })

  const toggleFormateur = (formateurId: number) => {
    setSelectedFormateurs((prev) =>
      prev.includes(formateurId)
        ? prev.filter((id) => id !== formateurId)
        : [...prev, formateurId]
    )
  }

  const handleInvitation = () => {
    console.log('Cohorte :', id)
    console.log('Formateurs sélectionnés :', selectedFormateurs)

    // Plus tard :
    // appel API pour envoyer les invitations

    setInvitationSent(true)

    setTimeout(() => {
      navigate(`/cohortes/${id}`)
    }, 1500)
  }

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}
      <div className="bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 p-6 rounded-2xl shadow-sm">

        <div className="flex items-center gap-3">

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/cohortes/${id}`)}
            className="size-9 rounded-lg"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Inviter des formateurs
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sélectionnez les formateurs à inviter dans cette cohorte.
            </p>
          </div>

        </div>

      </div>

      {/* ================= MESSAGE DE SUCCÈS ================= */}
      {invitationSent && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20">

          <div className="size-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div>
            <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
              Invitation envoyée
            </p>

            <p className="text-xs text-emerald-600 dark:text-emerald-500">
              Les formateurs sélectionnés ont été invités dans la cohorte.
            </p>
          </div>

        </div>
      )}

      {/* ================= CONTENU ================= */}
      <div className="bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm">

        {/* ================= RECHERCHE ================= */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un formateur..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
            />

          </div>

        </div>

        {/* ================= LISTE ================= */}
        <div className="divide-y divide-slate-200 dark:divide-white/10">

          {filteredFormateurs.length === 0 ? (

            <div className="p-10 text-center">

              <UsersIcon />

              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Aucun formateur trouvé
              </p>

            </div>

          ) : (

            filteredFormateurs.map((formateur) => {

              const selected = selectedFormateurs.includes(formateur.id)

              return (
                <div
                  key={formateur.id}
                  onClick={() => toggleFormateur(formateur.id)}
                  className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${
                    selected
                      ? 'bg-blue-500/5'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >

                  {/* INFORMATIONS */}
                  <div className="flex items-center gap-3">

                    {/* AVATAR */}
                    <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 text-white font-bold flex items-center justify-center text-sm">
                      {formateur.prenom[0]}
                      {formateur.nom[0]}
                    </div>

                    {/* NOM + EMAIL */}
                    <div>

                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {formateur.prenom} {formateur.nom}
                      </p>

                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Mail className="size-3" />
                        {formateur.email}
                      </p>

                    </div>

                  </div>

                  {/* CHECKBOX */}
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleFormateur(formateur.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="size-4 accent-blue-600"
                  />

                </div>
              )
            })
          )}

        </div>

        {/* ================= FOOTER ================= */}
        <div className="p-5 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">

          <p className="text-sm text-slate-500 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white">
              {selectedFormateurs.length}
            </strong>{' '}
            formateur(s) sélectionné(s)
          </p>

          <div className="flex gap-2">

            <Button
              variant="outline"
              onClick={() => navigate(`/cohortes/${id}`)}
              disabled={invitationSent}
            >
              Annuler
            </Button>

            <Button
              onClick={handleInvitation}
              disabled={
                selectedFormateurs.length === 0 || invitationSent
              }
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="size-4" />
              Inviter
            </Button>

          </div>

        </div>

      </div>

    </div>
  )
}

const UsersIcon = () => (
  <div className="mx-auto size-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
    <UserPlus className="size-5 text-slate-400" />
  </div>
)

export default InviterFormateur