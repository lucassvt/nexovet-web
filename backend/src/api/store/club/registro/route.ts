// src/api/store/club/registro/route.ts
// POST /store/club/registro
// Body: { email, password, first_name, last_name, dni, phone?, birthdate?, consent_marketing?, consent_terms }
// Acciones:
//  1) Valida inputs (DNI, terms, email).
//  2) Verifica DNI unico en customer.metadata.
//  3) Registra auth identity (emailpass), crea customer via workflow interno, guarda DNI+phone+birthdate+consents en metadata.
//  4) Inserta ledger +puntos_registro con vencimiento vigencia_dias.
//  5) Retorna token JWT store, customer, saldo y tier.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  getConfig,
  insertLedger,
  getBalance,
  getYearSpent,
  computeTier,
  isValidDNI,
  normalizeDNI,
  dniExists,
} from "../_lib"

type RegistroBody = {
  email?: string
  password?: string
  first_name?: string
  last_name?: string
  dni?: string
  phone?: string
  birthdate?: string
  consent_marketing?: boolean
  consent_terms?: boolean
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body as RegistroBody) || {}

    // --- Validaciones ---
    const email = (body.email || "").trim().toLowerCase()
    const password = body.password || ""
    const first_name = (body.first_name || "").trim()
    const last_name = (body.last_name || "").trim()
    const dniRaw = (body.dni || "").trim()
    const phone = (body.phone || "").trim() || null
    const birthdate = (body.birthdate || "").trim() || null
    const consent_marketing = !!body.consent_marketing
    const consent_terms = !!body.consent_terms

    if (!email || !/.+@.+\..+/.test(email)) {
      return res.status(400).json({ error: "email_invalido", message: "Email inválido" })
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "password_corta", message: "La contraseña debe tener al menos 8 caracteres" })
    }
    if (!first_name || !last_name) {
      return res.status(400).json({ error: "nombre_requerido", message: "Nombre y apellido requeridos" })
    }
    if (!isValidDNI(dniRaw)) {
      return res.status(400).json({ error: "dni_invalido", message: "DNI inválido (7 u 8 dígitos)" })
    }
    if (!consent_terms) {
      return res.status(400).json({ error: "terms_required", message: "Debes aceptar los términos" })
    }

    const dni = normalizeDNI(dniRaw)

    if (await dniExists(dni)) {
      return res.status(409).json({ error: "dni_duplicado", message: "Ya existe una cuenta con ese DNI" })
    }

    // --- Registrar auth identity (emailpass) ---
    const authModule = req.scope.resolve(Modules.AUTH) as any
    let authIdentityId: string | null = null
    let jwtToken: string | null = null

    try {
      // register devuelve { authIdentity, location? } segun provider; usamos emailpass.
      const registerResult = await authModule.register("emailpass", {
        body: { email, password },
      })

      // Segun version de Medusa, `register` puede devolver { success, authIdentity, location } o similar.
      // Si success=false lo tratamos como error (probablemente el email ya existe).
      if (registerResult && registerResult.success === false) {
        return res.status(409).json({
          error: "email_duplicado",
          message: registerResult.error || "Ya existe una cuenta con ese email",
        })
      }
      authIdentityId = registerResult?.authIdentity?.id || null
    } catch (err: any) {
      console.error("[club/registro] auth.register error:", err?.message || err)
      return res.status(409).json({
        error: "auth_error",
        message: err?.message || "No se pudo registrar (email posiblemente duplicado)",
      })
    }

    // --- Crear customer via Medusa Customer Module ---
    const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
    const metadata: Record<string, any> = {
      dni,
      consent_marketing,
      consent_terms,
      consent_terms_at: new Date().toISOString(),
      consent_marketing_at: consent_marketing ? new Date().toISOString() : null,
      club_member: true,
      registered_from: "ecommerce_propio",
    }
    if (birthdate) metadata.birthdate = birthdate

    let customer: any
    try {
      const customerData: any = {
        email,
        first_name,
        last_name,
        has_account: true,
        metadata,
      }
      if (phone) customerData.phone = phone

      const created = await customerModule.createCustomers(customerData)
      customer = Array.isArray(created) ? created[0] : created
    } catch (err: any) {
      console.error("[club/registro] customer.create error:", err?.message || err)
      return res.status(500).json({
        error: "customer_create_failed",
        message: err?.message || "No se pudo crear el customer",
      })
    }

    // --- Link auth_identity <-> customer.id ---
    // Necesario para que el login posterior con emailpass devuelva este customer.
    try {
      if (authIdentityId) {
        await authModule.updateAuthIdentities({
          id: authIdentityId,
          app_metadata: { customer_id: customer.id },
        })
      }
    } catch (err: any) {
      console.warn("[club/registro] linkear auth_identity -> customer falló:", err?.message || err)
    }

    // --- Generar JWT store para auto-login ---
    try {
      const jwt = require("jsonwebtoken")
      const secret = process.env.JWT_SECRET || "supersecret"
      jwtToken = jwt.sign(
        {
          actor_id: customer.id,
          actor_type: "customer",
          auth_identity_id: authIdentityId,
          app_metadata: { customer_id: customer.id },
        },
        secret,
        { expiresIn: "7d" }
      )
    } catch (err: any) {
      console.warn("[club/registro] JWT sign failed:", err?.message || err)
    }

    // --- Ledger: puntos de bienvenida ---
    const config = await getConfig()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + config.vigencia_dias)

    try {
      await insertLedger({
        customer_id: customer.id,
        dni,
        tipo: "REGISTRO",
        points: config.puntos_registro,
        motivo: "Bienvenida al Club La Mascotera",
        expires_at: expiresAt,
        source_canal: "ecommerce_propio",
      })
    } catch (err: any) {
      console.error("[club/registro] ledger insert error:", err?.message || err)
      // No fallar el registro por eso; dejamos al usuario creado pero logueamos.
    }

    const balance = await getBalance(customer.id)
    const spent = await getYearSpent(customer.id, config.pesos_por_punto)
    const tier = computeTier(spent)

    return res.status(201).json({
      ok: true,
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        has_account: customer.has_account,
      },
      loyalty: {
        balance,
        tier,
        welcome_points: config.puntos_registro,
        expires_at: expiresAt.toISOString(),
      },
      token: jwtToken,
    })
  } catch (err: any) {
    console.error("[club/registro] unhandled:", err?.stack || err)
    return res.status(500).json({
      error: "internal_error",
      message: err?.message || "Error interno",
    })
  }
}
