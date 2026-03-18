import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Buy Credits — AI Resume Builder",
  description: "Purchase resume generation credits. One-time payment, no subscriptions. Starting at $5.",
  openGraph: {
    title: "Buy Credits — AI Resume Builder",
    description: "Purchase resume generation credits. One-time payment, no subscriptions. Starting at $5.",
    url: "https://ai-resum.dev/settings",
    images: [{ url: "/og-image.png" }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
