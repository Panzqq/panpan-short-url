import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PasswordGate from "./password-gate";
import { getSiteUrl, getSupabaseAdmin, type LinkRow } from "@/lib/supabase";
import { clickMetaFromHeaders, registerClick } from "@/lib/clicks";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function isExpired(expiresAt?: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

function StatusScreen({ title, text, badge }: { title: string; text: string; badge: string }) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl place-items-center px-5 py-10">
      <section className="brutal-border bg-white p-6 sm:p-9">
        <div className="brutal-border-sm mb-5 inline-block bg-[var(--yellow)] px-4 py-2 text-sm font-black uppercase">
          {badge}
        </div>
        <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">{title}</h1>
        <p className="mt-4 text-lg font-bold leading-relaxed">{text}</p>
        <a href="/" className="mt-7 inline-block border-4 border-black bg-[var(--green)] px-5 py-3 font-black uppercase shadow-brutalSm">
          Kembali ke beranda
        </a>
      </section>
    </main>
  );
}

export default async function SlugPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug || "");

  if (!isValidSlug(slug)) {
    return <StatusScreen badge="slug salah" title="Link tidak valid" text="Slug link ini tidak sesuai format yang diperbolehkan." />;
  }

  const supabase = getSupabaseAdmin();
  const { data: link, error } = await supabase
    .from("links")
    .select("id, slug, original_url, created_at, updated_at, clicks, password_hash, expires_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !link?.original_url) {
    return <StatusScreen badge="404" title="Link tidak ditemukan" text="Short link ini belum dibuat atau slug-nya sudah tidak tersedia." />;
  }

  if (isExpired(link.expires_at)) {
    return <StatusScreen badge="expired" title="Link sudah expired" text="Link ini punya batas waktu dan sekarang sudah tidak bisa digunakan." />;
  }

  if (link.password_hash) {
    return <PasswordGate slug={link.slug} shortUrl={`${getSiteUrl()}/${link.slug}`} />;
  }

  const headerList = await headers();
  await registerClick(supabase, link, clickMetaFromHeaders(headerList));

  redirect(link.original_url);
}
