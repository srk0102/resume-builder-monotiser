import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Target, Sparkles, Download, Upload, Check } from "lucide-react";

export default function Home() {
  const plans = [
    {
      name: 'Basic Pack',
      price: '$5',
      popular: true,
      features: [
        '5 resume extractions',
        '55 resume generations',
        'All AI features included',
        'Multiple export themes',
        'ATS optimization',
        'Credits valid for 30 days',
        'No refunds',
      ],
    },
    {
      name: 'Pro Pack',
      price: '$15',
      popular: false,
      features: [
        '15 resume extractions',
        '200 resume generations',
        'All AI features included',
        'Multiple export themes',
        'ATS optimization',
        'Priority support',
        'Credits valid for 30 days',
        'No refunds',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Resume Builder</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground">
          ATS-Optimized Resumes in Seconds
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Generate professional, job-specific resumes tailored to any position.
          Powered by AI, optimized for applicant tracking systems.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">Start Building</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#pricing">View Pricing</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
          <div>
            <div className="text-3xl font-bold text-foreground">$0.09</div>
            <div className="text-sm text-muted-foreground">Per resume</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">30s</div>
            <div className="text-sm text-muted-foreground">Generation time</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">10</div>
            <div className="text-sm text-muted-foreground">Professional themes</div>
          </div>
        </div>
      </section>

      {/* Demo Showcase */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">See It In Action</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Here&apos;s a sample resume generated for a Software Engineer role — tailored to the job description in seconds.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
            {/* Sample JD */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sample Job Description</h3>
              <Card className="border">
                <CardContent className="p-5 text-sm text-muted-foreground space-y-3">
                  <p className="font-semibold text-foreground text-base">Senior Software Engineer — TechCorp Inc.</p>
                  <p>We are looking for a Senior Software Engineer to join our platform team. You will design and build scalable microservices, collaborate with cross-functional teams, and mentor junior developers.</p>
                  <p><strong className="text-foreground">Requirements:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>5+ years experience with Node.js, TypeScript, and React</li>
                    <li>Experience with AWS (Lambda, S3, DynamoDB)</li>
                    <li>Strong understanding of CI/CD pipelines and Docker</li>
                    <li>Experience with PostgreSQL and Redis</li>
                    <li>Excellent communication and mentoring skills</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="mt-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm font-medium text-foreground mb-1">AI analyzes this JD and:</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Extracts 20+ keywords (Node.js, AWS, CI/CD, etc.)</li>
                  <li>Rewrites your bullet points to match requirements</li>
                  <li>Generates an ATS-optimized professional summary</li>
                  <li>Groups skills into relevant categories</li>
                </ul>
              </div>
            </div>

            {/* Sample Generated Resume */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Generated Resume</h3>
              <Card className="border">
                <CardContent className="p-5 text-sm space-y-4">
                  <div className="border-b pb-3">
                    <p className="text-lg font-bold text-foreground">John Anderson</p>
                    <p className="text-primary text-sm">Senior Software Engineer</p>
                    <p className="text-xs text-muted-foreground mt-1">john.anderson@email.com · +1 (555) 123-4567 · San Francisco, CA</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Summary</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Senior Software Engineer with 10 years of experience building scalable microservices and cloud-native applications. Proven track record in Node.js, TypeScript, and AWS infrastructure, with expertise in CI/CD pipelines and cross-functional collaboration.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Experience</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between">
                          <p className="text-xs font-semibold text-foreground">Lead Engineer — CloudScale Inc.</p>
                          <p className="text-xs text-muted-foreground">2021 – Present</p>
                        </div>
                        <ul className="text-xs text-muted-foreground ml-4 list-disc space-y-0.5 mt-1">
                          <li>Architected microservices platform handling 2M+ daily requests using Node.js, TypeScript, and Docker</li>
                          <li>Reduced deployment time by 60% by implementing CI/CD pipelines with GitHub Actions and AWS Lambda</li>
                          <li>Mentored 4 junior developers, establishing code review standards and pair programming practices</li>
                        </ul>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <p className="text-xs font-semibold text-foreground">Software Engineer — DataFlow Systems</p>
                          <p className="text-xs text-muted-foreground">2018 – 2021</p>
                        </div>
                        <ul className="text-xs text-muted-foreground ml-4 list-disc space-y-0.5 mt-1">
                          <li>Built real-time data pipelines using Node.js, Redis, and PostgreSQL serving 500K+ users</li>
                          <li>Migrated legacy monolith to AWS microservices (S3, DynamoDB, Lambda), reducing costs by 40%</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Skills</p>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Languages:</strong> TypeScript, JavaScript, Python · <strong className="text-foreground">Backend:</strong> Node.js, Express, Redis, PostgreSQL · <strong className="text-foreground">Cloud:</strong> AWS Lambda, S3, DynamoDB, Docker, CI/CD
                    </p>
                  </div>
                </CardContent>
              </Card>
              <p className="text-center text-xs text-muted-foreground mt-3">
                This is a static demo. Sign up to generate your own tailored resumes.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Button size="lg" asChild>
              <Link href="/signup">Generate Your Resume Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Everything You Need
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <Upload className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Resume Import</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload your existing resume (PDF/DOCX) and AI automatically extracts your experience and skills.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>ATS Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automatically extract keywords from job descriptions to pass ATS filters.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Job Specific</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tailored content for each position highlighting your most relevant skills.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI analyzes job descriptions, extracts keywords, and tailors each bullet point.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Multiple Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose from 10 professional themes. Edit and preview in real-time before exporting.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Download className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Export Anywhere</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Download as HTML or print to PDF. Ready to submit to any job application.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Simple, One-Time Pricing</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            No subscriptions. No recurring charges. Buy credits, use them within 30 days.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.popular ? 'border-2 border-primary relative' : ''}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">one-time</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            How It Works
          </h2>

          <div className="max-w-3xl mx-auto space-y-8">
            {[
              { step: '1', title: 'Build Your Portfolio', desc: 'Upload your resume or manually enter your experience, education, and skills.' },
              { step: '2', title: 'Paste Job Description', desc: 'Copy and paste the job posting you want to apply for.' },
              { step: '3', title: 'Generate & Download', desc: 'AI creates your tailored resume in seconds. Edit, choose a theme, and download.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Generate ATS-optimized resumes tailored to every job you apply for.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">Start Building Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">© 2026 Resume Builder. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
