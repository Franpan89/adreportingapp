/**
 * Debug endpoint — shows exactly what Meta returns for a given ad ID.
 * Usage: GET /api/debug-creative?ad_id=<AD_ID>&client_id=<CLIENT_ID>
 * Remove this route once the image issue is resolved.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveClientMetaCredentials } from '@/lib/supabase/social-snapshots';

const META_API_BASE = 'https://graph.facebook.com/v21.0';

export async function GET(req: NextRequest) {
  const adId      = req.nextUrl.searchParams.get('ad_id');
  const clientId  = req.nextUrl.searchParams.get('client_id');
  if (!adId || !clientId) {
    return NextResponse.json({ error: 'ad_id and client_id are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const creds = await resolveClientMetaCredentials(supabase, clientId, user?.id ?? null);
  if (!creds?.access_token) {
    return NextResponse.json({ error: 'No Meta token found for this client' }, { status: 400 });
  }

  const token = creds.access_token;

  // Step 1: Ad node — get creative id + thumbnail
  const adParams = new URLSearchParams({
    ids:    adId,
    fields: 'id,name,campaign_id,creative{id,thumbnail_url,object_type}',
    access_token: token,
  });
  const adRes  = await fetch(`${META_API_BASE}/?${adParams}`);
  const adJson = await adRes.json();

  // Step 2: Creative node — try thumbnail_url with larger dimensions
  const creativeId = adJson?.[adId]?.creative?.id;
  let creativeNodeJson = null;
  if (creativeId) {
    const crParams = new URLSearchParams({
      ids:              creativeId,
      fields:           'id,name,thumbnail_url,image_url',
      thumbnail_width:  '1080',
      thumbnail_height: '1080',
      access_token:     token,
    });
    const crRes = await fetch(`${META_API_BASE}/?${crParams}`);
    creativeNodeJson = await crRes.json();
  }

  return NextResponse.json({ adJson, creativeNodeJson, creativeId });
}
