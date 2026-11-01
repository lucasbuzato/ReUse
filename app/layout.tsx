import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import UtmCapture from "@/components/site/UtmCapture";
import WatsonAssistantChat from "@/components/WatsonAssistantChat";
import { getCurrentUser } from "@/lib/api";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ReUse! — Doe e troque objetos perto de você",
    template: "%s · ReUse!",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: ["doação", "troca", "economia circular", "reutilizar", "sustentabilidade", "objetos usados"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName,
    url: "/",
    title: "ReUse! — Doe e troque objetos perto de você",
    description: siteDescription,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ReUse! — doe o que sobra, encontre o que falta" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReUse! — Doe e troque objetos perto de você",
    description: siteDescription,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#101512" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col bg-canvas font-sans text-ink">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold"
        >
          Pular para o conteúdo
        </a>
        <Providers>
          <Header user={user} />
          <main id="conteudo" className="flex-1">
            {children}
          </main>
          <Footer />
          <UtmCapture />
          <WatsonAssistantChat />
        </Providers>
      </body>
    </html>
  );
}
