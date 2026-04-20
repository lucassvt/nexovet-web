"use server"

import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { getAuthHeaders, getCacheTag, setAuthToken } from "./cookies"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

async function clubFetch<T = any>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    accept: "application/json",
  }
  if (PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  }
  const authHeaders = (await getAuthHeaders()) as any
  if (authHeaders.authorization) {
    headers.authorization = authHeaders.authorization
  }
  const res = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as any) },
    cache: "no-store",
  })
  let data: any = null
  try {
    data = await res.json()
  } catch {}
  return { ok: res.ok, status: res.status, data }
}

export type ClubTier = {
  name: string
  multiplier: number
  min_spend: number
  next_spend: number | null
  perks: string[]
}

export type ClubSaldo = {
  ok: boolean
  customer_id: string
  balance: number
  spent_year_ars: number
  tier: ClubTier
  config: {
    pesos_por_punto: number
    vigencia_dias: number
    notif_dias_antes: number[]
  }
  history: Array<{
    id: number
    tipo: string
    points: number
    motivo: string | null
    order_id: string | null
    expires_at: string | null
    source_canal: string | null
    created_at: string
  }>
}

export async function getClubSaldo(): Promise<ClubSaldo | null> {
  const { ok, data } = await clubFetch<ClubSaldo>("/store/club/saldo", {
    method: "GET",
  })
  if (!ok || !data) return null
  return data
}

/**
 * Registro de Club La Mascotera.
 * - Form action: usa FormData.
 * - Llama POST /store/club/registro -> crea customer+ledger+bienvenida.
 * - Setea cookie _medusa_jwt con el token devuelto.
 * - Redirecciona a /ar/account ante exito.
 */
export async function signupClub(_prevState: unknown, formData: FormData) {
  const payload = {
    email: (formData.get("email") as string) || "",
    password: (formData.get("password") as string) || "",
    first_name: (formData.get("first_name") as string) || "",
    last_name: (formData.get("last_name") as string) || "",
    dni: (formData.get("dni") as string) || "",
    phone: (formData.get("phone") as string) || "",
    birthdate: (formData.get("birthdate") as string) || "",
    consent_marketing: !!formData.get("consent_marketing"),
    consent_terms: !!formData.get("consent_terms"),
  }

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/club/registro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        ...(PUBLISHABLE_KEY ? { "x-publishable-api-key": PUBLISHABLE_KEY } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) {
      return data?.message || data?.error || "No se pudo completar el registro"
    }

    if (data.token) {
      await setAuthToken(data.token)
      try {
        const tag = await getCacheTag("customers")
        if (tag) revalidateTag(tag)
      } catch {}
    }
  } catch (err: any) {
    return err?.message || "Error de red al registrar"
  }

  // Redirect fuera del try/catch para que NEXT_REDIRECT no sea capturado.
  redirect("/ar/account?welcome=1")
}

export async function canjeClub(points: number, motivo?: string, reward_id?: string) {
  const { ok, data, status } = await clubFetch("/store/club/canje", {
    method: "POST",
    body: JSON.stringify({ points, motivo, reward_id }),
  })
  return { ok, status, data }
}
