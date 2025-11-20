import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, FileText, Calculator, Shield, TrendingUp } from "lucide-react"

export default function TaxPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/tax-forms-and-documents-with-calculator.jpg"
            alt="Tax documents and calculator"
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <FileText className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Tax Services</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Strategic tax advice, VAT registration assistance, and compliance guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Expert Tax Solutions</h2>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Navigate complex tax regulations with confidence. Our tax experts ensure compliance while optimizing
                your tax position for maximum savings.
              </p>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                From VAT registration assistance to strategic tax advice, we provide tailored tax advice for your
                business needs.
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold">What's Included:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    VAT registration assistance and compliance guidance
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Corporate tax advice and support for filings
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Personal income tax advice
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Tax advice and optimization strategies
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Tax audit support
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    International tax advice
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="mb-6">
                <img
                  src="/accounting-calculator-and-financial-documents-on-d.jpg"
                  alt="Tax planning and strategy consultation"
                  className="w-full h-64 object-cover rounded-lg shadow-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <Calculator className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Tax Planning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Strategic planning to legally minimize tax liability</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Guidance to help you stay compliant with tax regulations</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">VAT Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>VAT registration assistance and ongoing compliance guidance</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Advisory focused on efficiency and savings opportunities</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Note */}
      <section className="pt-0 section-padding">
        <div className="container-custom">
          <p className="text-sm text-muted-foreground max-w-4xl">
            Disclaimer: We provide accounting and tax advice and administrative assistance. We do not offer regulated
            legal services or act as a licensed fiduciary. Where required, regulated activities are performed by the
            client or by suitably licensed partners, and we provide advisory and coordination support only.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-muted/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img
            src="/business-success-and-growth-pattern.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Need Tax Expertise?</h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Let our tax professionals advise on compliance and optimization needs.
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
