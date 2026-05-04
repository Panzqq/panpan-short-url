import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/supabase";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizeSlug(rawSlug || "");

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Slug tidak valid." }, { status: 400 });
  }

  const shortUrl = `${getSiteUrl()}/${slug}`;
  const svg = await QRCode.toString(shortUrl, {
    type: "svg",
    margin: 2,
    width: 512,
    errorCorrectionLevel: "M"
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
