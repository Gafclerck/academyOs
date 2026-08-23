import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { inviteTrainers } from '@/services/membreService'

const InviterFormateur: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [emails, setEmails] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ email: string; status: string; message: string }[]>([])
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const lines = emails
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    if (lines.length === 0) {
      return
    }

    setLoading(true)
    try {
      const data = await inviteTrainers(Number(id || ''), lines)
      setResults(data)
      setSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'envoi des invitations."
      setResults(lines.map((email) => ({ email, status: 'error', message })))
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  const successCount = results.filter((r) => r.status === 'success').length
  const hasErrors = results.some((r) => r.status !== 'success')

  return (
    <div className="space-y-6">

      <div className="bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
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
              Inviter des formateurs
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Saisissez les emails des formateurs à affecter à cette cohorte.
            </p>
          </div>
        </div>
      </div>

      {submitted && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${hasErrors ? 'border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20' : 'border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20'}`}>
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${hasErrors ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {hasErrors ? <AlertCircle className="size-5" /> : <CheckCircle2 className="size-5" />}
          </div>
          <div>
            <p className={`font-bold ${hasErrors ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {hasErrors ? 'Affectations terminées avec des erreurs' : 'Formateurs ajoutés avec succès'}
            </p>
            <p className={`text-sm mt-1 ${hasErrors ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
              {successCount} formateur(s) ajouté(s) sur {results.length}.
            </p>
          </div>
        </div>
      )}

      {!submitted && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-white/10 space-y-2">
            <Label htmlFor="emails">Emails des formateurs</Label>
            <Textarea
              id="emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="formateur1@exemple.com&#10;formateur2@exemple.com&#10;..."
              rows={8}
              className="rounded-xl"
            />
            <p className="text-xs text-slate-500">
              Un email par ligne. Les comptes doivent déjà exister avec le rôle formateur.
            </p>
          </div>

          <div className="p-5 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-white">
                {emails.split(/[\n,]+/).filter((e) => e.trim().length > 0).length}
              </strong>{' '}
              email(s) saisi(s)
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/cohortes/${id}`)}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
              >
                <UserPlus className="size-4" />
                {loading ? 'Ajout en cours...' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {submitted && results.length > 0 && (
        <div className="bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Résultats</h3>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {results.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between p-4">
                <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{r.email}</span>
                <span className={`text-xs font-semibold ${r.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {r.message}
                </span>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-slate-200 dark:border-white/10">
            <Button
              variant="outline"
              onClick={() => navigate(`/cohortes/${id}`)}
              className="w-full sm:w-auto"
            >
              Retour à la cohorte
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InviterFormateur
