import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">Settings</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">Agency-wide configuration</p>
      </div>
      <div className="flex-1 px-6 py-5 max-w-xl space-y-4">
        <Card>
          <CardHeader><CardTitle>Agency Profile</CardTitle></CardHeader>
          <p className="text-sm text-[#6B7280]">Agency profile settings coming soon.</p>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sync Schedule</CardTitle></CardHeader>
          <p className="text-sm text-[#6B7280]">Configure automatic sync intervals per client.</p>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <p className="text-sm text-[#6B7280]">Alert preferences for sync errors and anomalies.</p>
        </Card>
      </div>
    </div>
  );
}
