import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { Toaster } from "sonner";
import { Disclaimer } from "@/components/Disclaimer";
import "./globals.css";

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  variable: "--font-press-start",
  weight: "400",
});
const vt323 = VT323({
  subsets: ["latin"],
  variable: "--font-vt323",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Bakchodi Bets — World Cup '26 Prediction Arcade",
  description:
    "A private World Cup prediction pool for friends. Fictional credits, real bragging rights. No cash value.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable} h-full`}>
      <head>
        {/* Apply saved theme before paint to avoid a flash. Default = dark arcade. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('bb-theme')==='light')document.documentElement.classList.add('light')}catch(e){}",
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
              borderRadius: 0,
              border: "2px solid #39ff14",
              background: "#0a0e1a",
              color: "#d8ffe9",
              fontFamily: "var(--font-vt323), monospace",
              fontSize: "1.05rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              boxShadow: "0 0 16px rgba(57,255,20,0.4)",
            },
          }}
        />
      </body>
    </html>
  );
}
