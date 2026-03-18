import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In — AI Resume Builder",
  description: "Sign in to your AI Resume Builder account to generate ATS-optimized resumes.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sign In — AI Resume Builder",
    description: "Sign in to your AI Resume Builder account to generate ATS-optimized resumes.",
    url: "https://ai-resum.dev/signin",
    images: [{ url: "/og-image.png" }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
