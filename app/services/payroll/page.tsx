import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Users2, Clock, Shield, FileCheck } from "lucide-react"

export default function PayrollPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hr-team-working-with-employee-documents-and-payrol.jpg"
            alt="HR team working with payroll documents"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Users2 className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Payroll & HR Services</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Employee contracts, payroll processing, and HR administration.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Complete HR & Payroll Solutions</h2>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Streamline your human resources operations with our comprehensive payroll and HR services. We handle the
                complexities so you can focus on your business.
              </p>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                From employee onboarding to payroll processing and compliance, we provide end-to-end HR support for
                businesses of all sizes.
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold">What's Included:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Monthly payroll processing and payments
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Employee contract preparation and management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Labor law compliance and updates
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Social security and tax calculations
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    HR policy development and implementation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Employee records management
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="mb-6">
                <img
                  src="/diverse-team-collaboration.png"
                  alt="HR team collaboration and payroll processing"
                  className="w-full h-64 object-cover rounded-lg shadow-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <Clock className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Payroll Processing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Accurate and timely payroll processing every month</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <FileCheck className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Contracts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Professional employment contract preparation</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Full labor law compliance and regulatory updates</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Users2 className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">HR Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Comprehensive HR administration and support</CardDescription>
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
            src="/modern-office-space-with-professional-team-collabo.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Simplify Your HR Operations</h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Let us handle your payroll and HR needs while you focus on growing your business.
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
