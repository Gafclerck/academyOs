import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { getMembresByCohorte, addMembreToCohorte, removeMembreFromCohorte, updateMembreRole } from '@/services/membreService';
import type { Membre } from '@/modules/programme/types/programme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface MembreManagementProps {
  cohorteId: string;
  rentreeId: string;
}

export const MembreManagement: React.FC<MembreManagementProps> = ({ cohorteId, rentreeId }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'etudiant' as 'etudiant' | 'mentor' | 'lead' | 'admin' });

  const { data: membres = [] } = useQuery({
    queryKey: ['membres', cohorteId],
    queryFn: () => getMembresByCohorte(cohorteId),
    enabled: !!cohorteId,
  });

  const addMutation = useMutation({
    mutationFn: () => addMembreToCohorte(cohorteId, { cohorte_id: cohorteId, rentree_id: rentreeId, ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membres', cohorteId] });
      toast.success('Membre ajoute');
      setOpen(false);
      setForm({ nom: '', prenom: '', email: '', role: 'etudiant' });
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (membreId: string) => removeMembreFromCohorte(cohorteId, membreId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membres', cohorteId] });
      toast.success('Membre retire');
    },
    onError: (err) => toast.error(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ membreId, role }: { membreId: string; role: 'etudiant' | 'mentor' | 'lead' | 'admin' }) =>
      updateMembreRole(cohorteId, membreId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membres', cohorteId] });
      toast.success('Role mis a jour');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    addMutation.mutate();
  };

  const roleLabels: Record<string, string> = {
    etudiant: 'Etudiant',
    mentor: 'Mentor',
    lead: 'Team Lead',
    admin: 'Admin',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Membres ({membres.length})</h3>
        <Button
          onClick={() => setOpen(true)}
          className="h-9 px-4 rounded-lg bg-[#FF6B0B] hover:bg-[#ff7a24] text-white text-sm font-semibold"
        >
          <Plus className="size-4 mr-1.5" />
          Ajouter
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Membre</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Email</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Role</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {membres.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Aucun membre dans cette cohorte
                </td>
              </tr>
              ) : (
                membres.map((membre: Membre) => (
                <tr key={membre.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-gradient-to-br from-[#FF6B0B] to-[#FF8C38] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {membre.avatar || `${membre.prenom[0]}${membre.nom[0]}`}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {membre.prenom} {membre.nom}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{membre.email}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={membre.role}
                      onValueChange={(role: 'etudiant' | 'mentor' | 'lead' | 'admin') => roleMutation.mutate({ membreId: membre.id, role })}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutation.mutate(membre.id)}
                      disabled={removeMutation.isPending}
                      className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prenom</Label>
              <Input
                id="prenom"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                placeholder="Prenom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={form.role} onValueChange={(role: 'etudiant' | 'mentor' | 'lead' | 'admin') => setForm({ ...form, role })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="etudiant">Etudiant</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="lead">Team Lead</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={addMutation.isPending} className="bg-[#FF6B0B] hover:bg-[#ff7a24]">
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
