import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "../styles/tokens.css";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RollCall — attendance, sorted",
  description:
    "Track your attendance, see how many classes you can skip or must attend, and your GPA/CGPA — on the Sathyabama scale.",
  manifest: "/manifest.webmanifest",
  applicationName: "RollCall",
  appleWebApp: { capable: true, title: "RollCall", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#17171B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
