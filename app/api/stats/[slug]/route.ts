import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl, getSupabaseAdmin, type LinkRow } from "@/lib/supabase";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function authOk(request: NextRequest) {
  const requiredToken = process.env.SHORTENER_ADMIN_TOKEN?.trim();
  if (!requiredToken) return true;

  const urlToken = request.nextUrl.searchParams.get("token") || "";
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  return urlToken === requiredToken || bearer === requiredToken;
}

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!authOk(request)) return jsonError("Admin key salah atau belum diisi.", 401);

    const { slug: rawSlug } = await context.params;
    const slug = normalizeSlug(rawSlug || "");
    if (!isValidSlug(slug)) return jsonError("Slug tidak valid.");

    const supabase = getSupabaseAdmin();
    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, slug, original_url, created_at, updated_at, clicks, password_hash, expires_at")
      .eq("slug", slug)
      .maybeSingle();

    if (linkError || !link) return jsonError("Link tidak ditemukan.", 404);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: events, error: eventError } = await supabase
      .from("click_events")
      .select("clicked_at, referrer, user_agent")
      .eq("link_id", link.id)
      .gte("clicked_at", since)
      .order("clicked_at", { ascending: false })
      .limit(300);

    if (eventError) return jsonError("Gagal mengambil statistik.", 500);

    const dailyMap = new Map<string, number>();
    for (const event of events || []) {
      const day = String(event.clicked_at).slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
    }

    const topReferrers = new Map<string, number>();
    for (const event of events || []) {
      let ref = "direct / unknown";
      try {
        ref = event.referrer ? new URL(event.referrer).hostname : "direct / unknown";
      } catch {
        ref = "unknown referrer";
      }
      topReferrers.set(ref, (topReferrers.get(ref) || 0) + 1);
    }

    return NextResponse.json({
      slug: link.slug,
      shortUrl: `${getSiteUrl()}/${link.slug}`,
      originalUrl: link.original_url,
      totalClicks: Number(link.clicks || 0),
      hasPassword: Boolean(link.password_hash),
      expiresAt: link.expires_at,
      createdAt: link.created_at,
      recentClicks: events?.length || 0,
      dailyClicks: Array.from(dailyMap.entries()).map(([date, clicks]) => ({ date, clicks })),
      topReferrers: Array.from(topReferrers.entries())
        .map(([referrer, clicks]) => ({ referrer, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)
    });
  } catch (error) {
    console.error(error);
    return jsonError("Server error saat mengambil statistik.", 500);
  }
}
