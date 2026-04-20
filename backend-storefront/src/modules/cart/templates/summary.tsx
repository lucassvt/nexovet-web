"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MPCheckoutButton from "@modules/checkout/components/mp-checkout-button"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Resumen
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />

      {/* Pago directo con Mercado Pago (más rápido) */}
      <div className="mt-2">
        <MPCheckoutButton cart={cart} data-testid="cart-mp-checkout" />
      </div>

      <div className="relative flex items-center my-2">
        <div className="flex-grow border-t border-gray-200" />
        <span className="px-3 text-xs text-gray-400 uppercase">o</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>

      {/* Checkout tradicional Medusa (address + shipping + payment) */}
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button variant="secondary" className="w-full h-10">
          Checkout completo (ingresar datos)
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
