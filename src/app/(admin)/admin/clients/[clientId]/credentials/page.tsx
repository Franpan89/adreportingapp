import { notFound } from 'next/navigation';
import { getClientById } from '@/lib/supabase/clients';
import CredentialsClient from './_components/CredentialsClient';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function CredentialsPage({ params }: PageProps) {
  const { clientId } = await params;
  const client = await getClientById(clientId);
  if (!client) notFound();

  return (
    <CredentialsClient
      clientId={clientId}
      clientName={client.name}
      channels={client.channels}
      syncStatus={client.sync_status}
    />
  );
}
