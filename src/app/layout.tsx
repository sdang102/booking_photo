import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import type { Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "FIN PHOTO | Editorial Photography Sài Gòn",
  description: "FIN PHOTO — chân dung, couple, pre-wedding và editorial photography được kể bằng ánh sáng và cảm xúc.",
};

const themeScript = `document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark'`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0c10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-theme="dark"
      suppressHydrationWarning
      className={`${jakarta.variable} ${playfair.variable} h-full antialiased`}
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

