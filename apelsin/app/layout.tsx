import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Апельсин — Семья и СБП по QR в X5",
  description:
    "Апельсин Пэй: семья из друзей, общий счёт покупок и категории повышенного кэшбэка по уровню семьи.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF6B00",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8F9FA] font-sans text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
