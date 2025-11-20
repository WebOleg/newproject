import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://melinux.net"
  const now = new Date()

  const routes = [
    "",
    "/about",
    "/contact",
    "/terms",
    "/services/accounting",
    "/services/tax",
    "/services/payroll",
    "/services/consulting",
    "/services/registration",
    "/services/investments",
    "/services/factoring",
    "/services/unreal-factoring",
    "/privacy",
  ]

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }))
}


