import { useState } from "react";
import { inviteStudents, type MemberBatchResult } from "@/services/membreService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function InviterApprenant({ cohorteId, onClose, onSuccess }: { cohorteId: string; onClose: () => void; onSuccess: () => void }) {
  const [emails, setEmails] = useState("");
  const [results, setResults] = useState<MemberBatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    const emailList = emails.split(/[\n,]/).map(e => e.trim()).filter(Boolean);
    if (!emailList.length) return;

    setLoading(true);
    try {
      const res = await inviteStudents(cohorteId, emailList);
      setResults(res);
      toast.success("Invitations envoyées");
      onSuccess();
    } catch (err) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(message || "Erreur d'invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="collez les emails, un par ligne"
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        rows={6}
      />
      <div className="flex gap-2">
        <Button onClick={handleInvite} disabled={loading}>
          {loading ? "Envoi..." : "Inviter les apprenants"}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Fermer
        </Button>
      </div>

      {results.length > 0 && (
        <table className="w-full text-sm">
          <tbody>
            {results.map((r) => (
              <tr key={r.email} className={r.status === "error" ? "text-red-500" : "text-green-500"}>
                <td className="py-1">{r.email}</td>
                <td className="py-1">{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
