import type { Metadata } from "next";
import { Inter, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AsianGPT",
  description: "Chat, generate images, and edit images - powered by Groq and Hugging Face.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="bg-paper text-ink font-body antialiased">{children}</body>
    </html>
  );
}
