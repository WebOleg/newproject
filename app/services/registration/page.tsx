import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Building, FileCheck, Shield, Users } from "lucide-react"

export default function RegistrationPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/legal-documents-and-company-registration-papers.jpg"
            alt="Legal documents and company registration papers"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Building className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Company Registration</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              End-to-end assistance in establishing and registering companies.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Complete Company Setup</h2>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">
                Start your business journey with confidence. We handle all aspects of company registration, from initial planning to final registration and beyond. Tell us about your business and we will handle the rest through our network of legal partners.
              </p>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                Our comprehensive service ensures your company is properly established with all necessary legal
                requirements met from day one.
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold">What's Included:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Company name reservation and verification
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Articles of incorporation preparation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Legal structure consultation and setup
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Registration with relevant authorities
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Tax registration and compliance setup
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Banking assistance and account setup
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="mb-6">
                <img
                  src="/modern-office-reception-area-with-professional-atm.jpg"
                  alt="Company registration process and legal documentation"
                  className="w-full h-64 object-cover rounded-lg shadow-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <FileCheck className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Documentation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Complete preparation of all required documents</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Legal Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Ensuring full compliance with all regulations</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Building className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Registration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Official company registration with authorities</CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Ongoing Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Continued support after registration completion</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Process Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Registration Process</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Our streamlined process makes company registration simple and efficient
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Consultation</h3>
                <p className="text-sm text-muted-foreground">
                  Initial consultation to understand your business needs and structure
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                <p className="text-sm text-muted-foreground">
                  Preparation of all required legal documents and paperwork
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Registration</h3>
                <p className="text-sm text-muted-foreground">
                  Official registration with government authorities and agencies
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Completion</h3>
                <p className="text-sm text-muted-foreground">
                  Final setup including banking and ongoing compliance support
                </p>
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
            <h2 className="text-3xl font-bold mb-6">Ready to Start Your Company?</h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Let us handle the complexities of company registration while you focus on your business vision.
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
