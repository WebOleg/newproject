import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Landmark, Receipt, ShieldCheck, Banknote, Percent, FolderLock } from "lucide-react"

export default function FactoringPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative section-padding overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/factory_services.png"
            alt="Factoring services overview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60"></div>
        </div>
        <div className="relative container-custom">
          <div className="max-w-4xl mx-auto text-center text-white">
            <Landmark className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Factoring Services</h1>
            <p className="text-xl mb-8 text-white/90 text-pretty">
              Improve cash flow by converting your invoices into immediate working capital under a clear, compliant framework.
            </p>
          </div>
        </div>
      </section>

      {/* What is factoring */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">What Is Factoring?</h2>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Factoring enables your company to sell eligible accounts receivable to a financial service provider and receive payment quickly, instead of waiting for customer due dates. Our role is to mediate, administer, and invoice those receivables with a licensed provider under a formal agreement.
              </p>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                This service is operated in cooperation with EU-based partners. It includes compliance with AML/KYC, data protection, secure transaction processing, and a dedicated online platform for transparent tracking of each receivable.
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold">Key Benefits</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Immediate liquidity and predictable cash flow
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Streamlined invoicing and administration via a secure platform
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Clear fees and due dates, with security deposits where applicable
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Compliance with GDPR and AML requirements
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <img
                src="/business-consultants-presenting-strategy-charts-to.jpg"
                alt="Cash flow strategy discussion"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <Receipt className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">1) Submit Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Provide transaction data for due receivables: debtor, amount, due date, purpose, and collection authorization.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Banknote className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">2) Funding & Settlement</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upon acceptance, funds are transferred per agreed due dates. A security deposit may be retained and released later.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <ShieldCheck className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">3) Compliance & Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full AML/KYC, GDPR, and platform access with support on banking days 09:00–18:00.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing highlights (from contract summary) */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Fees Overview</h2>
              <p className="text-lg text-muted-foreground text-pretty">
                Typical fee model per the framework: commissions on AT/DE products, transaction and chargeback costs, and transfer fees. A security deposit (e.g., 30%) may apply and is released after collection (e.g., after 8 weeks). Exact terms are finalized in your service schedule.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center"><Percent className="h-5 w-5 text-primary mr-2" /> Commission per market (e.g., AT 8%, DE 7%)</li>
                <li className="flex items-center"><Receipt className="h-5 w-5 text-primary mr-2" /> Transaction fee (e.g., €0.60 per transaction)</li>
                <li className="flex items-center"><FolderLock className="h-5 w-5 text-primary mr-2" /> Chargeback processing (market-specific)</li>
                <li className="flex items-center"><Banknote className="h-5 w-5 text-primary mr-2" /> Security deposit held then released post-collection</li>
              </ul>
            </div>

            <div className="space-y-6">
              <img
                src="/financial-charts-and-accounting-software-on-comput.jpg"
                alt="Overview of fees and deposits"
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
              <img
                src="/business-team-office.png"
                alt="Operations and support team"
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
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
            <h2 className="text-3xl font-bold mb-6">Unlock Your Working Capital</h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Speak with our team to evaluate your receivables and implement a compliant, fast factoring process.
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


