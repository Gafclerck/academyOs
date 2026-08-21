import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, UserPlus } from 'lucide-react';
import {
  getEnrollments,
  getTrainerAssignments,
  addLearners,
  addTrainers,
  assignMentor,
} from '@/services/membreService';
import type { BackendEnrollment, BackendTrainerAssignment } from '@/modules/programme/types/programme';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { RoleBadge } from '@/components/cohortes/Badge';
import { toast } from 'sonner';

interface MembreManagementProps {
  cohorteId: string;
  rentreeId: string;
}

type MemberRow =
  | { kind: 'learner'; enrollment: BackendEnrollment }
  | { kind: 'trainer'; assignment: BackendTrainerAssignment };

export const MembreManagement: React.FC<MembreManagementProps> = ({ cohorteId, rentreeId: _rentreeId }) => {
  const queryClient = useQueryClient();
  const [addType, setAddType] = useState<'learner' | 'trainer' | null>(null);
  const [emails, setEmails] = useState('');
  const [results, setResults] = useState<{ email: string; status: string; detail: string }[]>([]);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', cohorteId],
    queryFn: () => getEnrollments(cohorteId),
    enabled: !!cohorteId,
  });

  const { data: trainers = [] } = useQuery({
    queryKey: ['trainer-assignments', cohorteId],
    queryFn: () => getTrainerAssignments(cohorteId),
    enabled: !!cohorteId,
  });

  const members: MemberRow[] = [
    ...enrollments.map((e) => ({ kind: 'learner' as const, enrollment: e })),
    ...trainers.map((t) => ({ kind: 'trainer' as const, assignment: t })),
  ];

  const addMutation = useMutation({
    mutationFn: async () => {
      const lines = emails
        .split(/[\n,]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);
      if (lines.length === 0) {
        throw new Error('Veuillez saisir au moins un email.');
      }
      if (addType === 'learner') {
        return addLearners(cohorteId, lines);
      }
      return addTrainers(cohorteId, lines);
    },
    onSuccess: (data) => {
      setResults(data.results);
      queryClient.invalidateQueries({ queryKey: ['enrollments', cohorteId] });
      queryClient.invalidateQueries({ queryKey: ['trainer-assignments', cohorteId] });
      const failed = data.results.filter((r) => !['enrolled', 'assigned'].includes(r.status));
      if (failed.length === 0) {
        toast.success('Membres ajoutés avec succès');
      } else {
        toast.error(`${failed.length} email(s) en erreur`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const mentorMutation = useMutation({
    mutationFn: ({ enrollmentId, mentorId }: { enrollmentId: string; mentorId: string | null }) =>
      assignMentor(cohorteId, enrollmentId, mentorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', cohorteId] });
      toast.success('Mentor assigné');
    },
    onError: (err) => toast.error(err.message),
  });

  const closeDialog = () => {
    setAddType(null);
    setEmails('');
    setResults([]);
  };

  const getMemberName = (row: MemberRow) => {
    if (row.kind === 'learner') {
      return `${row.enrollment.user.first_name} ${row.enrollment.user.last_name}`;
    }
    return `${row.assignment.user.first_name} ${row.assignment.user.last_name}`;
  };

  const getMemberEmail = (row: MemberRow) => {
    if (row.kind === 'learner') return row.enrollment.user.email;
    return row.assignment.user.email;
  };

  const getMemberRole = (row: MemberRow): 'etudiant' | 'formateur' | 'admin' | 'lead' => {
    if (row.kind === 'learner') return 'etudiant';
    if (row.assignment.user.role === 'admin') return 'admin';
    if (row.assignment.user.role === 'organizer') return 'lead';
    return 'formateur';
  };

  const getMemberId = (row: MemberRow) => {
    if (row.kind === 'learner') return row.enrollment.id;
    return row.assignment.id;
  };

  const getInitials = (row: MemberRow) => {
    const name = getMemberName(row);
    const parts = name.split(' ');
    return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Membres ({members.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => { setAddType('trainer'); setResults([]); }}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            <GraduationCap className="size-4 mr-1.5" />
            Ajouter formateur
          </Button>
          <Button
            onClick={() => { setAddType('learner'); setResults([]); }}
            className="h-9 px-4 rounded-lg bg-[#FF6B0B] hover:bg-[#ff7a24] text-white text-sm font-semibold"
          >
            <UserPlus className="size-4 mr-1.5" />
            Ajouter apprenant
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Membre</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Email</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Role</th>
              {enrollments.length > 0 && trainers.length > 0 && (
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Mentor</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Aucun membre dans cette cohorte
                </td>
              </tr>
            ) : (
              members.map((row) => {
                const role = getMemberRole(row);
                const memberId = getMemberId(row);
                const isLearner = row.kind === 'learner';
                const enrollment = isLearner ? row.enrollment : null;
                const currentMentor = enrollment?.mentor;

                return (
                  <tr key={memberId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-[#FF6B0B] to-[#FF8C38] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(row)}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {getMemberName(row)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{getMemberEmail(row)}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={role} />
                    </td>
                    {enrollments.length > 0 && trainers.length > 0 && (
                      <td className="px-4 py-3">
                        {isLearner ? (
                          <Select
                            value={currentMentor?.id || 'none'}
                            onValueChange={(val) =>
                              mentorMutation.mutate({
                                enrollmentId: enrollment!.id,
                                mentorId: val === 'none' ? null : val,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-40 text-xs">
                              <SelectValue placeholder="Assigner un mentor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs">
                                Aucun mentor
                              </SelectItem>
                              {trainers.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="text-xs">
                                  {t.user.first_name} {t.user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={addType !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addType === 'learner' ? 'Ajouter des apprenants' : 'Ajouter des formateurs'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emails">
                Emails {addType === 'learner' ? 'des apprenants' : 'des formateurs'}
              </Label>
              <Textarea
                id="emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="email1@exemple.com&#10;email2@exemple.com&#10;..."
                rows={6}
                className="rounded-xl"
              />
              <p className="text-xs text-slate-500">
                Un email par ligne. Les comptes doivent déjà exister et avoir le rôle approprié.
              </p>
            </div>

            {results.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 p-3">
                {results.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-700 dark:text-slate-300">{r.email}</span>
                    <span
                      className={
                        ['enrolled', 'assigned'].includes(r.status)
                          ? 'text-emerald-600 font-semibold'
                          : 'text-red-600 font-semibold'
                      }
                    >
                      {r.detail}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Fermer
            </Button>
            <Button
              type="button"
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending}
              className={addType === 'learner' ? 'bg-[#FF6B0B] hover:bg-[#ff7a24]' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {addMutation.isPending ? 'Ajout en cours...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
