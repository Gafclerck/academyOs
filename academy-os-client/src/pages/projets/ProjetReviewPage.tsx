import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Star, Loader2, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSoumissionsByProjet, createReview } from '@/services/soumissionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const ProjetReviewPage: React.FC = () => {
  const { projetId } = useParams<{ projetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: soumissions = [], isLoading } = useQuery({
    queryKey: ['soumissions', projetId],
    queryFn: () => getSoumissionsByProjet(projetId || ''),
    enabled: !!projetId,
  });

  const [selectedSoumission, setSelectedSoumission] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    score: 0,
    feedback: '',
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { soumission_id: string; score: number; feedback: string }) =>
      createReview({
        soumission_id: payload.soumission_id,
        score: payload.score,
        feedback: payload.feedback,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soumissions'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review enregistrée');
      setSelectedSoumission(null);
      setReviewForm({ score: 0, feedback: '' });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleReview = (soumissionId: string) => {
    if (reviewForm.score === 0) {
      toast.error('Veuillez attribuer une note');
      return;
    }
    reviewMutation.mutate({
      soumission_id: soumissionId,
      score: reviewForm.score,
      feedback: reviewForm.feedback,
    });
  };

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case 'soumis':
        return { label: 'Soumis', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'en_correction':
        return { label: 'En correction', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'corrige':
        return { label: 'Corrigé', cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' };
      case 'accepte':
        return { label: 'Accepté', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'refuse':
        return { label: 'Refusé', cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
      default:
        return { label: statut, cls: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            Reviews & Évaluations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Projet #{projetId}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {soumissions.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-500">Aucune soumission pour ce projet</p>
            </Card>
          ) : (
            soumissions.map((soumission) => {
              const statutConfig = getStatutConfig(soumission.statut);
              const isSelected = selectedSoumission === soumission.id;

              return (
                <Card
                  key={soumission.id}
                  className={`p-6 space-y-4 transition-all ${
                    isSelected ? 'ring-2 ring-[#FF6B0B]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {soumission.prenom_apprenant} {soumission.nom_apprenant}
                        </p>
                        <Badge variant="outline" className={`${statutConfig.cls} border`}>
                          {statutConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Soumis le {new Date(soumission.date_soumission).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {soumission.score !== undefined && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FF6B0B]/10">
                        <Star className="size-4 text-[#FF6B0B]" />
                        <span className="font-bold text-[#FF6B0B]">{soumission.score}/100</span>
                      </div>
                    )}
                  </div>

                  {soumission.commentaire && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {soumission.commentaire}
                      </p>
                    </div>
                  )}

                  {soumission.fichier_url && (
                    <a
                      href={soumission.fichier_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[#FF6B0B] hover:underline"
                    >
                      <FileText className="size-4" />
                      Voir le fichier
                    </a>
                  )}

                  {soumission.feedback && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                        Feedback du mentor :
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {soumission.feedback}
                      </p>
                    </div>
                  )}

                  {!isSelected ? (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSoumission(soumission.id)}
                      className="w-full border-[#FF6B0B]/30 text-[#FF6B0B] hover:bg-[#FF6B0B]/10"
                    >
                      Évaluer
                    </Button>
                  ) : (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                      <div className="space-y-2">
                        <Label htmlFor="score">Note / 100</Label>
                        <Input
                          id="score"
                          type="number"
                          min={0}
                          max={100}
                          value={reviewForm.score}
                          onChange={(e) =>
                            setReviewForm({ ...reviewForm, score: parseInt(e.target.value) || 0 })
                          }
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="feedback">Feedback</Label>
                        <Textarea
                          id="feedback"
                          value={reviewForm.feedback}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setReviewForm({ ...reviewForm, feedback: e.target.value })
                        }
                          placeholder="Votre feedback détaillé..."
                          rows={4}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedSoumission(null);
                            setReviewForm({ score: 0, feedback: '' });
                          }}
                          className="border-slate-200 dark:border-white/10"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={() => handleReview(soumission.id)}
                          disabled={reviewMutation.isPending}
                          className="bg-[#FF6B0B] hover:bg-[#ff7a24] text-white"
                        >
                          {reviewMutation.isPending ? (
                            <>
                              <Loader2 className="size-4 animate-spin mr-2" />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-4 mr-2" />
                              Enregistrer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
