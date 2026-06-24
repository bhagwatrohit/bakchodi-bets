import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Disclaimer } from "@/components/Disclaimer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bakchodi Bets — World Cup '26 Prediction Pool",
  description:
    "A private World Cup prediction pool for friends. Fictional credits, real bragging rights. No cash value.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/* Apply saved theme before paint to avoid a flash. Default = follow device. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var m=localStorage.getItem('bb-theme')||'system';var l=m==='light'||(m==='system'&&matchMedia('(prefers-color-scheme: light)').matches);if(l)document.documentElement.classList.add('light')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Disclaimer />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "0.9rem",
            },
          }}
        />
      </body>
    </html>
  );
}
