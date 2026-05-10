import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://gridhint.com"),
  title: "GridHint — NYT Connections Hints, Wordle Solver & Spelling Bee Helper Today",
  description:
    "Daily hints and answers for the NYT Connections, Wordle, and Spelling Bee puzzles, plus solvers for anagrams, crosswords, hangman, and word ladders. Free, no sign-up.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 font-sans text-lg leading-relaxed flex flex-col`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XK5332Z4Z8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-XK5332Z4Z8');
          `}
        </Script>
        <Header />
        <main className="flex-1 w-full pb-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
