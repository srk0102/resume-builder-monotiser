import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Portfolio — AI Resume Builder",
  description: "Build your professional portfolio. Add your experience, education, and skills for AI-powered resume generation.",
  openGraph: {
    title: "Portfolio — AI Resume Builder",
    description: "Build your professional portfolio. Add your experience, education, and skills for AI-powered resume generation.",
    url: "https://ai-resum.dev/profile",
    images: [{ url: "/og-image.png" }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
