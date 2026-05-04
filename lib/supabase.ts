import { createClient } from "@supabase/supabase-js";

export type LinkRow = {
  id: number;
  slug: string;
  original_url: string;
  created_at: string;
  updated_at?: string;
  clicks: number;
  password_hash?: string | null;
  expires_at?: string | null;
};

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Vercel Environment Variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://panpan.biz.id").replace(/\/$/, "");
}
