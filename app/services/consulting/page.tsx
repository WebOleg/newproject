import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Briefcase, TrendingUp, Target, Lightbulb } from "lucide-react"

export default function ConsultingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/business-consultants-presenting-strategy-charts-to.jpg"
            alt="Business consultants presenting strategy"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Briefcase className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Business Consulting</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Customized advisory for growth, restructuring, and efficiency.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Strategic Business Guidance</h2>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Transform your business with expert consulting services. We provide strategic guidance to help you
                overcome challenges and achieve sustainable growth.
              </p>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                Our experienced consultants work closely with you to develop customized solutions that drive operational
                efficiency and business success.
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold">What's Included:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Business strategy development and planning
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Operational efficiency optimization
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Market analysis and competitive positioning
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Financial restructuring and optimization
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Change management and implementation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Performance measurement and KPI development
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="mb-6">
                <img
                  src="/professional-business-team-meeting-in-modern-confe.jpg"
                  alt="Business strategy consultation meeting"
                  className="w-full h-64 object-cover rounded-lg shadow-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <Target className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Comprehensive business strategy development</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Sustainable growth planning and execution</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Lightbulb className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Innovation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Process innovation and efficiency improvements</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Briefcase className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Implementation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Hands-on support for strategy implementation</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-muted/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img
            src="/abstract-business-growth-pattern.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Partner with our expert consultants to unlock your business potential.
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
