'use client';
import { useState } from 'react';
import { LogoUpload } from '@/components/ui/LogoUpload';

interface ClientLogoEditProps {
  clientId: string;
  initialUrl: string | null;
}

export function ClientLogoEdit({ clientId, initialUrl }: ClientLogoEditProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialUrl);

  async function handleChange(url: string) {
    const next = url || null;
    setLogoUrl(next);
    await fetch(`/api/clients/${clientId}/logo`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: next }),
    });
  }

  return (
    <LogoUpload
      currentUrl={logoUrl}
      folder={`clients/${clientId}`}
      label="Logo del cliente"
      size="sm"
      onSuccess={handleChange}
    />
  );
}
