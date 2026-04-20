import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default:
      "La Mascotera — Pet shop online del NOA | Alimentos, Accesorios, Veterinaria",
    template: "%s | La Mascotera",
  },
  description:
    "Pet shop online con +40 sucursales en el NOA. Alimentos balanceados, accesorios, peluquería canina y televeterinaria. Envíos a todo el país y retiro en sucursal sin cargo.",
  keywords: [
    "pet shop",
    "alimento para perros",
    "alimento para gatos",
    "veterinaria online",
    "peluquería canina",
    "La Mascotera",
    "Tucumán",
    "Salta",
    "NOA",
  ],
  authors: [{ name: "La Mascotera" }],
  creator: "La Mascotera",
  publisher: "La Mascotera",
  formatDetection: { telephone: true, email: true, address: true },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
    languages: { "es-AR": "/ar" },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "La Mascotera",
    title: "La Mascotera — Pet shop online del NOA",
    description:
      "+40 sucursales. Alimento, accesorios, veterinaria y peluquería canina. Envíos a todo el país.",
    images: [
      {
        url: "/images/brand/logo.png",
        width: 1200,
        height: 630,
        alt: "La Mascotera",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "La Mascotera — Pet shop online del NOA",
    description:
      "Alimento, accesorios, veterinaria y peluquería. +40 sucursales en el NOA.",
    images: ["/images/brand/logo.png"],
  },
  icons: {
    icon: "/images/brand/logo.png",
    shortcut: "/images/brand/logo.png",
    apple: "/images/brand/logo.png",
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#f6a906",
}

// Organization-level JSON-LD (applies to all pages)
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "PetStore",
  "@id": "https://lamascotera.com.ar/#organization",
  name: "La Mascotera",
  url: "https://lamascotera.com.ar",
  logo: "https://lamascotera.com.ar/images/brand/logo.png",
  description:
    "Pet shop online con +40 sucursales en el NOA. Alimentos balanceados, accesorios, peluquería canina y televeterinaria.",
  email: "soportelamascotera@gmail.com",
  telephone: "+54-381-239-1001",
  priceRange: "$$",
  areaServed: [
    { "@type": "State", name: "Tucumán" },
    { "@type": "State", name: "Salta" },
    { "@type": "State", name: "Catamarca" },
    { "@type": "State", name: "Jujuy" },
    { "@type": "State", name: "Chaco" },
    { "@type": "State", name: "Mendoza" },
    { "@type": "State", name: "Córdoba" },
    { "@type": "State", name: "Neuquén" },
  ],
  sameAs: [
    "https://www.instagram.com/lamascotera.noa/",
    "https://www.facebook.com/lamascotera",
    "https://lamascoteranoa.com.ar",
    "https://lamascoteraneuquen.com.ar",
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "20:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "10:00",
      closes: "20:00",
    },
  ],
  paymentAccepted: ["Cash", "Credit Card", "Debit Card", "Mercado Pago", "Transferencia"],
  currenciesAccepted: "ARS",
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://lamascotera.com.ar/#website",
  url: "https://lamascotera.com.ar",
  name: "La Mascotera",
  description: "Pet shop online del NOA",
  publisher: { "@id": "https://lamascotera.com.ar/#organization" },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://lamascotera.com.ar/ar/store?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
  inLanguage: "es-AR",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" data-mode="light">
      <head>
        <link rel="alternate" hrefLang="es-AR" href="https://lamascotera.com.ar/ar" />
        <link rel="alternate" hrefLang="x-default" href="https://lamascotera.com.ar/ar" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
