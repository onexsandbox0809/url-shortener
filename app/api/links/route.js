import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mobile = searchParams.get('mobile');

  let query = supabase.from('links').select('*').order('created_at', { ascending: false });
  if (mobile) {
    query = query.ilike('mobile_number', `%${mobile}%`);
  }

  const { data: links, error: linksError } = await query;
  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 });
  }

  const linkIds = (links || []).map((l) => l.id);
  let clicks = [];
  if (linkIds.length) {
    const { data: clickRows, error: clicksError } = await supabase
      .from('clicks')
      .select('*')
      .in('link_id', linkIds)
      .order('clicked_at', { ascending: false });
    if (clicksError) {
      return NextResponse.json({ error: clicksError.message }, { status: 500 });
    }
    clicks = clickRows || [];
  }

  const clicksByLink = {};
  for (const c of clicks) {
    (clicksByLink[c.link_id] ||= []).push(c);
  }

  const result = (links || []).map((link) => {
    const linkClicks = clicksByLink[link.id] || [];
    return {
      ...link,
      total_clicks: linkClicks.length,
      unique_ips: new Set(linkClicks.map((c) => c.ip)).size,
      last_clicked_at: linkClicks[0]?.clicked_at || null,
      clicks: linkClicks,
    };
  });

  return NextResponse.json({ links: result });
}
