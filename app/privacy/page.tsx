import type { Metadata } from "next"
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: "Privacy Policy — AI Resume Builder",
  description: "Learn how AI Resume Builder collects, uses, and protects your personal data.",
  openGraph: {
    title: "Privacy Policy — AI Resume Builder",
    description: "Learn how AI Resume Builder collects, uses, and protects your personal data.",
    url: "https://ai-resum.dev/privacy",
    images: [{ url: "/og-image.png" }],
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-semibold">Resume Builder</span>
          </Link>
        </div>
      </header>

      <div className="container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 17, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">When you use Resume Builder, we collect the following information:</p>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Account Information:</strong> Email address and password when you create an account.</li>
              <li><strong className="text-foreground">Profile Data:</strong> Name, professional title, phone number, location, work experience, education, and skills that you provide to build your resume portfolio.</li>
              <li><strong className="text-foreground">Resume Data:</strong> Job descriptions you submit and the AI-generated resumes created for you.</li>
              <li><strong className="text-foreground">Uploaded Files:</strong> Resume files (PDF, DOCX) you upload for AI extraction. These are processed in memory and not permanently stored on our servers.</li>
              <li><strong className="text-foreground">Payment Information:</strong> Payment processing is handled entirely by Stripe. We do not store your credit card details, bank account numbers, or other financial information on our servers.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Number of resumes generated, credits used, and general usage patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>To provide and maintain our resume generation service.</li>
              <li>To process your payments through Stripe.</li>
              <li>To generate AI-tailored resumes based on your profile and job descriptions.</li>
              <li>To communicate with you about your account and service updates.</li>
              <li>To improve our service and user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">We use the following third-party services:</p>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Supabase:</strong> For authentication and data storage. Your account and profile data is stored securely in Supabase&apos;s infrastructure.</li>
              <li><strong className="text-foreground">Stripe:</strong> For payment processing. Stripe handles all payment data per their own privacy policy.</li>
              <li><strong className="text-foreground">Together.ai:</strong> For AI-powered resume generation. Job descriptions and profile data are sent to Together.ai&apos;s API for processing. This data is used solely for generating your resume and is not retained by Together.ai for training purposes.</li>
              <li><strong className="text-foreground">Vercel:</strong> For hosting our application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your profile data and generated resumes are retained as long as your account is active. You can delete individual resumes from your dashboard at any time. If you wish to delete your entire account and all associated data, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including encrypted connections (HTTPS), row-level security on our database, and secure authentication through Supabase. However, no method of electronic transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>Access your personal data stored in your profile.</li>
              <li>Update or correct your personal information.</li>
              <li>Delete your generated resumes.</li>
              <li>Request deletion of your account and all associated data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify users of significant changes by posting a notice on our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this privacy policy or your data, please contact us through our website.
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">© 2026 Resume Builder. All rights reserved.</span>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
