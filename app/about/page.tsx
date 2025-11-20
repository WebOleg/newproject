import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollAnimation } from "@/components/scroll-animation"
import { ArrowRight, Users, Target, Award, Globe } from "lucide-react"

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
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">About Melinux</h1>
            </div>
            <div className="animate-fade-in animate-delay-200">
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Melinux is a trusted partner in accounting, consulting, and investments. With years of experience, we
                combine local expertise with international standards.
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
                  Founded with a vision to provide comprehensive business solutions, Melinux has grown to become a
                  trusted partner for companies across various industries. We understand that every business is unique,
                  and we tailor our services to meet your specific needs.
                </p>
                <p className="text-lg text-muted-foreground mb-8 text-pretty">
                  Our team of experienced professionals brings together expertise in accounting, tax planning, human
                  resources, business consulting, and investment management. We're committed to helping your business
                  thrive in today's competitive landscape.
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
                    <CardTitle>Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Deep knowledge and experience across all our service areas</CardDescription>
                  </CardContent>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation animation="scale-in" delay={200}>
                <Card className="text-center card-animate hover-lift">
                  <CardHeader>
                    <Target className="h-12 w-12 text-primary mx-auto mb-4 transition-transform-smooth hover:scale-110" />
                    <CardTitle>Precision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Accurate, detailed work that meets the highest standards</CardDescription>
                  </CardContent>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation animation="scale-in" delay={300}>
                <Card className="text-center card-animate hover-lift">
                  <CardHeader>
                    <Award className="h-12 w-12 text-primary mx-auto mb-4 transition-transform-smooth hover:scale-110" />
                    <CardTitle>Excellence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Commitment to delivering exceptional results every time</CardDescription>
                  </CardContent>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation animation="scale-in" delay={400}>
                <Card className="text-center card-animate hover-lift">
                  <CardHeader>
                    <Globe className="h-12 w-12 text-primary mx-auto mb-4 transition-transform-smooth hover:scale-110" />
                    <CardTitle>Innovation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Modern solutions that keep pace with changing business needs</CardDescription>
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
                  To empower businesses with smart solutions that drive growth, ensure compliance, and create lasting
                  value. We're not just service providers – we're your strategic partners in success.
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
                Discover how Melinux can help your business reach its full potential.
              </p>
              <Button size="lg" variant="secondary" className="btn-animate transition-smooth hover-lift">
                <Link href="/contact" className="flex flex-row items-center justify-center">
                  Contact MeLinux
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
