-- PanPan Short URL Advanced
-- Jalankan di Supabase SQL Editor.

create table if not exists public.links (
  id bigserial primary key,
  slug text not null unique,
  original_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  clicks integer not null default 0,
  password_hash text,
  expires_at timestamptz
);

-- Aman untuk project lama: kolom tambahan akan ditambahkan tanpa menghapus data.
alter table public.links add column if not exists updated_at timestamptz not null default now();
alter table public.links add column if not exists password_hash text;
alter table public.links add column if not exists expires_at timestamptz;

create index if not exists links_slug_idx on public.links (slug);
create index if not exists links_expires_at_idx on public.links (expires_at);

create table if not exists public.click_events (
  id bigserial primary key,
  link_id bigint not null references public.links(id) on delete cascade,
  slug text not null,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  ip_hash text
);

create index if not exists click_events_link_id_idx on public.click_events (link_id);
create index if not exists click_events_slug_idx on public.click_events (slug);
create index if not exists click_events_clicked_at_idx on public.click_events (clicked_at desc);

-- Pakai RLS supaya tabel tidak terbuka lewat anon key.
-- Aplikasi tetap bisa akses karena memakai SERVICE_ROLE_KEY di server Next.js.
alter table public.links enable row level security;
alter table public.click_events enable row level security;
