"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";

type ApiResult = { shortUrl?: string; qrCodeUrl?: string; slug?: string; hasPassword?: boolean; expiresAt?: string | null; error?: string };
type StatsResult = { slug?: string; totalClicks?: number; recentClicks?: number; hasPassword?: boolean; dailyClicks?: { date: string; clicks: number }[]; topReferrers?: { referrer: string; clicks: number }[]; error?: string };
type MediaResult = { url?: string; host?: string; platformLabel?: string; message?: string; qrDataUrl?: string; canDirectDownload?: boolean; downloadUrl?: string | null; error?: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://panpan.biz.id";

export default function ShortenerClient() {
  const [tab, setTab] = useState<"short" | "media" | "stats">("short");
  const [url, setUrl] = useState("https://vt.tiktok.com/ZS9unywWw/");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statsSlug, setStatsSlug] = useState("");
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("https://www.youtube.com/watch?v=VIDEO_ID");
  const [mediaResult, setMediaResult] = useState<MediaResult | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);

  const cleanSiteUrl = SITE_URL.replace(/\/$/, "");
  const previewUrl = useMemo(() => {
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
    return cleanSlug ? `${cleanSiteUrl}/${cleanSlug}` : `${cleanSiteUrl}/a7x9k`;
  }, [slug, cleanSiteUrl]);

  async function shorten(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setCopied(false); setResult(null);
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, slug, token, password, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : "" })
      });
      const data = (await response.json()) as ApiResult;
      setResult(data);
      if (data.slug) setStatsSlug(data.slug);
    } catch {
      setResult({ error: "Gagal menghubungi server. Cek koneksi atau konfigurasi Vercel." });
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanSlug = statsSlug.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
    if (!cleanSlug) return;
    setStatsLoading(true); setStats(null);
    try {
      const response = await fetch(`/api/stats/${cleanSlug}?token=${encodeURIComponent(token)}`);
      setStats((await response.json()) as StatsResult);
    } catch {
      setStats({ error: "Gagal mengambil statistik." });
    } finally {
      setStatsLoading(false);
    }
  }

  async function checkMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMediaLoading(true); setMediaResult(null);
    try {
      const response = await fetch("/api/media/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: mediaUrl })
      });
      setMediaResult((await response.json()) as MediaResult);
    } catch {
      setMediaResult({ error: "Gagal memeriksa link media." });
    } finally {
      setMediaLoading(false);
    }
  }

  async function copyText(text?: string) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  function setExpireIn(days: number) {
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setExpiresAt(new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
      <nav className="fade-up mb-10 flex items-center justify-between gap-4">
        <a href="/" className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-lg font-black shadow-sm backdrop-blur transition hover:-translate-y-0.5">PanLink</a>
        <a href={cleanSiteUrl} className="hidden rounded-full bg-black px-4 py-2 text-sm font-bold text-white sm:inline-flex">{cleanSiteUrl.replace("https://", "")}</a>
      </nav>

      <section className="fade-up grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="float-slow mb-5 inline-flex rounded-full border border-black/10 bg-white/75 px-4 py-2 text-sm font-black uppercase shadow-sm backdrop-blur">Short URL + Media Helper</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.06em] sm:text-7xl">Simpel, cepat, dan tetap menarik.</h1>
          <p className="mt-5 max-w-2xl text-base font-bold leading-relaxed text-[var(--muted)] sm:text-lg">Buat link pendek dengan QR, password, expired link, statistik klik, dan alat media untuk link TikTok/YouTube secara aman.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Feature label="Short link" text="Custom slug + QR" tone="bg-[var(--yellow)]" />
            <Feature label="Stats" text="Pantau klik link" tone="bg-[var(--green)]" />
            <Feature label="Protection" text="Password + expired" tone="bg-[var(--blue)]" />
            <Feature label="Media" text="Helper TikTok/YouTube" tone="bg-[var(--purple)]" />
          </div>
          <div className="mt-6 rounded-3xl border border-black/10 bg-white/65 p-4 text-sm font-bold leading-relaxed text-[var(--muted)] shadow-sm backdrop-blur">Catatan: fitur media tidak membypass platform. Untuk YouTube/TikTok, gunakan opsi download resmi atau konten yang memang kamu punya izin untuk simpan.</div>
        </div>

        <div className="soft-card rounded-[2rem] p-4 sm:p-6">
          <div className="mb-5 grid gap-2 rounded-3xl bg-black/5 p-2 sm:grid-cols-3">
            <Tab active={tab === "short"} onClick={() => setTab("short")}>Short Link</Tab>
            <Tab active={tab === "media"} onClick={() => setTab("media")}>Media Tools</Tab>
            <Tab active={tab === "stats"} onClick={() => setTab("stats")}>Statistik</Tab>
          </div>

          {tab === "short" && (
            <section className="fade-up">
              <Header eyebrow="Buat link baru" title="Shortener" icon="↗" />
              <form onSubmit={shorten} className="space-y-4">
                <Input label="URL panjang" value={url} onChange={setUrl} placeholder="https://contoh.com/link-yang-panjang" required />
                <label className="block">
                  <span className="mb-2 block text-sm font-black uppercase">Custom slug opsional</span>
                  <div className="flex overflow-hidden rounded-2xl border border-black/15 bg-white/90">
                    <span className="hidden bg-black px-3 py-3 text-sm font-black text-white sm:inline-block">panpan.biz.id/</span>
                    <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="tiktok / tugas / film" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base font-bold outline-none" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-[var(--muted)]">Preview: {previewUrl}</p>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Password link opsional" value={password} onChange={setPassword} placeholder="Kosongkan kalau publik" type="password" />
                  <label className="block"><span className="mb-2 block text-sm font-black uppercase">Expired link opsional</span><input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="datetime-local" className="soft-input rounded-2xl px-4 py-3 text-base font-bold" /></label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SmallButton type="button" onClick={() => setExpireIn(1)}>Expired 1 hari</SmallButton>
                  <SmallButton type="button" onClick={() => setExpireIn(7)}>Expired 7 hari</SmallButton>
                  <SmallButton type="button" onClick={() => setExpiresAt("")}>Tanpa expired</SmallButton>
                </div>
                <Input label="Admin key" value={token} onChange={setToken} placeholder="Isi sesuai SHORTENER_ADMIN_TOKEN" type="password" />
                <button type="submit" disabled={loading} className="soft-button w-full rounded-2xl bg-black px-5 py-4 text-lg font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Membuat..." : "Buat Short URL"}</button>
              </form>
              {result?.error && <Alert tone="bg-[var(--pink)]">{result.error}</Alert>}
              {result?.shortUrl && (
                <div className="fade-up mt-6 grid gap-5 rounded-3xl border border-black/10 bg-[var(--green)]/70 p-4 sm:grid-cols-[1fr_160px]">
                  <div><p className="text-sm font-black uppercase">Link pendek jadi</p><a href={result.shortUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-2xl font-black underline">{result.shortUrl}</a><div className="mt-4 flex flex-wrap gap-2"><SmallButton type="button" onClick={() => copyText(result.shortUrl)}>{copied ? "Sudah disalin" : "Salin link"}</SmallButton>{result.qrCodeUrl && <a href={result.qrCodeUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-4 py-2 text-sm font-black shadow-sm transition hover:-translate-y-0.5">Buka QR</a>}</div><div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase">{result.hasPassword && <span className="rounded-full bg-white px-3 py-1">Password aktif</span>}{result.expiresAt && <span className="rounded-full bg-white px-3 py-1">Expired aktif</span>}</div></div>
                  {result.qrCodeUrl && <div className="grid place-items-center rounded-2xl bg-white p-3 shadow-sm"><img src={result.qrCodeUrl} alt={`QR Code ${result.shortUrl}`} className="h-32 w-32" /></div>}
                </div>
              )}
            </section>
          )}

          {tab === "media" && (
            <section className="fade-up">
              <Header eyebrow="TikTok / YouTube" title="Media Tools" icon="▶" />
              <form onSubmit={checkMedia} className="space-y-4">
                <Input label="Link media" value={mediaUrl} onChange={setMediaUrl} placeholder="Tempel link TikTok, YouTube, atau direct .mp4" required />
                <button type="submit" disabled={mediaLoading} className="soft-button w-full rounded-2xl bg-black px-5 py-4 text-lg font-black uppercase text-white disabled:opacity-60">{mediaLoading ? "Memeriksa..." : "Cek Media"}</button>
              </form>
              {mediaResult?.error && <Alert tone="bg-[var(--pink)]">{mediaResult.error}</Alert>}
              {mediaResult?.url && !mediaResult.error && (
                <div className="fade-up mt-6 rounded-3xl border border-black/10 bg-white/80 p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="rounded-full bg-[var(--blue)] px-3 py-1 text-xs font-black uppercase sm:inline-block">{mediaResult.platformLabel}</p><h3 className="mt-3 break-all text-2xl font-black">{mediaResult.host}</h3><p className="mt-2 text-sm font-bold leading-relaxed text-[var(--muted)]">{mediaResult.message}</p></div>{mediaResult.qrDataUrl && <img src={mediaResult.qrDataUrl} alt="QR Media" className="h-32 w-32 rounded-2xl bg-white p-2 shadow-sm" />}</div>
                  <div className="mt-5 flex flex-wrap gap-2"><a href={mediaResult.url} target="_blank" rel="noreferrer" className="rounded-xl bg-black px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5">Buka sumber asli</a><SmallButton type="button" onClick={() => copyText(mediaResult.url)}>Salin link</SmallButton>{mediaResult.canDirectDownload && mediaResult.downloadUrl && <a href={mediaResult.downloadUrl} className="rounded-xl bg-[var(--green)] px-4 py-2 text-sm font-black shadow-sm transition hover:-translate-y-0.5">Download file video</a>}</div>
                </div>
              )}
            </section>
          )}

          {tab === "stats" && (
            <section className="fade-up">
              <Header eyebrow="Cek performa" title="Statistik" icon="◷" />
              <form onSubmit={loadStats} className="grid gap-3 sm:grid-cols-[1fr_auto]"><input value={statsSlug} onChange={(e) => setStatsSlug(e.target.value)} placeholder="Masukkan slug, contoh: tiktok" className="soft-input rounded-2xl px-4 py-3 text-base font-bold" /><button type="submit" disabled={statsLoading} className="soft-button rounded-2xl bg-black px-5 py-3 font-black uppercase text-white disabled:opacity-60">{statsLoading ? "Loading..." : "Cek stats"}</button></form>
              <div className="mt-4"><Input label="Admin key untuk statistik" value={token} onChange={setToken} placeholder="Isi sesuai SHORTENER_ADMIN_TOKEN" type="password" /></div>
              {stats?.error && <Alert tone="bg-[var(--pink)]">{stats.error}</Alert>}
              {stats?.slug && !stats.error && <div className="fade-up mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-3"><StatBox label="Total klik" value={String(stats.totalClicks ?? 0)} /><StatBox label="Klik 30 hari" value={String(stats.recentClicks ?? 0)} /><StatBox label="Proteksi" value={stats.hasPassword ? "Password" : "Publik"} /></div><div className="grid gap-4 lg:grid-cols-2"><ListBox title="Klik harian" empty="Belum ada data 30 hari terakhir." items={(stats.dailyClicks || []).map((item) => `${item.date} — ${item.clicks} klik`)} /><ListBox title="Top referrer" empty="Belum ada referrer." items={(stats.topReferrers || []).map((item) => `${item.referrer} — ${item.clicks}`)} /></div></div>}
            </section>
          )}
        </div>
      </section>
      <footer className="fade-up mt-10 rounded-3xl border border-black/10 bg-white/55 px-5 py-4 text-sm font-bold text-[var(--muted)] shadow-sm backdrop-blur">Dibuat untuk <strong>panpan.biz.id</strong>. Tampilan simpel, animasi halus, dan fitur tetap lengkap.</footer>
    </main>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${active ? "bg-black text-white shadow-sm" : "bg-white/70 text-black hover:bg-white"}`}>{children}</button>; }
function Header({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: string }) { return <div className="mb-5 flex items-center justify-between gap-4 border-b border-black/10 pb-4"><div><p className="text-sm font-black uppercase text-[var(--muted)]">{eyebrow}</p><h2 className="text-3xl font-black tracking-tight">{title}</h2></div><div className="pulse-soft grid h-14 w-14 place-items-center rounded-2xl bg-[var(--yellow)] text-2xl font-black shadow-sm">{icon}</div></div>; }
function Input({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) { return <label className="block"><span className="mb-2 block text-sm font-black uppercase">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} required={required} className="soft-input rounded-2xl px-4 py-3 text-base font-bold" /></label>; }
function SmallButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className="rounded-xl bg-white px-4 py-2 text-sm font-black shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60">{children}</button>; }
function Alert({ children, tone }: { children: ReactNode; tone: string }) { return <div className={`mt-6 rounded-2xl ${tone} p-4 text-sm font-black shadow-sm`}>{children}</div>; }
function Feature({ label, text, tone }: { label: string; text: string; tone: string }) { return <div className={`rounded-3xl border border-black/10 ${tone} p-4 shadow-sm transition hover:-translate-y-1`}><h3 className="text-lg font-black">{label}</h3><p className="mt-1 text-sm font-bold text-black/65">{text}</p></div>; }
function StatBox({ label, value }: { label: string; value: string }) { return <div className="rounded-3xl border border-black/10 bg-[var(--yellow)] p-4 shadow-sm"><p className="text-sm font-black uppercase text-black/60">{label}</p><p className="mt-1 break-words text-3xl font-black">{value}</p></div>; }
function ListBox({ title, empty, items }: { title: string; empty: string; items: string[] }) { return <div className="rounded-3xl border border-black/10 bg-white/80 p-4 shadow-sm"><h3 className="mb-3 text-lg font-black uppercase">{title}</h3><div className="space-y-2">{items.length === 0 && <p className="text-sm font-bold text-[var(--muted)]">{empty}</p>}{items.map((item) => <div key={item} className="truncate rounded-2xl bg-black/5 px-3 py-2 text-sm font-bold">{item}</div>)}</div></div>; }
