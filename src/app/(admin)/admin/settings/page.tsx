import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetaConnector } from '@/components/admin/MetaConnector';

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">Configuración</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">Configuración general de la agencia</p>
      </div>
      <div className="flex-1 px-6 py-5 max-w-xl space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-[#1877F2]">
                <span className="text-white text-[10px] font-black leading-none">f</span>
              </span>
              <CardTitle>Conector Meta Ads</CardTitle>
            </div>
          </CardHeader>
          <MetaConnector />
        </Card>

        <Card>
          <CardHeader><CardTitle>Perfil de Agencia</CardTitle></CardHeader>
          <p className="text-sm text-[#6B7280]">Configuración del perfil de agencia próximamente.</p>
        </Card>
        <Card>
          <CardHeader><CardTitle>Programación de Sincronización</CardTitle></CardHeader>
          <p className="text-sm text-[#6B7280]">Configura los intervalos de sincronización automática por cliente.</p>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notificaciones</CardTitle></CardHeader>
          <p className="text-sm text-[#6B7280]">Preferencias de alertas para errores de sincronización y anomalías.</p>
        </Card>
      </div>
    </div>
  );
}
