import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile Settings — AI Resume Builder",
  description: "Manage your account settings, change your password, and view your resume generation analytics.",
  openGraph: {
    title: "Profile Settings — AI Resume Builder",
    description: "Manage your account settings, change your password, and view your resume generation analytics.",
    url: "https://ai-resum.dev/account",
    images: [{ url: "/og-image.png" }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
