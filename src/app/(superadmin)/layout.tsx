import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SuperAdminSidebar } from '@/components/superadmin/SuperAdminSidebar';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  // Demo mode guard — verifica el cookie demo_role seteado al hacer login
  const cookieStore = await cookies();
  const demoRole = cookieStore.get('demo_role')?.value;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const isDemo = !supabaseUrl || supabaseUrl.includes('placeholder');

  if (isDemo && demoRole !== 'super_admin') {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <SuperAdminSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
