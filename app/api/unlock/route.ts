import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, type LinkRow } from "@/lib/supabase";
import { clickMetaFromHeaders, registerClick } from "@/lib/clicks";
import { comparePassword } from "@/lib/security";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isExpired(expiresAt?: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const slug = normalizeSlug(String(body?.slug || ""));
    const password = String(body?.password || "");

    if (!isValidSlug(slug)) return jsonError("Slug tidak valid.");
    if (!password) return jsonError("Password wajib diisi.");

    const supabase = getSupabaseAdmin();
    const { data: link, error } = await supabase
      .from("links")
      .select("id, slug, original_url, created_at, updated_at, clicks, password_hash, expires_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !link?.original_url) return jsonError("Link tidak ditemukan.", 404);
    if (isExpired(link.expires_at)) return jsonError("Link sudah expired.", 410);
    if (!link.password_hash) return jsonError("Link ini tidak membutuhkan password.", 400);
    if (!comparePassword(password, link.password_hash)) return jsonError("Password salah.", 401);

    await registerClick(supabase, link, clickMetaFromHeaders(request.headers));

    return NextResponse.json({ originalUrl: link.original_url });
  } catch (error) {
    console.error(error);
    return jsonError("Server error saat membuka link.", 500);
  }
}
