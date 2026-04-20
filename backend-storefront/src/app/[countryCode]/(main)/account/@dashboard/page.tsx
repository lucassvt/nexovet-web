// Reemplaza: src/app/[countryCode]/(main)/account/@dashboard/page.tsx
import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getClubSaldo } from "@lib/data/club"

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Resumen de tu cuenta y Club La Mascotera.",
}

type PageProps = {
  searchParams?: Promise<{ welcome?: string }>
}

export default async function OverviewTemplate({ searchParams }: PageProps) {
  const customer = await retrieveCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null
  const saldo = (await getClubSaldo().catch(() => null)) || null
  const params = (await searchParams) || {}
  const showWelcome = params.welcome === "1"

  if (!customer) {
    notFound()
  }

  return (
    <Overview
      customer={customer}
      orders={orders}
      saldo={saldo}
      showWelcome={showWelcome}
    />
  )
}
