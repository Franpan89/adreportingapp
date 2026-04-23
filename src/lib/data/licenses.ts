import type { Plan, PlanId, License, LicenseStatus } from '@/types';

/* =====================================================
   Planes disponibles
   ===================================================== */
export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price_monthly: 99,
    max_clients: 1,
    max_channels: 2,
    color: '#6366F1',
    features: [
      '1 cliente',
      'Hasta 2 canales',
      'Reportes básicos',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price_monthly: 299,
    max_clients: 5,
    max_channels: 3,
    color: '#7C3AED',
    features: [
      'Hasta 5 clientes',
      'Todos los canales',
      'Comparación de períodos',
      'Config. de métricas',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 599,
    max_clients: null,
    max_channels: 3,
    color: '#4F46E5',
    features: [
      'Clientes ilimitados',
      'Todos los canales',
      'White-label (próximo)',
      'API access (próximo)',
      'Soporte dedicado',
    ],
  },
];

/* =====================================================
   Licencias mock
   ===================================================== */
export const MOCK_LICENSES: License[] = [
  {
    id: 'lic-001',
    agency_id: 'ag-001',
    agency_name: 'Agencia Digital Norte',
    agency_email: 'admin@digitalnorte.com',
    plan_id: 'pro',
    status: 'active',
    created_at: '2025-11-15T10:00:00Z',
    expires_at: '2026-11-15T23:59:59Z',
    activated_at: '2025-11-16T09:00:00Z',
    notes: 'Cliente referido por Pancho.',
    clients_count: 3,
    temp_password: null,
  },
  {
    id: 'lic-002',
    agency_id: 'ag-002',
    agency_name: 'MediaFlow Agency',
    agency_email: 'hola@mediaflow.mx',
    plan_id: 'starter',
    status: 'trial',
    created_at: '2026-04-01T14:30:00Z',
    expires_at: '2026-05-01T23:59:59Z',
    activated_at: '2026-04-01T14:31:00Z',
    notes: '30 días de prueba gratuita.',
    clients_count: 0,
    temp_password: null,
  },
  {
    id: 'lic-003',
    agency_id: 'ag-003',
    agency_name: 'Pixel & Co.',
    agency_email: 'ops@pixelco.agency',
    plan_id: 'enterprise',
    status: 'active',
    created_at: '2025-08-01T08:00:00Z',
    expires_at: null,
    activated_at: '2025-08-02T11:00:00Z',
    notes: null,
    clients_count: 8,
    temp_password: null,
  },
  {
    id: 'lic-004',
    agency_id: 'ag-004',
    agency_name: 'Click Studio SRL',
    agency_email: 'contacto@clickstudio.ar',
    plan_id: 'starter',
    status: 'expired',
    created_at: '2024-11-10T09:00:00Z',
    expires_at: '2025-01-10T23:59:59Z',
    activated_at: '2024-11-12T10:00:00Z',
    notes: 'No renovó. Contactar para reactivar.',
    clients_count: 1,
    temp_password: null,
  },
  {
    id: 'lic-005',
    agency_id: 'ag-005',
    agency_name: 'Boost Media Group',
    agency_email: 'tech@boostmedia.co',
    plan_id: 'pro',
    status: 'suspended',
    created_at: '2025-06-20T12:00:00Z',
    expires_at: '2026-06-20T23:59:59Z',
    activated_at: '2025-06-21T08:00:00Z',
    notes: 'Suspendida por falta de pago mes de marzo.',
    clients_count: 2,
    temp_password: null,
  },
];

/* =====================================================
   Helpers
   ===================================================== */
export function getPlanById(id: PlanId): Plan {
  return PLANS.find(p => p.id === id) ?? PLANS[0];
}

export function getMRR(): number {
  return MOCK_LICENSES
    .filter(l => l.status === 'active' || l.status === 'trial')
    .reduce((acc, l) => acc + getPlanById(l.plan_id).price_monthly, 0);
}

export function getLicensesByStatus(status: LicenseStatus): License[] {
  return MOCK_LICENSES.filter(l => l.status === status);
}

export function getExpiringLicenses(withinDays: number, referenceDate = new Date()): License[] {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() + withinDays);
  return MOCK_LICENSES.filter(l => {
    if (!l.expires_at || l.status !== 'active') return false;
    const exp = new Date(l.expires_at);
    return exp >= referenceDate && exp <= cutoff;
  });
}

export function getRecentLicenses(count: number): License[] {
  return [...MOCK_LICENSES]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, count);
}

// Datos mensuales mock para el gráfico de nuevas licencias (últimos 6 meses)
export const MONTHLY_NEW_LICENSES = [
  { mes: 'Nov', cantidad: 2 },
  { mes: 'Dic', cantidad: 1 },
  { mes: 'Ene', cantidad: 3 },
  { mes: 'Feb', cantidad: 1 },
  { mes: 'Mar', cantidad: 2 },
  { mes: 'Abr', cantidad: 1 },
];
