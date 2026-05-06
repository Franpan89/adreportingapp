import { NextResponse } from 'next/server';
import { createReport, updateReportContent } from '@/lib/supabase/reports';
import { createClient as createSupabase } from '@/lib/supabase/server';
import { generateReportContent } from '@/lib/reports/generate';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { client_id, title, period_start, period_end } = body ?? {};

    if (!client_id || !title || !period_start || !period_end) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const supabase = await createSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch logos + agency branding silently.
    const [clientRow, settingsRow] = await Promise.all([
      supabase.from('cr_clients').select('logo_url, name').eq('id', client_id).single().then(r => r, () => ({ data: null })),
      user
        ? supabase.from('cr_agency_settings').select('logo_url, agency_name, primary_color').eq('admin_user_id', user.id).single().then(r => r, () => ({ data: null }))
        : Promise.resolve({ data: null }),
    ]);

    type ClientData  = { logo_url?: string; name?: string } | null;
    type AgencyData  = { logo_url?: string; agency_name?: string; primary_color?: string } | null;
    const clientData = clientRow.data  as ClientData;
    const agencyData = settingsRow.data as AgencyData;

    const report = await createReport({
      client_id:       String(client_id),
      title:           String(title),
      period_start:    String(period_start),
      period_end:      String(period_end),
      client_logo_url: clientData?.logo_url   ?? null,
      agency_logo_url: agencyData?.logo_url   ?? null,
      agency_name:     agencyData?.agency_name ?? null,
      accent_color:    agencyData?.primary_color ?? '#00BD7D',
    });

    // Generate AI content (metrics + OpenRouter narrative) and update the row.
    try {
      const content = await generateReportContent(supabase, String(client_id), period_start, period_end);
      await updateReportContent(report.id, {
        executive_summary: content.executive_summary,
        recommendations:   content.recommendations,
        spend_vs_results:  content.spend_vs_results,
        top_creatives:     content.top_creatives,
        audiences:         content.audiences,
        social_growth:     [],
        period_totals:     content.period_totals,
        agency_name:       agencyData?.agency_name ?? null,
        accent_color:      agencyData?.primary_color ?? '#00BD7D',
      });
      Object.assign(report, content, {
        social_growth: [],
        agency_name:   agencyData?.agency_name  ?? null,
        accent_color:  agencyData?.primary_color ?? '#00BD7D',
      });
    } catch (genErr) {
      console.error('[client-reports] content generation failed:', genErr);
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al generar el reporte' },
      { status: 500 },
    );
  }
}
