import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollAnimation } from "@/components/scroll-animation"
import {
  ArrowRight,
  Lightbulb,
  Calculator,
  FileText,
  Landmark,
  Rocket,
  Users2,
  Building,
  Briefcase,
  TrendingUp,
  Target,
  ThumbsUp,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/modern-business-office-with-glass-windows-and-city.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            fetchPriority="high"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/60 to-black/70"></div>
        </div>

          <div className="relative z-10 container-custom text-center text-white">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
              LOREM IPSUM DOLOR SIT AMET
            </h1>
          </div>
          <div className="animate-fade-in animate-delay-200">
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto text-pretty">
              Lorem ipsum dolor sit amet consectetur adipiscing elit
            </p>
          </div>
          <div className="animate-fade-in animate-delay-400">
            <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 btn-animate transition-smooth">
              <Link href="#services">
                OUR SERVICES
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Overview Grid */}
      <section id="services" className="section-padding bg-muted/50">
        <div className="container-custom">
          <ScrollAnimation animation="fade-in-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">OUR SERVICES</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Comprehensive business solutions tailored to your needs
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            <ScrollAnimation animation="scale-in" delay={100}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/accounting-calculator-and-financial-documents-on-d.jpg"
                    alt="Accounting services"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Calculator className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Accounting services</CardTitle>
                  <CardDescription>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore...</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/accounting">
                      Explore Accounting Services
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={250}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/factory_services.png"
                    alt="Factoring services"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Landmark className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Factoring Services</CardTitle>
                  <CardDescription>Improve cash flow by converting invoices into immediate working capital under a compliant framework.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/factoring">
                      Explore Factoring Services
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={275}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/modern-office-reception-area-with-professional-atm.jpg"
                    alt="Unreal Factoring"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Rocket className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Unreal Factoring</CardTitle>
                  <CardDescription>Premium factoring for high‑velocity teams: faster cycles, transparent tracking, bank‑grade security.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/unreal-factoring">
                      Explore Unreal Factoring
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={200}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/tax-forms-and-documents-with-calculator.jpg"
                    alt="Tax services"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <FileText className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Tax advice in Cyprus</CardTitle>
                  <CardDescription>Advisory on tax matters, compliance guidance, and VAT registration assistance tailored to your needs.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/tax">
                      Explore Tax Services
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={300}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/hr-team-working-with-employee-documents-and-payrol.jpg"
                    alt="Payroll and HR services"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Users2 className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Payroll services in Cyprus</CardTitle>
                  <CardDescription>We offer you all necessary payroll services for management of administrative processes, related to payroll processing and HR administration.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/payroll">
                      Explore Payroll Services
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={400}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/business-consultants-presenting-strategy-charts-to.jpg"
                    alt="Business consulting"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Briefcase className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Business Consulting</CardTitle>
                  <CardDescription>Use our knowledge to improve your managerial decisions. We can help you act better if you are in uncertain environment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/consulting">
                      Explore Business Consulting
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={500}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/legal-documents-and-company-registration-papers.jpg"
                    alt="Company registration"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Building className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Company Registration</CardTitle>
                  <CardDescription>Save yourself the bureaucratic and legal hurdles to incorporate and register a new firm in Cyprus.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/registration">
                      Explore Company Registration
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={600}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/project-management-team-working-with-charts-and-pl.jpg"
                    alt="Project management"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Briefcase className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Project management</CardTitle>
                  <CardDescription>Because the management is the heart of the project we could offer the planning and managing the effort to accomplish a successful project.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/consulting">
                      Learn about Project Management
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={700}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/investment-charts-and-financial-growth-graphs.jpg"
                    alt="Equity investments"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <TrendingUp className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Equity investments across the board</CardTitle>
                  <CardDescription>Our company manages equity portfolios of listed companies in the Balkans and in Europe. We evaluate investment opportunities and participate in new ventures across different industries.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/investments">
                      Explore Equity Investments
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={800}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/business-success-and-growth-pattern.jpg"
                    alt="Renewable energy investments"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Lightbulb className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Renewable Energy Investments</CardTitle>
                  <CardDescription>Due to the constantly rising energy prices investments in renewable energy appear to be particularly lucrative.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/investments">
                      Explore Renewable Energy Investments
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation animation="scale-in" delay={900}>
              <Card className="group card-animate overflow-hidden">
                <div className="relative h-48 overflow-hidden image-zoom">
                  <Image
                    src="/modern-business-office-building-exterior.jpg"
                    alt="Real estate investments"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Building className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                </div>
                <CardHeader>
                  <CardTitle>Real Estate investments</CardTitle>
                  <CardDescription>Successful undertakings are the Investments in real estate in Cyprus with closer examination of the specific circumstances.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="transition-transform-smooth group-hover:translate-x-1">
                    <Link href="/services/investments">
                      Explore Real Estate Investments
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollAnimation animation="fade-in-left">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">More About Us</h2>
                <p className="text-lg text-muted-foreground mb-6 text-pretty">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.
                </p>
                <p className="text-lg text-muted-foreground mb-8 text-pretty">
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation animation="fade-in-right" delay={200}>
              <div className="relative image-zoom">
                <img
                  src="/professional-business-team-meeting-in-modern-confe.jpg"
                  alt="Professional business team"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Aim and Expectations */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <img
                src="/modern-office-space-with-professional-team-collabo.jpg"
                alt="Professional team collaboration"
                className="w-full h-full object-cover opacity-10"
              />
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
              <ScrollAnimation animation="fade-in-up" delay={100}>
                <div className="text-center hover-lift transition-smooth">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">What is our aim</h3>
                  <p className="text-muted-foreground text-pretty">Our aim is to find the best tax strategy and planning for your business. You will be supported by a dedicated team of professionals…</p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation animation="fade-in-up" delay={200}>
                <div className="text-center hover-lift transition-smooth">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ThumbsUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">What can you expect from us</h3>
                  <p className="text-muted-foreground text-pretty">Our approach to advice will enable you to reap the benefits of having your accountant under the same roof as an independent legal adviser…</p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Service */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/project-management-team-working-with-charts-and-pl.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-primary/90"></div>
        </div>
        <div className="relative container-custom">
          <ScrollAnimation animation="fade-in-up">
            <div className="max-w-4xl mx-auto text-center text-primary-foreground">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Project management</h2>
              <p className="text-xl mb-8 text-primary-foreground/90 text-pretty">Because the management is the heart of the project we could offer the planning and managing the effort to accomplish a successful project.</p>
              <Button size="lg" variant="secondary" className="btn-animate transition-smooth">
                <Link href="/services/consulting" className="flex flex-row items-center justify-center">
                  Discover More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <ScrollAnimation animation="fade-in-up">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">YOU NEED PROFESSIONAL SERVICES, ATTITUDE AND CONFIDENTIALITY?</h2>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  )
}
