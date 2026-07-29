import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/core/components/ui/tooltip";
import "@/core/styles/globals.css";

/*
 * Fontes default do template — Inter é a fonte oficial do DS Origami v2.0
 * (ADR-0012, emenda 2). O core NÃO fixa fonte: ele consome os tokens
 * `--font-sans-app`/`--font-mono-app` injetados aqui. Projeto consumidor
 * troca a fonte trocando estas duas linhas.
 * As variáveis vão no <html> (não no <body>) para resolverem em toda a árvore.
 */
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-app",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-app",
});

export const metadata: Metadata = {
  title: "Kami — Componentes",
  description: "Showcase da UI base do Kami (shadcn/ui + tokens neutros).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
