import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import Script from "next/script";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IndoRepurpose AI - Transformasikan Konten Anda dalam Sekejap",
  description: "Ubah video YouTube dan teks panjang menjadi postingan viral untuk X, WhatsApp, dan LinkedIn. AI-powered content automation untuk kreator Indonesia.",
};

import { AntigravityEffect } from "@/components/AntigravityEffect";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${outfit.variable} ${plusJakartaSans.variable} antialiased min-h-screen bg-background text-foreground relative`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          suppressHydrationWarning
        >
          <AntigravityEffect />
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
