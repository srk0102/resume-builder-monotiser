import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Get Started — AI Resume Builder",
  description: "Create your free account and start generating professional, ATS-optimized resumes in seconds.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Get Started — AI Resume Builder",
    description: "Create your free account and start generating professional, ATS-optimized resumes in seconds.",
    url: "https://ai-resum.dev/signup",
    images: [{ url: "/og-image.png" }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
