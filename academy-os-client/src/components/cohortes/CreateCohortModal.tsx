/**
 * TÂCHE 1 — Modal de création d'une cohorte.
 *
 * Champs:
 *   - Nom de la cohorte [requis]
 *   - Session parente [dropdown via GET /sessions]
 *   - Date de début [date picker]
 *   - Date de fin [date picker]
 *
 * Validation:
 *   - Tous les champs requis
 *   - date_fin > date_debut
 *
 * Action: POST /cohortes via cohorteService.createCohort()
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, AlertCircle, CalendarDays, Users, ChevronDown } from 'lucide-react';
import type { Session, CreateCohortePayload } from '@/types/cohorte';
import { getSessions, createCohort } from '@/services/cohortes/cohorteService';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CreateCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Appelé après création réussie pour rafraîchir la liste
}

interface FormValues {
  nom: string;
  rentree_id: string;
  date_debut: string;
  date_fin: string;
}

interface FormErrors {
  nom?: string;
  rentree_id?: string;
  date_debut?: string;
  date_fin?: string;
  global?: string;
}

const INITIAL_FORM: FormValues = {
  nom: '',
  rentree_id: '',
  date_debut: '',
  date_fin: '',
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function CreateCohortModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCohortModalProps) {
  // État du formulaire
  const [form, setForm] = useState<FormValues>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  // Sessions pour le dropdown
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // État de soumission
  const [submitting, setSubmitting] = useState(false);

  // ─── Chargement des sessions ──────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      setSessionsError('Impossible de charger les rentrées. Veuillez réessayer.');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
      setForm(INITIAL_FORM);
      setErrors({});
    }
  }, [isOpen, fetchSessions]);

  // ─── Gestion des champs ───────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ─── Validation ───────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.nom.trim()) {
      newErrors.nom = 'Le nom de la cohorte est requis.';
    } else if (form.nom.trim().length < 3) {
      newErrors.nom = 'Le nom doit contenir au moins 3 caractères.';
    }

    if (!form.rentree_id) {
      newErrors.rentree_id = 'Veuillez sélectionner une rentrée.';
    }

    if (!form.date_debut) {
      newErrors.date_debut = 'La date de début est requise.';
    }

    if (!form.date_fin) {
      newErrors.date_fin = 'La date de fin est requise.';
    }

    // Validation date_fin > date_debut
    if (form.date_debut && form.date_fin) {
      if (new Date(form.date_fin) <= new Date(form.date_debut)) {
        newErrors.date_fin = 'La date de fin doit être postérieure à la date de début.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Soumission ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const payload: CreateCohortePayload = {
        nom: form.nom.trim(),
        rentree_id: form.rentree_id,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
      };
      await createCohort(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Une erreur est survenue lors de la création.';
      setErrors({ global: message });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Fermeture par Escape ─────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!submitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                Nouvelle Cohorte
              </h2>
              <p className="text-xs text-muted-foreground">
                Remplissez les informations de la cohorte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Corps du formulaire */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* Erreur globale */}
            {errors.global && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{errors.global}</span>
              </div>
            )}

            {/* Nom de la cohorte */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cohort-nom"
                className="text-sm font-medium text-foreground"
              >
                Nom de la cohorte <span className="text-destructive">*</span>
              </label>
              <input
                id="cohort-nom"
                name="nom"
                type="text"
                value={form.nom}
                onChange={handleChange}
                placeholder="Ex: Cohorte Zeta 2025"
                disabled={submitting}
                className={`w-full h-10 px-3 text-sm bg-background border rounded-lg outline-none transition-all
                  focus:ring-2 focus:ring-primary/30 focus:border-primary
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.nom ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : 'border-input'}`}
              />
              {errors.nom && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" /> {errors.nom}
                </p>
              )}
            </div>

            {/* Session parente */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cohort-rentree"
                className="text-sm font-medium text-foreground"
              >
                Rentrée parente <span className="text-destructive">*</span>
              </label>

              {loadingSessions ? (
                <div className="h-10 flex items-center gap-2 px-3 bg-muted rounded-lg border border-input text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Chargement des rentrées…
                </div>
              ) : sessionsError ? (
                <div className="flex flex-col gap-2">
                  <div className="h-10 flex items-center gap-2 px-3 bg-destructive/5 border border-destructive/20 rounded-lg text-sm text-destructive">
                    <AlertCircle className="size-4" />
                    {sessionsError}
                  </div>
                  <button
                    type="button"
                    onClick={fetchSessions}
                    className="text-xs text-primary hover:underline text-left"
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="cohort-rentree"
                    name="rentree_id"
                    value={form.rentree_id}
                    onChange={handleChange}
                    disabled={submitting}
                    className={`w-full h-10 pl-3 pr-9 text-sm bg-background border rounded-lg outline-none appearance-none transition-all
                      focus:ring-2 focus:ring-primary/30 focus:border-primary
                      disabled:opacity-50 disabled:cursor-not-allowed
                       ${errors.rentree_id ? 'border-destructive focus:ring-destructive/30' : 'border-input'}`}
                  >
                    <option value="">— Sélectionner une rentrée —</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom} {s.programme_nom ? `(${s.programme_nom})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              )}

              {errors.rentree_id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" /> {errors.rentree_id}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date de début */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cohort-date-debut"
                  className="text-sm font-medium text-foreground"
                >
                  Date de début <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="cohort-date-debut"
                    name="date_debut"
                    type="date"
                    value={form.date_debut}
                    onChange={handleChange}
                    disabled={submitting}
                    className={`w-full h-10 pl-9 pr-3 text-sm bg-background border rounded-lg outline-none transition-all
                      focus:ring-2 focus:ring-primary/30 focus:border-primary
                      disabled:opacity-50
                      ${errors.date_debut ? 'border-destructive' : 'border-input'}`}
                  />
                </div>
                {errors.date_debut && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.date_debut}
                  </p>
                )}
              </div>

              {/* Date de fin */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cohort-date-fin"
                  className="text-sm font-medium text-foreground"
                >
                  Date de fin <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="cohort-date-fin"
                    name="date_fin"
                    type="date"
                    value={form.date_fin}
                    onChange={handleChange}
                    min={form.date_debut || undefined}
                    disabled={submitting}
                    className={`w-full h-10 pl-9 pr-3 text-sm bg-background border rounded-lg outline-none transition-all
                      focus:ring-2 focus:ring-primary/30 focus:border-primary
                      disabled:opacity-50
                      ${errors.date_fin ? 'border-destructive' : 'border-input'}`}
                  />
                </div>
                {errors.date_fin && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.date_fin}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Pied de page */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/30 border-t border-border rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="cohort-submit-btn"
              disabled={submitting || loadingSessions}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg
                hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Création en cours…
                </>
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
