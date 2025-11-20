import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, TrendingUp, Home, Zap, PieChart } from "lucide-react"

export default function InvestmentsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/investment-charts-and-financial-growth-graphs.jpg"
            alt="Investment charts and financial growth graphs"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <TrendingUp className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Investment Services</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Explore opportunities in real estate, renewable energy, and equity markets.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Strategic Investment Opportunities</h2>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Diversify your portfolio with carefully selected investment opportunities across multiple sectors. We
                provide expert guidance to help you make informed investment decisions.
              </p>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                From real estate ventures to renewable energy projects and equity investments, we offer access to
                premium opportunities with strong growth potential.
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold">Investment Areas:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Commercial and residential real estate
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Renewable energy projects and infrastructure
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Equity investments in growing companies
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Portfolio diversification strategies
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Risk assessment and management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Investment performance monitoring
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="mb-6">
                <img
                  src="/financial-charts-and-accounting-software-on-comput.jpg"
                  alt="Investment portfolio analysis and planning"
                  className="w-full h-64 object-cover rounded-lg shadow-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <Home className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Real Estate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Premium commercial and residential property investments</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Zap className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Renewable Energy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Sustainable energy projects with strong returns</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <PieChart className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Equity Markets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Strategic equity investments in growth companies</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Portfolio Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Portfolio monitoring and optimization advisory</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pt-0 section-padding">
        <div className="container-custom">
          <p className="text-sm text-muted-foreground max-w-4xl">
            Disclaimer: We provide access to investment opportunities and administrative assistance. We do not offer any
            investment management or any regulated investment services or act as a licensed fiduciary. Where required,
            regulated activities are performed by the client or by suitably licensed partners, and we provide advisory
            and coordination support only.
          </p>
        </div>
      </section>

      {/* Investment Types Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Investment Opportunities</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Explore our diverse range of investment options
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img
                  src="/modern-business-office-building-exterior.jpg"
                  alt="Modern real estate investment property"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 text-primary mr-2" />
                  Real Estate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Premium commercial and residential properties with strong appreciation potential and steady rental
                  income.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img
                  src="/business-success-and-growth-pattern.jpg"
                  alt="Renewable energy investment"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 text-primary mr-2" />
                  Renewable Energy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sustainable energy projects including solar, wind, and green infrastructure with government
                  incentives.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img
                  src="/investment-charts-and-financial-growth-graphs.jpg"
                  alt="Equity market trading and investments"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 text-primary mr-2" />
                  Equity Markets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Strategic equity investments in high-growth companies and emerging markets with strong fundamentals.
                </CardDescription>
              </CardContent>
            </Card>
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
            <h2 className="text-3xl font-bold mb-6">Ready to Invest in Your Future?</h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Discover premium investment opportunities tailored to your financial goals.
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
