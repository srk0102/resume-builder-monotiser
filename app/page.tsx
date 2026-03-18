import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Target, Sparkles, Download, Link2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="font-semibold text-lg">Resume Builder</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          ATS-Optimized Resumes in Seconds
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Generate professional, job-specific resumes tailored to any position.
          Powered by AI, optimized for applicant tracking systems.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/generate">Start Building</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/generate">View Demo</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
          <div>
            <div className="text-3xl font-bold">$0.001</div>
            <div className="text-sm text-gray-600">Cost per resume</div>
          </div>
          <div>
            <div className="text-3xl font-bold">5s</div>
            <div className="text-sm text-gray-600">Generation time</div>
          </div>
          <div>
            <div className="text-3xl font-bold">99%</div>
            <div className="text-sm text-gray-600">ATS compatible</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <Link2 className="h-10 w-10 mb-4 text-gray-700" />
                <CardTitle>LinkedIn Import</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Connect your LinkedIn account and import your professional experience automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-10 w-10 mb-4 text-gray-700" />
                <CardTitle>ATS Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Automatically extract keywords from job descriptions to pass ATS filters.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 mb-4 text-gray-700" />
                <CardTitle>Job Specific</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Tailored content for each position highlighting your most relevant skills.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 mb-4 text-gray-700" />
                <CardTitle>3-Pass AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI generates, critiques, and improves each resume for professional quality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 mb-4 text-gray-700" />
                <CardTitle>Flexible Length</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Choose between concise one-page or detailed multi-page formats.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Download className="h-10 w-10 mb-4 text-gray-700" />
                <CardTitle>Export DOCX</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Download as formatted Word documents ready to customize and submit.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl mb-2">Simple Pricing</CardTitle>
                <p className="text-gray-600">One-time payment, no subscriptions</p>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div>
                  <div className="text-5xl font-bold">$5</div>
                  <div className="text-gray-600 mt-2">One-time payment</div>
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center text-xs">✓</div>
                    <span>50 resume generations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center text-xs">✓</div>
                    <span>5 bonus resumes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center text-xs">✓</div>
                    <span>LinkedIn import</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center text-xs">✓</div>
                    <span>ATS optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center text-xs">✓</div>
                    <span>DOCX export</span>
                  </div>
                </div>

                <Button size="lg" className="w-full" asChild>
                  <Link href="/generate">Get 55 Resumes for $5</Link>
                </Button>

                <p className="text-sm text-gray-500">
                  No subscription. No hidden fees.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Import Your Profile</h3>
                <p className="text-gray-600">
                  Connect LinkedIn or manually enter your experience, education, and skills.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Paste Job Description</h3>
                <p className="text-gray-600">
                  Copy and paste the job posting you want to apply for.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Generate & Download</h3>
                <p className="text-gray-600">
                  AI creates your tailored resume in seconds. Download and apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands using AI-optimized resumes.
          </p>
          <Button size="lg" asChild>
            <Link href="/generate">Start Building Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2026 Resume Builder. Powered by Together.ai</p>
        </div>
      </footer>
    </div>
  );
}
