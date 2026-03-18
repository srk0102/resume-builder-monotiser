import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Resume Builder — ATS-Optimized Resumes in Seconds",
  description: "Generate professional, job-specific resumes tailored to any position. AI-powered, ATS-optimized, multiple themes. Starting at $5.",
  metadataBase: new URL("https://ai-resum.dev"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "AI Resume Builder — ATS-Optimized Resumes in Seconds",
    description: "Generate professional, job-specific resumes tailored to any position. AI-powered, ATS-optimized, multiple themes. Starting at $5.",
    url: "https://ai-resum.dev",
    siteName: "AI Resume Builder",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Resume Builder",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Builder — ATS-Optimized Resumes in Seconds",
    description: "Generate professional, job-specific resumes tailored to any position. AI-powered, ATS-optimized, multiple themes.",
    images: ["/og-image.png"],
  },
  keywords: ["resume builder", "AI resume", "ATS resume", "resume generator", "job application", "tailored resume"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
