import type { Metadata } from "next";
import { Fraunces, Hind_Siliguri, Inter, Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Premium display serif for headings: Fraunces (Latin) + Noto Serif Bengali.
// Fraunces has no Bengali glyphs, so Bangla headings fall through to the
// Bengali serif automatically.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const notoSerifBn = Noto_Serif_Bengali({
  variable: "--font-noto-bn",
  subsets: ["bengali"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Abrar Active Dental | Mirpur-12 | দাঁতের চিকিৎসা",
  description:
    "Your smile matters! All kinds of oral and dental treatments with a focus on quality and care. Book an appointment at Abrar Active Dental, Kalshi Mor, Mirpur-12, Dhaka.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${inter.variable} ${hind.variable} ${fraunces.variable} ${notoSerifBn.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LangProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
