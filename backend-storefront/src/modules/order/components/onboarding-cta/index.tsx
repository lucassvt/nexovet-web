"use client"

import { resetOnboardingState } from "@lib/data/onboarding"
import { Button, Container, Text } from "@medusajs/ui"

const OnboardingCta = ({ orderId }: { orderId: string }) => {
  return (
    <Container className="max-w-4xl h-full bg-ui-bg-subtle w-full">
      <div className="flex flex-col gap-y-4 center p-4 md:items-center">
        <Text className="text-ui-fg-base text-xl">
          ¡Tu pedido de prueba se creó correctamente! 🎉
        </Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          Ahora podés terminar de configurar tu tienda desde el admin.
        </Text>
        <Button
          className="w-fit"
          size="xlarge"
          onClick={() => resetOnboardingState(orderId)}
        >
          Terminar la configuración en el admin
        </Button>
      </div>
    </Container>
  )
}

export default OnboardingCta
