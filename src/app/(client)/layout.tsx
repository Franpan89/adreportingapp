import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/auth';
import { getClientPortalUser } from '@/lib/supabase/client-portal';
import { PortalTopBar } from '@/components/layout/PortalTopBar';

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const portal = await getClientPortalUser(user.id);

  // Non-client users who land here (e.g. admin browsing /dashboard) → back to admin
  if (!portal) redirect('/admin/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <PortalTopBar
        clientName={portal.clientName}
        clientLogoUrl={portal.clientLogoUrl}
        clientId={portal.clientId}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
