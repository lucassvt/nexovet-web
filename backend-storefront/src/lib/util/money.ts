import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

// Currencies stored in minor unit (cents) that need /100 for display
const MINOR_UNIT_CURRENCIES = new Set(["ars", "usd", "eur", "brl", "clp", "mxn", "uyu", "pen", "cop"])

// Currencies where retail prices are shown without decimals
const NO_DECIMAL_CURRENCIES = new Set(["ars", "clp", "pyg", "jpy", "krw"])

const DEFAULT_LOCALES: Record<string, string> = {
  ars: "es-AR",
  usd: "en-US",
  eur: "de-DE",
  brl: "pt-BR",
  mxn: "es-MX",
  clp: "es-CL",
  uyu: "es-UY",
  pen: "es-PE",
  cop: "es-CO",
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount?.toString() ?? ""
  }

  const code = currency_code.toLowerCase()
  const displayAmount = MINOR_UNIT_CURRENCIES.has(code) ? amount / 100 : amount
  const resolvedLocale = locale ?? DEFAULT_LOCALES[code] ?? "en-US"

  const noDecimals = NO_DECIMAL_CURRENCIES.has(code)
  const resolvedMin = minimumFractionDigits ?? (noDecimals ? 0 : 2)
  const resolvedMax = maximumFractionDigits ?? (noDecimals ? 0 : 2)

  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: currency_code,
    minimumFractionDigits: resolvedMin,
    maximumFractionDigits: resolvedMax,
  }).format(displayAmount)
}
