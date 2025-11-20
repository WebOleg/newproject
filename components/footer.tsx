import Link from "next/link"
import Image from "next/image"

export function Footer() {
  const services = [
    { name: "Accounting Services", href: "/services/accounting" },
    { name: "Tax Services", href: "/services/tax" },
    { name: "Payroll & HR", href: "/services/payroll" },
    { name: "Business Consulting", href: "/services/consulting" },
    { name: "Company Registration", href: "/services/registration" },
    { name: "Investment Services", href: "/services/investments" },
  ]

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/favicon.png"
                alt="MeLinux icon"
                height={32}
                width={32}
                className="h-8 w-8"
                priority
              />
              <span className="font-bold text-xl">MELINUX</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Smart solutions for your business. We provide consulting, technology, and tailored services to help your
              company grow.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Services</h3>
            <ul className="space-y-2">
              {services.slice(0, 4).map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Info</h3>
            <div className="space-y-2 text-sm">
              <p className="text-primary-foreground/80">Protara Leoforos No.259M, Kykladon B Block M, Flat 3</p>
              <p className="text-primary-foreground/80">Paralimni 5291, Cyprus</p>
              <p className="text-primary-foreground/80">+357 99 746668</p>
              <p className="text-primary-foreground/80">mail@melinux.net</p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/60 text-sm">© 2025 Melinux. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
