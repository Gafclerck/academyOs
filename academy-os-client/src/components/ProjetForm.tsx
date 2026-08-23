/**
 * ProjetForm — Formulaire de création / édition de projet
 *
 * Utilise les mutations useCreateProjet / useUpdateProjet de useProjets.ts
 * Champs : name, description, cohorte, deadline
 */

import React, { useState } from 'react';
import { Loader2, Save, Plus } from 'lucide-react';
import { useCreateProjet, useUpdateProjet } from '@/hooks/useProjets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BackendProject } from '@/types/projet';

interface ProjetFormProps {
  mode: 'create' | 'edit';
  projet?: BackendProject;
  onSuccess: () => void;
}

export const ProjetForm: React.FC<ProjetFormProps> = ({ mode, projet, onSuccess }) => {
  const createMutation = useCreateProjet();
  const updateMutation = useUpdateProjet();

  const [form, setForm] = useState({
    name: projet?.name ?? '',
    description: projet?.description ?? '',
    cohorte: projet?.cohorte?.toString() ?? '',
    deadline: projet?.deadline ?? '',
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) return;

    if (mode === 'create') {
      createMutation.mutate(
        {
          name: form.name.trim(),
          description: form.description.trim(),
          cohorte: Number(form.cohorte),
          deadline: form.deadline,
        },
        { onSuccess },
      );
    } else if (projet) {
      updateMutation.mutate(
        {
          id: projet.id,
          payload: {
            name: form.name.trim(),
            description: form.description.trim(),
            cohorte: Number(form.cohorte),
            deadline: form.deadline,
          },
        },
        { onSuccess },
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du projet *</Label>
        <Input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Ex : Plateforme E-learning Xarala"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Décrivez le projet, les objectifs, les technologies..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cohorte">ID Cohorte *</Label>
          <Input
            id="cohorte"
            name="cohorte"
            type="number"
            value={form.cohorte}
            onChange={handleChange}
            placeholder="Ex : 1"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline *</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/10">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#FF6B0B] hover:bg-[#ff7a24] text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              {mode === 'create' ? 'Création...' : 'Enregistrement...'}
            </>
          ) : (
            <>
              {mode === 'create' ? (
                <Plus className="size-4 mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              {mode === 'create' ? 'Créer le projet' : 'Enregistrer'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
