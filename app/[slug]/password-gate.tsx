"use client";

import { FormEvent, useState } from "react";

export default function PasswordGate({ slug, shortUrl }: { slug: string; shortUrl: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password })
      });

      const data = (await response.json()) as { originalUrl?: string; error?: string };

      if (!response.ok || !data.originalUrl) {
        setError(data.error || "Password salah atau link tidak bisa dibuka.");
        return;
      }

      window.location.href = data.originalUrl;
    } catch {
      setError("Gagal menghubungi server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl place-items-center px-5 py-10">
      <section className="brutal-border bg-white p-6 sm:p-9">
        <div className="brutal-border-sm mb-5 inline-block bg-[var(--pink)] px-4 py-2 text-sm font-black uppercase">
          protected link
        </div>
        <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">Link ini pakai password</h1>
        <p className="mt-4 break-all text-base font-bold">{shortUrl}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-black uppercase">Password link</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Masukkan password"
              className="w-full border-4 border-black bg-white px-4 py-3 text-base font-bold outline-none transition focus:bg-[var(--yellow)]"
              required
            />
          </label>

          {error && <div className="border-4 border-black bg-[var(--pink)] p-3 font-black">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full border-4 border-black bg-[var(--green)] px-5 py-4 text-lg font-black uppercase shadow-brutal transition hover:-translate-x-1 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Mengecek..." : "Buka Link"}
          </button>
        </form>
      </section>
    </main>
  );
}
