import { ClientSidebar } from '@/components/layout/ClientSidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <ClientSidebar
        clientName="Luxe Cosmetics"
        channels={['meta', 'google', 'tiktok']}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
