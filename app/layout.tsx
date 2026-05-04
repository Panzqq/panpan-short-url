import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://panpan.biz.id";

export const metadata: Metadata = {
  title: "PanLink - Short URL & Media Tools",
  description: "Short URL simpel dengan animasi halus, statistik, QR Code, custom slug, password link, expired link, dan media helper aman.",
  metadataBase: new URL(siteUrl)
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
