import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Calculator, BarChart3, FileSpreadsheet, PieChart } from "lucide-react"

export default function AccountingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative section-padding overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/professional-accountant-working-with-financial-doc.jpg"
            alt="Professional accounting workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60"></div>
        </div>
        <div className="relative container-custom">
          <div className="max-w-4xl mx-auto text-center text-white">
            <Calculator className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Accounting Services</h1>
            <p className="text-xl mb-8 text-white/90 text-pretty">
              Full bookkeeping, reporting, and financial analysis for businesses of all sizes.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Professional Accounting Solutions</h2>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Our comprehensive accounting services ensure your financial records are accurate, compliant, and provide
                valuable insights for business decision-making.
              </p>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                From daily bookkeeping to complex financial analysis, we handle all aspects of your accounting needs
                with precision and expertise.
              </p>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
              We will connect you with the best certified auditors and accountants in the EU.
              </p>
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold">What's Included:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Daily bookkeeping and transaction recording
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Monthly financial statements preparation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Accounts payable and receivable management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Bank reconciliation services
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Financial reporting and analysis
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Budget preparation and monitoring
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <img
                src="/financial-charts-and-accounting-software-on-comput.jpg"
                alt="Financial analysis and reporting"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Financial Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Comprehensive monthly and quarterly financial reporting</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <FileSpreadsheet className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Bookkeeping</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Accurate daily transaction recording and categorization</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <PieChart className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>In-depth financial analysis and business insights</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Calculator className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Ensuring all records meet regulatory requirements</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Streamline Your Accounting?</h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Contact us today to discuss how our accounting services can help your business grow.
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
