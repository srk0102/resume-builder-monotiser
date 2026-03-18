import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Generation History — AI Resume Builder",
  description: "View your resume generation history. Preview, edit, or download previously generated resumes.",
  openGraph: {
    title: "Generation History — AI Resume Builder",
    description: "View your resume generation history. Preview, edit, or download previously generated resumes.",
    url: "https://ai-resum.dev/history",
    images: [{ url: "/og-image.png" }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
