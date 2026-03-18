import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Generate Resume — AI Resume Builder",
  description: "Paste a job description and generate a tailored, ATS-optimized resume powered by AI.",
  openGraph: {
    title: "Generate Resume — AI Resume Builder",
    description: "Paste a job description and generate a tailored, ATS-optimized resume powered by AI.",
    url: "https://ai-resum.dev/generate",
    images: [{ url: "/og-image.png" }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
