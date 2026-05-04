import { NextRequest, NextResponse } from "next/server";

const allowedExtensions = [".mp4", ".webm", ".mov", ".m4v"];
const blockedHosts = ["youtube.com", "youtu.be", "youtube-nocookie.com", "tiktok.com", "vt.tiktok.com", "vm.tiktok.com"];

function isBlockedHost(hostname: string) {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

function safeFileName(url: URL) {
  const last = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "video.mp4");
  return last.replace(/[^a-zA-Z0-9._-]/g, "_") || "video.mp4";
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url") || "";
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "URL tidak valid." }, { status: 400 });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "URL harus http atau https." }, { status: 400 });
  }
  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "Download langsung dari platform ini tidak disediakan. Gunakan opsi resmi platform." }, { status: 403 });
  }
  if (!allowedExtensions.some((extension) => parsed.pathname.toLowerCase().endsWith(extension))) {
    return NextResponse.json({ error: "Hanya direct file video seperti .mp4, .webm, .mov, atau .m4v yang didukung." }, { status: 400 });
  }

  const upstream = await fetch(parsed.toString(), { headers: { "User-Agent": "PanLink-Media-Helper/1.0" } });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "File tidak bisa diambil dari sumber." }, { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename=\"${safeFileName(parsed)}\"`);
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);
  return new NextResponse(upstream.body, { headers });
}
