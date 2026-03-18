import type { Metadata } from "next"
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: "Terms of Service — AI Resume Builder",
  description: "Read the terms of service for AI Resume Builder including pricing, refund policy, and credit expiration.",
  openGraph: {
    title: "Terms of Service — AI Resume Builder",
    description: "Read the terms of service for AI Resume Builder including pricing, refund policy, and credit expiration.",
    url: "https://ai-resum.dev/terms",
    images: [{ url: "/og-image.png" }],
  },
}

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 17, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Resume Builder (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. By making a purchase, you explicitly accept all terms and conditions outlined herein.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Resume Builder is an AI-powered resume generation service. Users can upload their professional profile, paste job descriptions, and generate tailored, ATS-optimized resumes. The service uses artificial intelligence to analyze job descriptions and create customized resume content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Registration</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>You must provide a valid email address to create an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must be at least 18 years old to use this Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Pricing and Payment</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>Resume Builder operates on a <strong className="text-foreground">credit-based, one-time payment model</strong>. There are no subscriptions or recurring charges.</li>
              <li>Credits are purchased in packs: <strong className="text-foreground">Basic Pack ($5 USD)</strong> includes 55 resume generations and 5 resume extractions. <strong className="text-foreground">Pro Pack ($15 USD)</strong> includes 200 resume generations and 15 resume extractions.</li>
              <li>All payments are processed securely through Stripe.</li>
              <li>Prices are in US Dollars (USD) and may be subject to applicable taxes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Credit Expiration</h2>
            <p className="text-muted-foreground leading-relaxed">
              All purchased credits are <strong className="text-foreground">valid for 30 days</strong> from the date of purchase. After 30 days, any unused credits will expire and cannot be recovered or refunded. It is your responsibility to use your credits within the validity period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. No Refund Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">All purchases are final. No refunds will be issued under any circumstances.</strong> This includes but is not limited to:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>Unused credits, whether expired or not.</li>
              <li>Dissatisfaction with the AI-generated resume content.</li>
              <li>Failure to use the Service before credit expiration.</li>
              <li>Accidental purchases or duplicate purchases.</li>
              <li>Technical issues that are resolved in a reasonable timeframe.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              By making a purchase, you acknowledge and agree to this no-refund policy. You are encouraged to review our service and pricing before purchasing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. AI-Generated Content</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>Resumes are generated by artificial intelligence based on the information you provide.</li>
              <li>While we strive for accuracy, we do not guarantee that AI-generated content will be error-free or perfectly suited for every job application.</li>
              <li>You are responsible for reviewing, editing, and verifying all generated content before submitting it to potential employers.</li>
              <li>We are not responsible for the outcome of any job application made using our generated resumes.</li>
              <li>The AI does not fabricate information — it restructures and optimizes the data you provide.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. User Responsibilities</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>You must provide accurate and truthful information in your profile.</li>
              <li>You are solely responsible for the accuracy of the information in your generated resumes.</li>
              <li>You agree not to use the Service for any unlawful purpose.</li>
              <li>You agree not to attempt to exploit, reverse engineer, or abuse the Service.</li>
              <li>You agree not to share your account credentials with others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of the personal information and content you provide. The generated resumes are yours to use as you see fit. However, the Service itself, including its design, code, AI models, and branding, remains the intellectual property of Resume Builder.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Resume Builder shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or employment opportunities, arising from your use of the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Our total liability shall not exceed the amount you paid for the Service in the 30 days preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to maintain 99.9% uptime but do not guarantee uninterrupted access to the Service. We may perform maintenance, updates, or modifications that temporarily affect availability. We are not liable for any downtime or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these terms or misuse of the Service. Upon termination, you lose access to your account and any remaining credits, with no refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the modified terms. Significant changes will be communicated via our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by and construed in accordance with applicable laws. Any disputes arising from these terms or the Service shall be resolved through appropriate legal channels.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">15. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, please contact us through our website.
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">© 2026 Resume Builder. All rights reserved.</span>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}
