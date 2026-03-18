import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password — AI Resume Builder",
  description: "Reset your AI Resume Builder account password.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Reset Password — AI Resume Builder",
    description: "Reset your AI Resume Builder account password.",
    url: "https://ai-resum.dev/forgot-password",
    images: [{ url: "/og-image.png" }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
