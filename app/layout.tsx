import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { unstable_noStore as noStore } from "next/cache";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

/** Evita `Cache-Control: s-maxage=31536000` no HTML (CDN Hostinger guardava documento 1 ano → chunks 404). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "InEvolving — Evolução pessoal e profissional",
    template: "%s | InEvolving",
  },
  description:
    "Gestão de objetivos, tarefas, finanças, livros e motivação com experiência mobile-first e PWA.",
  applicationName: "InEvolving",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "InEvolving",
    title: "InEvolving",
    description: "Plataforma de gestão de evolução pessoal e profissional.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InEvolving",
    description: "Plataforma de gestão de evolução pessoal e profissional.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/logo/logo-svg.svg", type: "image/svg+xml" }],
    shortcut: "/logo/logo-svg.svg",
    apple: "/logo/logo-svg.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "InEvolving",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1976D2" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1419" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-brand-blue focus:px-4 focus:py-3 focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
