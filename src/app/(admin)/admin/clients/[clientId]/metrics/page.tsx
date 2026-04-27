import { notFound } from 'next/navigation';
import { getClientById } from '@/lib/supabase/clients';
import MetricsClient from './_components/MetricsClient';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function MetricsConfigPage({ params }: PageProps) {
  const { clientId } = await params;
  const client = await getClientById(clientId);
  if (!client) notFound();

  return <MetricsClient clientId={clientId} clientName={client.name} />;
}
