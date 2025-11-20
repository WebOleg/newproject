import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, ShieldCheck, Rocket, Layers, Activity, LineChart } from "lucide-react"

export default function UnrealFactoringPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative section-padding overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/modern-office-reception-area-with-professional-atm.jpg"
            alt="Modern financial operations hub"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60"></div>
        </div>
        <div className="relative container-custom">
          <div className="max-w-4xl mx-auto text-center text-white">
            <Rocket className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Unreal Factoring</h1>
            <p className="text-xl mb-8 text-white/90 text-pretty">
              A premium factoring solution designed for high‑velocity businesses that demand speed, visibility, and robust compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Unreal Factoring?</h2>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Unreal Factoring combines fast settlement timelines with granular transparency over each receivable. You submit invoice data, and we coordinate compliant administration and payout via our financial partners.
              </p>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                You’ll get a streamlined portal, proactive notifications, and bank‑grade security—keeping your team focused on operations while your working capital keeps flowing.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <ShieldCheck className="h-7 w-7 text-primary mb-1" />
                    <CardTitle className="text-base">Compliance First</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>GDPR and AML/KYC aligned process with secure data handling.</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <Activity className="h-7 w-7 text-primary mb-1" />
                    <CardTitle className="text-base">Fast Turnaround</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Accelerated funding cycles to keep your cash flow predictable.</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <Layers className="h-7 w-7 text-primary mb-1" />
                    <CardTitle className="text-base">Seamless Admin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>We handle submission, invoicing, and tracking end‑to‑end.</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <LineChart className="h-7 w-7 text-primary mb-1" />
                    <CardTitle className="text-base">Real‑time Visibility</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Portal access with live status and downloadable statements.</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <img
                src="/diverse-team-collaboration.png"
                alt="Dedicated team collaborating on finance operations"
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
              <img
                src="/abstract-business-growth-pattern.jpg"
                alt="Business growth abstract background"
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
            <h2 className="text-3xl font-bold mb-6">Scale Cash Flow With Confidence</h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              See how Unreal Factoring can accelerate your receivables and simplify operations.
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


