import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Award, Search } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCertificatsByCohorte, downloadCertificat } from '@/services/certificats/certificatService';
import type { Certificat } from '@/types/programme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CertificatListPage: React.FC = () => {
  const { cohorteId } = useParams<{ cohorteId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');

  const { data: certificats = [] } = useQuery({
    queryKey: ['certificats', cohorteId],
    queryFn: () => getCertificatsByCohorte(cohorteId || ''),
    enabled: !!cohorteId,
  });

  const downloadMutation = useMutation({
    mutationFn: (certificatId: string) => downloadCertificat(certificatId),
    onSuccess: (blob: Blob, certificatId: string) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificat-${certificatId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Téléchargement lancé');
    },
    onError: () => {
      toast.error('Erreur lors du téléchargement');
    },
  });

  const filteredCertificats = certificats.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nom_apprenant.toLowerCase().includes(q) ||
      c.prenom_apprenant.toLowerCase().includes(q) ||
      (c.nom_projet && c.nom_projet.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Certificats
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Cohorte #{cohorteId}
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Rechercher un certificat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Apprenant</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Projet</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Score</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {filteredCertificats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Aucun certificat trouve
                  </td>
                </tr>
              ) : (
                filteredCertificats.map((cert: Certificat) => (
                  <tr key={cert.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
                          <Award className="size-4 text-[#FF6B0B]" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {cert.prenom_apprenant} {cert.nom_apprenant}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {cert.nom_projet || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {cert.score ? (
                        <Badge variant="outline" className="border-[#FF6B0B]/30 text-[#FF6B0B]">
                          {cert.score}/100
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(cert.date_obtention).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadMutation.mutate(cert.id)}
                        disabled={downloadMutation.isPending}
                        className="h-8 px-3 rounded-lg border-slate-200 dark:border-white/10 font-semibold text-xs"
                      >
                        <Download className="size-3.5 mr-1.5" />
                        Telecharger
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default CertificatListPage;
