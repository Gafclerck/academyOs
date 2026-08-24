import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Send, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProjet } from '@/hooks/useProjets';
import { createSoumission } from '@/services/soumissionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const ProjetSoumissionPage: React.FC = () => {
  const { projetId } = useParams<{ projetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projetIdNum = projetId ? Number(projetId) : undefined;

  const { data: projet, isLoading } = useProjet(projetIdNum);

  const [form, setForm] = useState({
    commentaire: '',
    fichier_url: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      createSoumission({
        projet_id: projetId || '',
        cohorte_id: String(projet?.cohorte ?? ''),
        membre_id: 'm-1',
        fichier_url: form.fichier_url || undefined,
        commentaire: form.commentaire || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soumissions'] });
      toast.success('Soumission envoyée avec succès');
      navigate(-1);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.commentaire.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Chargement...</p>
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Projet introuvable</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="size-9 rounded-xl border-slate-200 dark:border-white/10"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Soumettre un projet
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {projet.name}
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="p-4 rounded-xl bg-[#FF6B0B]/5 border border-[#FF6B0B]/20">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {projet.description}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Date de rendu prévue : {projet.deadline ? new Date(projet.deadline).toLocaleDateString('fr-FR') : '-'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fichier_url">Lien du fichier / dépôt</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="fichier_url"
                value={form.fichier_url}
                onChange={(e) => setForm({ ...form, fichier_url: e.target.value })}
                placeholder="https://github.com/... ou lien Google Drive"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire *</Label>
            <Textarea
              id="commentaire"
              value={form.commentaire}
              onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
              placeholder="Décrivez votre réalisation, les choix techniques, etc."
              rows={5}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-slate-200 dark:border-white/10"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#FF6B0B] hover:bg-[#ff7a24] text-white"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Soumettre
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
