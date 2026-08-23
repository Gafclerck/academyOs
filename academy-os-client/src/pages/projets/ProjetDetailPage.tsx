import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Pencil,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useProjet, useUpdateTask, useCreateTask } from '@/hooks/useProjets';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { TaskStatus } from '@/types/projet';
import { UploadLivrable } from '@/components/UploadLivrable';

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: {
    label: 'Brouillon',
    cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
  active: {
    label: 'Actif',
    cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  done: {
    label: 'Terminé',
    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
};

const taskStatusConfig: Record<TaskStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  todo: {
    label: 'À faire',
    icon: <Circle className="size-4 text-slate-400" />,
    cls: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400',
  },
  doing: {
    label: 'En cours',
    icon: <Loader2 className="size-4 text-blue-500 animate-spin" />,
    cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  done: {
    label: 'Terminée',
    icon: <CheckCircle2 className="size-4 text-emerald-500" />,
    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
};

const TASK_STATUS_CYCLE: TaskStatus[] = ['todo', 'doing', 'done'];

export const ProjetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projetId = id ? Number(id) : undefined;

  const { data: projet, isLoading, error } = useProjet(projetId);
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

  const handleCycleTaskStatus = (taskId: number, currentStatus: TaskStatus) => {
    if (!projetId) return;
    const currentIndex = TASK_STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = TASK_STATUS_CYCLE[(currentIndex + 1) % TASK_STATUS_CYCLE.length];
    updateTaskMutation.mutate({
      taskId,
      payload: { status: nextStatus },
      projectId: projetId,
    });
  };

  const handleAddTask = () => {
    if (!projetId || !newTaskTitle.trim()) {
      toast.error('Veuillez saisir un titre de tâche');
      return;
    }
    createTaskMutation.mutate(
      {
        projectId: projetId,
        payload: { title: newTaskTitle.trim() },
      },
      {
        onSuccess: () => {
          setNewTaskTitle('');
          setShowTaskInput(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
        <div className="h-48 bg-slate-200 dark:bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 p-6 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <AlertCircle className="size-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : 'Impossible de charger le projet.'}
          </p>
        </div>
        <Button onClick={() => navigate('/projets')} variant="outline">
          <ArrowLeft className="size-4 mr-2" />
          Retour aux projets
        </Button>
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">Projet introuvable</p>
        <Button onClick={() => navigate('/projets')} variant="outline">
          <ArrowLeft className="size-4 mr-2" />
          Retour aux projets
        </Button>
      </div>
    );
  }

  const currentStatut = statusConfig[projet.status] ?? {
    label: projet.status,
    cls: 'bg-slate-100 text-slate-600',
  };
  const tasks = projet.tasks ?? [];
  const deliverables = projet.deliverables ?? [];
  const tasksDone = tasks.filter((t) => t.status === 'done').length;
  const progression = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/projets')}
          className="size-9 rounded-xl border-slate-200 dark:border-white/10"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {projet.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cohorte #{projet.cohorte}
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10 px-5 rounded-xl border-slate-200 dark:border-white/10 font-semibold"
        >
          <Pencil className="size-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Statut
          </p>
          <Badge variant="outline" className={`${currentStatut.cls} border`}>
            {currentStatut.label}
          </Badge>
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Avancement
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{progression}%</p>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${progression === 100 ? 'bg-emerald-500' : 'bg-[#FF6B0B]'}`}
              style={{ width: `${progression}%` }}
            />
          </div>
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Deadline
          </p>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-[#FF6B0B]" />
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {projet.deadline
                ? new Date(projet.deadline).toLocaleDateString('fr-FR')
                : '-'}
            </span>
          </div>
        </Card>
      </div>

      {/* ── Description ────────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Description</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {projet.description}
        </p>
      </Card>

      {/* ── Tâches ─────────────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Tâches ({tasksDone}/{tasks.length})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTaskInput(!showTaskInput)}
            className="border-[#FF6B0B]/30 text-[#FF6B0B] hover:bg-[#FF6B0B]/10"
          >
            <Plus className="size-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {showTaskInput && (
          <div className="flex items-center gap-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Titre de la tâche..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
              }}
            />
            <Button
              onClick={handleAddTask}
              disabled={createTaskMutation.isPending}
              className="bg-[#FF6B0B] hover:bg-[#ff7a24] text-white"
            >
              {createTaskMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Créer'
              )}
            </Button>
          </div>
        )}

        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Aucune tâche pour ce projet</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const cfg = taskStatusConfig[task.status];
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleCycleTaskStatus(task.id, task.status)}
                  disabled={updateTaskMutation.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  {cfg.icon}
                  <span
                    className={`flex-1 text-sm font-medium ${
                      task.status === 'done'
                        ? 'line-through text-slate-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                  <Badge variant="outline" className={`${cfg.cls} border text-xs`}>
                    {cfg.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Livrables ──────────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Livrables ({deliverables.length})
        </h2>

        {deliverables.length > 0 && (
          <div className="space-y-2">
            {deliverables.map((d) => (
              <a
                key={d.id}
                href={d.file}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <FileText className="size-4 text-[#FF6B0B] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {d.file.split('/').pop() ?? 'Fichier'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Uploadé le {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        <UploadLivrable projectId={projet.id} />
      </Card>
    </div>
  );
};
