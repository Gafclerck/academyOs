/**
 * CreateCohortModal — /components/cohorte/CreateCohortModal.tsx
 *
 * Design aligné sur la charte graphique Auth / Xarala :
 *   - Couleur primaire : #FF6B0B (Orange Xarala)
 *   - Mode sombre : #19192D + glassmorphism backdrop
 *   - Glow orange décoratif, inputs stylisés, validations
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, AlertCircle, CalendarDays, Users, ChevronDown, Sparkles } from 'lucide-react';
import type { Session, CreateCohortePayload } from '@/types/cohorte';
import { getSessions, createCohorte } from '@/services/cohorteService';

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  nom: string;
  session_id: string;
  date_debut: string;
  date_fin: string;
}

interface FormErrors {
  nom?: string;
  session_id?: string;
  date_debut?: string;
  date_fin?: string;
  global?: string;
}

const EMPTY_FORM: FormState = { nom: '', session_id: '', date_debut: '', date_fin: '' };

// ─── Composant ────────────────────────────────────────────────────────────────

export default function CreateCohortModal({ isOpen, onClose, onSuccess }: Props) {
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]           = useState<FormErrors>({});
  const [sessions, setSessions]       = useState<Session[]>([]);
  const [loadingSess, setLoadingSess] = useState(false);
  const [sessError, setSessError]     = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  // ─── Chargement des sessions ────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    setLoadingSess(true);
    setSessError(null);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      setSessError(err instanceof Error ? err.message : 'Erreur lors du chargement des sessions.');
    } finally {
      setLoadingSess(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      fetchSessions();
    }
  }, [isOpen, fetchSessions]);

  // ─── Fermeture via Escape ────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, submitting, onClose]);

  // ─── Mise à jour des champs ──────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined, global: undefined }));
  };

  // ─── Validation ──────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.nom.trim())
      e.nom = 'Le nom de la cohorte est requis.';
    else if (form.nom.trim().length < 3)
      e.nom = 'Le nom doit contenir au moins 3 caractères.';

    if (!form.session_id)
      e.session_id = 'Veuillez sélectionner une session.';

    if (!form.date_debut)
      e.date_debut = 'La date de début est requise.';

    if (!form.date_fin)
      e.date_fin = 'La date de fin est requise.';
    else if (form.date_debut && new Date(form.date_fin) <= new Date(form.date_debut))
      e.date_fin = 'La date de fin doit être postérieure à la date de début.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Soumission ──────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreateCohortePayload = {
        nom: form.nom.trim(),
        session_id: form.session_id,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
      };
      await createCohorte(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({
        global: err instanceof Error ? err.message : 'Impossible de créer la cohorte.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cohort-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!submitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panneau Modal avec glow Xarala */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden bg-white dark:bg-[#1e1e36] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-300/30 dark:shadow-black/60
        animate-in fade-in zoom-in-95 duration-200">

        {/* Glow décoratif orange */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#FF6B0B]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#FF6B0B]/10 blur-3xl" />

        {/* ── En-tête ────────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-[#FF6B0B]/10 flex items-center justify-center">
              <Users className="size-5.5 text-[#FF6B0B]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF6B0B] uppercase">
                <Sparkles className="size-3" />
                <span>Nouveau</span>
              </div>
              <h2 id="modal-cohort-title" className="text-xl font-bold text-slate-900 dark:text-white">
                Créer une Cohorte
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
            className="size-9 flex items-center justify-center rounded-xl
              text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── Formulaire ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="relative">
          <div className="px-6 py-6 flex flex-col gap-5">

            {/* Erreur globale */}
            {errors.global && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                {errors.global}
              </div>
            )}

            {/* ── Nom ──────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cohort-nom" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Nom de la cohorte <span className="text-[#FF6B0B]">*</span>
              </label>
              <input
                id="cohort-nom"
                name="nom"
                type="text"
                value={form.nom}
                onChange={handleChange}
                placeholder="Ex : Cohorte Zeta 2025"
                disabled={submitting}
                className={`w-full h-11 px-4 text-sm bg-slate-50 dark:bg-white/5 border rounded-xl outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all
                  focus:border-[#FF6B0B]/60 focus:bg-white dark:focus:bg-white/[0.08] focus:ring-4 focus:ring-[#FF6B0B]/10 disabled:opacity-50
                  ${errors.nom ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 dark:border-white/10'}`}
              />
              {errors.nom && (
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="size-3" />{errors.nom}
                </p>
              )}
            </div>

            {/* ── Session ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cohort-session" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Session parente <span className="text-[#FF6B0B]">*</span>
              </label>

              {loadingSess ? (
                <div className="h-11 flex items-center gap-2 px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="size-4 animate-spin text-[#FF6B0B]" /> Chargement des sessions…
                </div>
              ) : sessError ? (
                <div className="flex flex-col gap-1.5">
                  <div className="h-11 flex items-center gap-2 px-4 bg-red-500/5 border border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="size-4" />{sessError}
                  </div>
                  <button type="button" onClick={fetchSessions} className="text-xs text-[#FF6B0B] hover:underline text-left font-medium">
                    Réessayer
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="cohort-session"
                    name="session_id"
                    value={form.session_id}
                    onChange={handleChange}
                    disabled={submitting}
                    className={`w-full h-11 pl-4 pr-10 text-sm bg-slate-50 dark:bg-white/5 border rounded-xl outline-none appearance-none text-slate-900 dark:text-white transition-all cursor-pointer
                      focus:border-[#FF6B0B]/60 focus:bg-white dark:focus:bg-white/[0.08] focus:ring-4 focus:ring-[#FF6B0B]/10 disabled:opacity-50
                      ${errors.session_id ? 'border-red-500/60' : 'border-slate-200 dark:border-white/10'}`}
                  >
                    <option value="" className="dark:bg-[#19192D]">— Sélectionner une session —</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id} className="dark:bg-[#19192D]">
                        {s.nom}{s.programme_nom ? ` (${s.programme_nom})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
              )}

              {errors.session_id && (
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="size-3" />{errors.session_id}
                </p>
              )}
            </div>

            {/* ── Dates ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date début */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cohort-date-debut" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Date de début <span className="text-[#FF6B0B]">*</span>
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="cohort-date-debut"
                    name="date_debut"
                    type="date"
                    value={form.date_debut}
                    onChange={handleChange}
                    disabled={submitting}
                    className={`w-full h-11 pl-10 pr-3 text-sm bg-slate-50 dark:bg-white/5 border rounded-xl outline-none text-slate-900 dark:text-white transition-all
                      focus:border-[#FF6B0B]/60 focus:bg-white dark:focus:bg-white/[0.08] focus:ring-4 focus:ring-[#FF6B0B]/10 disabled:opacity-50
                      ${errors.date_debut ? 'border-red-500/60' : 'border-slate-200 dark:border-white/10'}`}
                  />
                </div>
                {errors.date_debut && (
                  <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="size-3" />{errors.date_debut}
                  </p>
                )}
              </div>

              {/* Date fin */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cohort-date-fin" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Date de fin <span className="text-[#FF6B0B]">*</span>
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="cohort-date-fin"
                    name="date_fin"
                    type="date"
                    value={form.date_fin}
                    onChange={handleChange}
                    min={form.date_debut || undefined}
                    disabled={submitting}
                    className={`w-full h-11 pl-10 pr-3 text-sm bg-slate-50 dark:bg-white/5 border rounded-xl outline-none text-slate-900 dark:text-white transition-all
                      focus:border-[#FF6B0B]/60 focus:bg-white dark:focus:bg-white/[0.08] focus:ring-4 focus:ring-[#FF6B0B]/10 disabled:opacity-50
                      ${errors.date_fin ? 'border-red-500/60' : 'border-slate-200 dark:border-white/10'}`}
                  />
                </div>
                {errors.date_fin && (
                  <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="size-3" />{errors.date_fin}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* ── Pied de page ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 rounded-b-3xl">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white
                hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              id="cohort-submit"
              type="submit"
              disabled={submitting || loadingSess}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#FF6B0B] hover:bg-[#ff7a24] rounded-xl
                shadow-lg shadow-[#FF6B0B]/25 hover:scale-[1.01] active:scale-[0.98] transition-all
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="size-4 animate-spin" />Création…</>
              ) : (
                'Créer la cohorte'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
