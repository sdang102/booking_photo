import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import type { Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "S. Đặng Photography | Luxury Portrait Sài Gòn",
  description: "Đặt lịch chụp Luxury Portrait trực tuyến cùng S. Đặng Photography — một concept duy nhất, được chuẩn bị riêng cho thần thái và câu chuyện của bạn.",
};

const themeScript = `try{const saved=localStorage.getItem('photo-booking-theme');const theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch{document.documentElement.dataset.theme='light'}`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8ef" },
    { media: "(prefers-color-scheme: dark)", color: "#160e0b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-theme="light"
      suppressHydrationWarning
      className={`${manrope.variable} ${playfair.variable} h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-full flex flex-col selection:bg-brand selection:text-brand-contrast">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

