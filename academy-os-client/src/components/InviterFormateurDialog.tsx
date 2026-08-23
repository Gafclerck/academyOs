import { useState } from "react";
import { inviteTrainers, type MemberBatchResult } from "@/services/membreService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  cohorteId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviterFormateurDialog({ cohorteId, open, onClose, onSuccess }: Props) {
  const [emails, setEmails] = useState("");
  const [results, setResults] = useState<MemberBatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    const emailList = emails.split(/[\n,]/).map(e => e.trim()).filter(Boolean);
    if (!emailList.length) return;

    setLoading(true);
    try {
      const res = await inviteTrainers(cohorteId, emailList);
      setResults(res);
      toast.success(`${res.filter(r => r.status === 'success').length} formateurs invités`);
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter des Formateurs</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="collez les emails, un par ligne"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          rows={6}
        />
        <Button onClick={handleInvite} disabled={loading}>
          {loading ? "Envoi..." : "Envoyer les invitations"}
        </Button>

        {results.length > 0 && (
          <div className="max-h-40 overflow-y-auto mt-4">
            <table className="w-full text-sm">
              <tbody>
                {results.map((r) => (
                  <tr key={r.email} className={r.status === 'error' ? 'text-red-500' : 'text-green-600'}>
                    <td className="pr-2">{r.email}</td>
                    <td>{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
