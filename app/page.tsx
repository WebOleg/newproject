import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollAnimation } from "@/components/scroll-animation"
import {
  ArrowRight,
  Lightbulb,
  Calculator,
  FileText,
  Landmark,
  Rocket,
  Users2,
  Building,
  Briefcase,
  TrendingUp,
  Target,
  ThumbsUp,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/modern-business-office-with-glass-windows-and-city.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            fetchPriority="high"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/60 to-black/70"></div>
        </div>

          <div className="relative z-10 container-custom text-center text-white">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
              LOREM IPSUM DOLOR SIT AMET
            </h1>
          </div>
          <div className="animate-fade-in animate-delay-200">
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto text-pretty">
              Lorem ipsum dolor sit amet consectetur adipiscing elit
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
