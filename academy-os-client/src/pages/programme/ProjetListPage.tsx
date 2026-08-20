import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, FolderGit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjets, createProjet } from '@/services/projetService';
import type { CreateProjetDTO } from '@/modules/programme/types/programme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export const ProjetListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const cohorteFilter = searchParams.get('cohorte_id') || undefined;
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateProjetDTO>({
    cohorte_id: cohorteFilter || '',
    nom: '',
    description: '',
    date_debut: '',
    date_fin_prevue: '',
  });

  const { data: projets = [], isLoading } = useQuery({
    queryKey: ['projets', cohorteFilter, search],
    queryFn: () => getProjets({ cohorte_id: cohorteFilter, search }),
  });

  const createMutation = useMutation({
    mutationFn: createProjet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projets'] });
      toast.success('Projet cree');
      setOpen(false);
      setForm({ cohorte_id: cohorteFilter || '', nom: '', description: '', date_debut: '', date_fin_prevue: '' });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) {
      toast.error('Le nom du projet est requis');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Catalogue de Projets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explorez tous les projets de la plateforme
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="h-10 px-5 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 transition-all"
        >
          <Plus className="size-4 mr-2" />
          Nouveau Projet
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Rechercher un projet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Nom</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Avancement</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Statut</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Date rendu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {projets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      Aucun projet trouve
                    </td>
                  </tr>
                ) : (
                  projets.map((projet) => (
                    <tr
                      key={projet.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projets/${projet.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
                            <FolderGit2 className="size-4 text-[#FF6B0B]" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{projet.nom}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-sm">{projet.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">Progression</span>
                            <span className="text-slate-900 dark:text-white">{projet.progression ?? 0}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${(projet.progression ?? 0) === 100 ? 'bg-emerald-500' : 'bg-[#FF6B0B]'}`}
                              style={{ width: `${projet.progression ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const statut = projet.statut;
                          const config: Record<string, { label: string; cls: string }> = {
                            en_cours: { label: 'En cours', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
                            termine: { label: 'Termine', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
                            en_attente: { label: 'En attente', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
                          };
                          const current = config[statut] || { label: statut, cls: 'bg-slate-100 text-slate-600' };
                          return (
                            <Badge variant="outline" className={`${current.cls} border`}>
                              {current.label}
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {projet.date_fin_prevue ? new Date(projet.date_fin_prevue).toLocaleDateString('fr-FR') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau Projet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du projet</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Plateforme E-learning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description du projet"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_debut">Date de debut</Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_fin_prevue">Date de rendu prevue</Label>
                <Input
                  id="date_fin_prevue"
                  type="date"
                  value={form.date_fin_prevue}
                  onChange={(e) => setForm({ ...form, date_fin_prevue: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[#FF6B0B] hover:bg-[#ff7a24]">
                Creer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
