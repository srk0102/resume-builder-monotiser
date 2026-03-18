import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard — AI Resume Builder",
  description: "View and manage your generated resumes. Edit, download, or generate new tailored resumes.",
  openGraph: {
    title: "Dashboard — AI Resume Builder",
    description: "View and manage your generated resumes. Edit, download, or generate new tailored resumes.",
    url: "https://ai-resum.dev/dashboard",
    images: [{ url: "/og-image.png" }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
