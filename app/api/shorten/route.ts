import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSiteUrl, getSupabaseAdmin } from "@/lib/supabase";
import { generateSlug, isValidSlug, normalizeSlug } from "@/lib/slug";
import { hashPassword } from "@/lib/security";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isSafeHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

function parseExpiresAt(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "invalid";
  if (date.getTime() <= Date.now()) return "past";

  return date.toISOString();
}

async function slugExists(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from("links")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function insertLink(
  supabase: SupabaseClient,
  payload: { slug: string; original_url: string; password_hash?: string | null; expires_at?: string | null }
) {
  return supabase.from("links").insert(payload).select("slug, original_url, expires_at, password_hash").single();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const originalInput = String(body?.url || "").trim();
    const customSlug = normalizeSlug(String(body?.slug || ""));
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "").trim();
    const expiresAt = parseExpiresAt(body?.expiresAt);
    const requiredToken = process.env.SHORTENER_ADMIN_TOKEN?.trim();
    const siteUrl = getSiteUrl();

    if (requiredToken && token !== requiredToken) {
      return jsonError("Admin key salah atau belum diisi.", 401);
    }

    const parsedUrl = isSafeHttpUrl(originalInput);
    if (!parsedUrl) {
      return jsonError("URL harus valid dan diawali http:// atau https://.");
    }

    const siteHost = new URL(siteUrl).hostname;
    if (parsedUrl.hostname === siteHost) {
      return jsonError("Jangan pendekkan domain sendiri agar tidak terjadi redirect loop.");
    }

    if (expiresAt === "invalid") {
      return jsonError("Tanggal expired tidak valid.");
    }

    if (expiresAt === "past") {
      return jsonError("Tanggal expired harus lebih baru dari sekarang.");
    }

    if (password && password.length < 4) {
      return jsonError("Password minimal 4 karakter.");
    }

    const supabase = getSupabaseAdmin();
    const basePayload = {
      original_url: parsedUrl.toString(),
      password_hash: password ? hashPassword(password) : null,
      expires_at: typeof expiresAt === "string" ? expiresAt : null
    };

    if (customSlug) {
      if (!isValidSlug(customSlug)) {
        return jsonError("Slug hanya boleh huruf kecil, angka, strip, atau underscore. Panjang 3-32 karakter.");
      }

      if (await slugExists(supabase, customSlug)) {
        return jsonError("Slug sudah dipakai. Coba nama lain.", 409);
      }

      const { data, error } = await insertLink(supabase, {
        slug: customSlug,
        ...basePayload
      });

      if (error || !data) {
        return jsonError("Gagal menyimpan link ke database.", 500);
      }

      return NextResponse.json({
        slug: customSlug,
        originalUrl: parsedUrl.toString(),
        shortUrl: `${siteUrl}/${customSlug}`,
        qrCodeUrl: `/api/qr/${customSlug}`,
        hasPassword: Boolean(password),
        expiresAt: basePayload.expires_at
      });
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const randomSlug = normalizeSlug(generateSlug(6));

      if (!isValidSlug(randomSlug) || (await slugExists(supabase, randomSlug))) {
        continue;
      }

      const { data, error } = await insertLink(supabase, {
        slug: randomSlug,
        ...basePayload
      });

      if (!error && data) {
        return NextResponse.json({
          slug: randomSlug,
          originalUrl: parsedUrl.toString(),
          shortUrl: `${siteUrl}/${randomSlug}`,
          qrCodeUrl: `/api/qr/${randomSlug}`,
          hasPassword: Boolean(password),
          expiresAt: basePayload.expires_at
        });
      }
    }

    return jsonError("Gagal membuat slug unik. Coba lagi.", 500);
  } catch (error) {
    console.error(error);
    return jsonError("Server belum siap. Cek Supabase dan Environment Variables di Vercel.", 500);
  }
}
