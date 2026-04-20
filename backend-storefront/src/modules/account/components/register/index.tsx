"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signupClub } from "@lib/data/club"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signupClub, null)

  return (
    <div
      className="max-w-md w-full flex flex-col items-center"
      data-testid="register-page"
    >
      <div
        className="w-full rounded-xl p-6 mb-6 text-center"
        style={{ background: "linear-gradient(135deg, #f6a906 0%, #ffbd3a 100%)", color: "#0d1816" }}
      >
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest mb-1">
          Club La Mascotera
        </span>
        <h1 className="text-2xl font-black uppercase leading-none">
          Sumate al Club
        </h1>
        <p className="mt-2 text-sm">
          <strong>+50 puntos de bienvenida</strong> al registrarte. Tu DNI es la llave.
        </p>
      </div>

      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nombre"
              name="first_name"
              required
              autoComplete="given-name"
              data-testid="first-name-input"
            />
            <Input
              label="Apellido"
              name="last_name"
              required
              autoComplete="family-name"
              data-testid="last-name-input"
            />
          </div>
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="DNI (sin puntos)"
            name="dni"
            required
            type="text"
            pattern="[0-9]{7,8}"
            autoComplete="off"
            data-testid="dni-input"
          />
          <Input
            label="Teléfono"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Fecha de nacimiento (opcional)"
            name="birthdate"
            type="date"
            autoComplete="bday"
            data-testid="birthdate-input"
          />
          <Input
            label="Contraseña (mín 8 caracteres)"
            name="password"
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>

        <div className="mt-4 flex flex-col gap-2 text-small-regular">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="consent_marketing"
              value="1"
              className="mt-1"
              data-testid="consent-marketing-input"
            />
            <span>
              Quiero recibir promociones, descuentos del Club y novedades por email.
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="consent_terms"
              value="1"
              required
              className="mt-1"
              data-testid="consent-terms-input"
            />
            <span>
              Acepto los{" "}
              <LocalizedClientLink href="/content/terms-of-use" className="underline">
                Términos de uso
              </LocalizedClientLink>
              {" "}y la{" "}
              <LocalizedClientLink href="/content/privacy-policy" className="underline">
                Política de privacidad
              </LocalizedClientLink>
              . (Requerido)
            </span>
          </label>
        </div>

        <ErrorMessage error={message} data-testid="register-error" />

        <SubmitButton
          className="w-full mt-6 !bg-[#f6a906] !text-[#0d1816] !border-[#f6a906] hover:!bg-[#e09900]"
          data-testid="register-button"
        >
          Crear cuenta y sumar 50 pts
        </SubmitButton>
      </form>

      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        ¿Ya tenés una cuenta?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          Iniciar sesión
        </button>
        .
      </span>
    </div>
  )
}

export default Register
