import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollAnimation } from "@/components/scroll-animation"
import { ArrowRight, Users, Target, Award, Globe } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <img
            src="/business-team-office.png"
            alt=""
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">About Us</h1>
            </div>
            <div className="animate-fade-in animate-delay-200">
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <ScrollAnimation animation="fade-in-left">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <p className="text-lg text-muted-foreground mb-6 text-pretty">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p className="text-lg text-muted-foreground mb-8 text-pretty">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animation="fade-in-right" delay={200}>
              <div className="relative image-zoom">
                <img
                  src="/diverse-team-collaboration.png"
                  alt="Our professional team"
                  className="w-full h-auto rounded-2xl shadow-lg"
                />
              </div>
            </ScrollAnimation>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <ScrollAnimation animation="fade-in-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Values</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                  The principles that guide everything we do
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ScrollAnimation animation="scale-in" delay={100}>
                <Card className="text-center card-animate hover-lift">
                  <CardHeader>
                    <Users className="h-12 w-12 text-primary mx-auto mb-4 transition-transform-smooth hover:scale-110" />
                    <CardTitle>Value One</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Lorem ipsum dolor sit amet consectetur adipiscing elit</CardDescription>
                  </CardContent>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation animation="scale-in" delay={200}>
                <Card className="text-center card-animate hover-lift">
                  <CardHeader>
                    <Target className="h-12 w-12 text-primary mx-auto mb-4 transition-transform-smooth hover:scale-110" />
                    <CardTitle>Value Two</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Sed do eiusmod tempor incididunt ut labore et dolore</CardDescription>
                  </CardContent>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation animation="scale-in" delay={300}>
                <Card className="text-center card-animate hover-lift">
                  <CardHeader>
                    <Award className="h-12 w-12 text-primary mx-auto mb-4 transition-transform-smooth hover:scale-110" />
                    <CardTitle>Value Three</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Ut enim ad minim veniam quis nostrud exercitation</CardDescription>
                  </CardContent>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation animation="scale-in" delay={400}>
                <Card className="text-center card-animate hover-lift">
                  <CardHeader>
                    <Globe className="h-12 w-12 text-primary mx-auto mb-4 transition-transform-smooth hover:scale-110" />
                    <CardTitle>Value Four</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Duis aute irure dolor in reprehenderit in voluptate</CardDescription>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            </div>
          </div>



          {/* Mission Section */}
          <ScrollAnimation animation="fade-in-up">
            <div className="bg-muted/50 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden hover-lift transition-smooth">
              <div className="absolute inset-0 opacity-5">
                <img src="/abstract-business-growth-pattern.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-xl text-muted-foreground max-w-4xl mx-auto text-pretty">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
                </p>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-custom">
          <ScrollAnimation animation="fade-in-up">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Work Together?</h2>
              <p className="text-xl mb-8 text-primary-foreground/90 text-pretty">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              <Button size="lg" variant="secondary" className="btn-animate transition-smooth hover-lift">
                <Link href="/contact" className="flex flex-row items-center justify-center">
                  Contact Us
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  )
}
