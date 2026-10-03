import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Imposter",
  description: "Trò chơi suy luận tại bàn — một QR, mỗi người một bí mật.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} dark h-full antialiased`}>
      <body className="min-h-dvh bg-background font-sans text-foreground">{children}</body>
    </html>
  );
}
