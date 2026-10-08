import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import type { Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { getPublicSiteSettings } from "@/lib/services/siteSettingsService";
import { getSiteUrl } from "@/lib/siteMetadata";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    metadataBase: getSiteUrl(),
    title: {
      default: settings.seoTitle,
      template: `%s | ${settings.websiteName}`,
    },
    description: settings.seoDescription,
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: settings.websiteName,
      title: settings.seoTitle,
      description: settings.seoDescription,
      images: [{ url: settings.ogImageUrl, alt: settings.websiteName }],
    },
  };
}

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
      <head><script id="theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-full flex flex-col selection:bg-brand selection:text-brand-contrast">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

