"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const services = [
    { name: "Accounting Services", href: "/services/accounting" },
    { name: "Tax Services", href: "/services/tax" },
    { name: "Payroll & HR", href: "/services/payroll" },
    { name: "Business Consulting", href: "/services/consulting" },
    { name: "Company Registration", href: "/services/registration" },
    { name: "Investment Services", href: "/services/investments" },
    { name: "Factoring Services", href: "/services/factoring" },
    { name: "Unreal Factoring", href: "/services/unreal-factoring" },
  ]

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b border-border transition-all duration-300">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover-scale transition-transform-smooth">
            <span className="font-bold text-xl">testingiscool</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="nav-link text-foreground hover:text-accent transition-colors-smooth">
              Home
            </Link>
            <div className="relative group">
              <button className="nav-link text-foreground hover:text-accent transition-colors-smooth flex items-center">
                Services
                <svg
                  className="ml-1 h-4 w-4 transition-transform-smooth group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="py-2">
                  {services.map((service, index) => (
                    <Link
                      key={service.href}
                      href={service.href}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors-smooth hover:translate-x-1 transition-transform-smooth"
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/contact" className="nav-link text-foreground hover:text-accent transition-colors-smooth">
              Contact
            </Link>
            <Button asChild className="btn-animate transition-smooth hover-lift">
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden transition-transform-smooth hover:scale-110"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <div
              className="transition-transform-smooth duration-300"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          id="mobile-nav"
          aria-hidden={!isOpen}
          className={`md:hidden border-t border-border overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="py-4 space-y-4">
            <Link
              href="/"
              className="block text-foreground hover:text-accent transition-colors-smooth hover:translate-x-2 transition-transform-smooth"
            >
              Home
            </Link>
            <div className="space-y-2">
              <span className="block text-foreground font-medium">Services</span>
              {services.map((service, index) => (
                <Link
                  key={service.href}
                  href={service.href}
                  className="block pl-4 text-sm text-muted-foreground hover:text-accent transition-colors-smooth hover:translate-x-2 transition-transform-smooth"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  {service.name}
                </Link>
              ))}
            </div>
            <Link
              href="/contact"
              className="block text-foreground hover:text-accent transition-colors-smooth hover:translate-x-2 transition-transform-smooth"
            >
              Contact
            </Link>
            <Button asChild className="w-full btn-animate transition-smooth">
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
