import { getClients } from '@/lib/supabase/clients';
import { WhatsAppInbox } from './_components/WhatsAppInbox';

export default async function WhatsAppPage() {
  const clients = await getClients();
  return <WhatsAppInbox clients={clients} />;
}
