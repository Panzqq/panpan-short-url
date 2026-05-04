import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

type Platform = "youtube" | "tiktok" | "direct" | "unknown";
const directVideoExtensions = [".mp4", ".webm", ".mov", ".m4v"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseSafeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

function detectPlatform(url: URL): Platform {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) return "youtube";
  if (host.endsWith("tiktok.com") || host === "vt.tiktok.com" || host === "vm.tiktok.com") return "tiktok";
  if (directVideoExtensions.some((extension) => url.pathname.toLowerCase().endsWith(extension))) return "direct";
  return "unknown";
}

function platformLabel(platform: Platform) {
  if (platform === "youtube") return "YouTube";
  if (platform === "tiktok") return "TikTok";
  if (platform === "direct") return "Direct video file";
  return "Link biasa";
}

function messageFor(platform: Platform) {
  if (platform === "youtube") return "Untuk YouTube, fitur ini dibuat sebagai helper aman: buka video asli, buat QR, dan arahkan ke opsi resmi. Download file langsung hanya boleh untuk video milik sendiri lewat fitur resmi YouTube atau konten yang memang kamu punya izin untuk simpan.";
  if (platform === "tiktok") return "Untuk TikTok, fitur ini membuka sumber asli dan memberi QR. Download video mengikuti izin kreator: pakai tombol Simpan video di aplikasi TikTok kalau tersedia.";
  if (platform === "direct") return "Link ini terdeteksi sebagai file video langsung. Kamu bisa download kalau file tersebut milikmu atau kamu punya izin untuk menyimpannya.";
  return "Link ini bukan file video langsung. Kamu tetap bisa membuat QR atau membukanya sebagai sumber asli.";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const input = String(body?.url || "").trim();
  const parsed = parseSafeUrl(input);
  if (!parsed) return jsonError("URL tidak valid. Gunakan link yang diawali http:// atau https://.");

  const platform = detectPlatform(parsed);
  const qrDataUrl = await QRCode.toDataURL(parsed.toString(), { margin: 1, width: 512, errorCorrectionLevel: "M" });

  return NextResponse.json({
    url: parsed.toString(),
    host: parsed.hostname,
    platform,
    platformLabel: platformLabel(platform),
    message: messageFor(platform),
    qrDataUrl,
    canDirectDownload: platform === "direct",
    downloadUrl: platform === "direct" ? `/api/media/download?url=${encodeURIComponent(parsed.toString())}` : null
  });
}
