import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { getAuthUser } from '@/lib/supabase/auth';
import { getLicenseByAgencyUserId } from '@/lib/supabase/licenses';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  const license = user ? await getLicenseByAgencyUserId(user.id) : null;
  const storyEngineEnabled = license?.addons?.story_engine === true;

  return (
    <div className="neu flex min-h-screen">
      <AdminSidebar storyEngineEnabled={storyEngineEnabled} />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
