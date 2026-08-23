/**
 * UploadLivrable — Composant d'upload de fichier livrable
 *
 * Utilise FormData + multipart/form-data via useUploadDeliverable()
 */

import React, { useRef, useState } from 'react';
import { Upload, Loader2, FileUp } from 'lucide-react';
import { useUploadDeliverable } from '@/hooks/useProjets';
import { Button } from '@/components/ui/button';

interface UploadLivrableProps {
  projectId: number;
  onSuccess?: () => void;
}

export const UploadLivrable: React.FC<UploadLivrableProps> = ({ projectId, onSuccess }) => {
  const uploadMutation = useUploadDeliverable();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    uploadMutation.mutate(
      { projectId, file: selectedFile },
      {
        onSuccess: () => {
          setSelectedFile(null);
          if (inputRef.current) inputRef.current.value = '';
          onSuccess?.();
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#FF6B0B]/50 hover:bg-[#FF6B0B]/5 transition-colors cursor-pointer"
      >
        <Upload className="size-6 text-slate-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier'}
        </p>
        {selectedFile && (
          <p className="text-xs text-slate-400">
            {(selectedFile.size / 1024).toFixed(1)} Ko
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />
      </div>

      {selectedFile && (
        <Button
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
          className="w-full bg-[#FF6B0B] hover:bg-[#ff7a24] text-white"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Upload en cours...
            </>
          ) : (
            <>
              <FileUp className="size-4 mr-2" />
              Uploader le livrable
            </>
          )}
        </Button>
      )}
    </div>
  );
};
