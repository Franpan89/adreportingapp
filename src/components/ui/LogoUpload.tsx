'use client';
import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface LogoUploadProps {
  /** Current logo URL (shown as preview). */
  currentUrl: string | null;
  /** Storage sub-folder, e.g. 'agency' or 'clients/abc123'. */
  folder: string;
  /** Called with the new public URL after a successful upload. */
  onSuccess: (url: string) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export function LogoUpload({
  currentUrl,
  folder,
  onSuccess,
  label = 'Logo',
  size = 'md',
}: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dim = size === 'sm' ? 'w-16 h-16' : 'w-24 h-24';

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch('/api/upload/logo', { method: 'POST', body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Error al subir');
      setPreview(json.url);
      onSuccess(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir');
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label && <p className="text-xs font-medium text-[#374151] mb-2">{label}</p>}
      <div className="flex items-center gap-4">
        {/* Preview box */}
        <div
          className={`${dim} rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-center overflow-hidden relative flex-shrink-0 cursor-pointer hover:border-[#00BD7D] transition-colors`}
          onClick={() => inputRef.current?.click()}
          title="Haz clic para cambiar"
        >
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#00BD7D] animate-spin" />
            </div>
          )}
          {preview ? (
            <img
              src={preview}
              alt="Logo"
              className="w-full h-full object-contain p-1"
              onError={() => setPreview(null)}
            />
          ) : (
            <Upload className="w-5 h-5 text-[#D1D5DB]" />
          )}
        </div>

        {/* Actions */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[#374151] bg-white hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {preview ? 'Cambiar' : 'Subir logo'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => { setPreview(null); onSuccess(''); }}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#DC2626] disabled:opacity-50 transition-colors px-1"
            >
              <X className="w-3 h-3" /> Quitar
            </button>
          )}
          <p className="text-[11px] text-[#9CA3AF]">PNG, JPG, SVG · máx. 2 MB</p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-[#DC2626]">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
