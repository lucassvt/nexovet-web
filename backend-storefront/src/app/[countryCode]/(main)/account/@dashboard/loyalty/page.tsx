// Destino: src/app/[countryCode]/(main)/account/@dashboard/loyalty/page.tsx
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import { getClubSaldo } from "@lib/data/club"
import LoyaltyHistory from "@modules/club/loyalty-history"

export const metadata: Metadata = {
  title: "Mis puntos — Club La Mascotera",
  description: "Historial de puntos del Club La Mascotera.",
}

export default async function LoyaltyPage() {
  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) {
    notFound()
  }

  const saldo = (await getClubSaldo().catch(() => null)) || null

  return (
    <div className="w-full" data-testid="loyalty-page">
      <LoyaltyHistory saldo={saldo} />
    </div>
  )
}
