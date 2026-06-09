import type { Metadata } from "next";
import {
  Playfair_Display,
  Source_Serif_4,
  Oswald,
  JetBrains_Mono,
} from "next/font/google";
import { Toaster } from "sonner";
import { Disclaimer } from "@/components/Disclaimer";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["400", "500", "600", "700"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "The Daily Degen — Bakchodi Bets",
  description:
    "A private World Cup prediction pool for friends. Fictional credits, real bragging rights. No cash value.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${sourceSerif.variable} ${oswald.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Disclaimer />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: 0,
              border: "2px solid #14110c",
              background: "#faf6ea",
              color: "#14110c",
              fontFamily: "var(--font-oswald), sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            },
          }}
        />
      </body>
    </html>
  );
}
