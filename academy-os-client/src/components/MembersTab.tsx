import { useCohorteMembers } from "@/hooks/useProgrammes";
import { assignMentor, removeMember } from "@/services/membreService";
import { toast } from "sonner";
import type { BackendEnrollment, BackendTrainerAssignment } from "@/services/membreService";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleBadge } from "@/components/cohortes/Badge";

export function MembersTab({ cohorteId }: { cohorteId: string }) {
  const { students, trainers, loading, error, refetch } = useCohorteMembers(cohorteId);

  const handleAssignMentor = async (enrollmentId: string, mentorId: string) => {
    try {
      await assignMentor(enrollmentId, mentorId || null);
      toast.success("Mentor assigné");
      refetch();
    } catch (err) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(message || "Erreur assignation");
    }
  };

  const handleRemoveMember = async (enrollmentId: string) => {
    try {
      await removeMember(enrollmentId);
      toast.success("Membre supprimé");
      refetch();
    } catch (err) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(message || "Erreur suppression");
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const members = [
    ...students.map((enrollment) => ({ kind: "learner" as const, enrollment })),
    ...trainers.map((assignment) => ({ kind: "trainer" as const, assignment })),
  ];

  const getMemberName = (row: { kind: "learner"; enrollment: BackendEnrollment } | { kind: "trainer"; assignment: BackendTrainerAssignment }) => {
    if (row.kind === "learner") {
      return `${row.enrollment.user.first_name} ${row.enrollment.user.last_name}`;
    }
    return `${row.assignment.user.first_name} ${row.assignment.user.last_name}`;
  };

  const getMemberEmail = (row: { kind: "learner"; enrollment: BackendEnrollment } | { kind: "trainer"; assignment: BackendTrainerAssignment }) => {
    if (row.kind === "learner") {
      return row.enrollment.user.email;
    }
    return row.assignment.user.email;
  };

  const getMemberRole = (row: { kind: "learner"; enrollment: BackendEnrollment } | { kind: "trainer"; assignment: BackendTrainerAssignment }) => {
    if (row.kind === "learner") {
      return "etudiant";
    }
    if (row.assignment.user.role === "admin") {
      return "admin";
    }
    if (row.assignment.user.role === "team_lead") {
      return "lead";
    }
    return "formateur";
  };

  const getMemberId = (row: { kind: "learner"; enrollment: BackendEnrollment } | { kind: "trainer"; assignment: BackendTrainerAssignment }) => {
    if (row.kind === "learner") {
      return row.enrollment.id;
    }
    return row.assignment.id;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Membre</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Email</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Rôle</th>
            {students.length > 0 && trainers.length > 0 && (
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Mentor</th>
            )}
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
          {members.length === 0 ? (
            <tr>
              <td
                colSpan={students.length > 0 && trainers.length > 0 ? 5 : 4}
                className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
              >
                Aucun membre dans cette cohorte
              </td>
            </tr>
          ) : (
            members.map((row) => {
              const role = getMemberRole(row);
              const memberId = getMemberId(row);
              const isLearner = row.kind === "learner";
              const enrollment = isLearner ? row.enrollment : null;
              const currentMentor = enrollment?.mentor;

              return (
                <tr key={memberId} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {getMemberName(row)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {getMemberEmail(row)}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={role} />
                  </td>
                  {students.length > 0 && trainers.length > 0 && (
                    <td className="px-4 py-3">
                      {isLearner ? (
                        <Select
                          value={currentMentor || "none"}
                          onValueChange={(value) =>
                            handleAssignMentor(
                              enrollment!.id,
                              value === "none" ? "" : value
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue placeholder="Assigner un mentor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs">
                              Aucun mentor
                            </SelectItem>
                            {trainers.map((trainer) => (
                              <SelectItem key={trainer.id} value={trainer.id} className="text-xs">
                                {trainer.user.first_name} {trainer.user.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(memberId)}
                      className="h-8 text-xs"
                    >
                      Supprimer
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
