import type { SupabaseClient } from "@supabase/supabase-js";
import { hashIp } from "@/lib/security";

type LinkForClick = {
  id: number;
  slug: string;
  clicks?: number | null;
};

type HeaderLike = {
  get(name: string): string | null;
};

function limitText(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  return value.slice(0, maxLength);
}

export function clickMetaFromHeaders(headers: HeaderLike) {
  const forwardedFor = headers.get("x-forwarded-for") || "";
  const realIp = headers.get("x-real-ip") || "";
  const ip = forwardedFor.split(",")[0]?.trim() || realIp.trim() || null;

  return {
    referrer: limitText(headers.get("referer"), 500),
    userAgent: limitText(headers.get("user-agent"), 500),
    ipHash: hashIp(ip)
  };
}

export async function registerClick(
  supabase: SupabaseClient,
  link: LinkForClick,
  meta: { referrer?: string | null; userAgent?: string | null; ipHash?: string | null }
) {
  const nextClicks = Number(link.clicks || 0) + 1;

  await Promise.all([
    supabase
      .from("links")
      .update({ clicks: nextClicks, updated_at: new Date().toISOString() })
      .eq("id", link.id),
    supabase.from("click_events").insert({
      link_id: link.id,
      slug: link.slug,
      referrer: meta.referrer || null,
      user_agent: meta.userAgent || null,
      ip_hash: meta.ipHash || null
    })
  ]);
}
