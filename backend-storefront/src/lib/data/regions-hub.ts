// Hub de regiones La Mascotera.
// Las regiones TIENDANUBE redirigen a dominios externos (mantenemos lo que ya funciona).
// Las regiones MEDUSA viven en el storefront actual y se filtran por sales_channel_id.

export type RegionHubKind = "tiendanube" | "medusa"

export interface RegionHubEntry {
  /** slug interno estable. Se guarda en la cookie nxv_region. */
  key: string
  /** Nombre visible en la UI. */
  name: string
  /** Descripción corta opcional (tooltip / subtitle). */
  description?: string
  /** Emoji / icono simple para la card. */
  emoji: string
  /** Tipo de canal. */
  kind: RegionHubKind
  /**
   * Para kind="tiendanube": URL externa a redirigir.
   * Para kind="medusa": path interno del storefront (ej. "/ar/tienda/catamarca").
   */
  target: string
  /** Sales channel id de Medusa (solo kind="medusa"). */
  salesChannelId?: string
  /**
   * Códigos de provincia (ISO 3166-2 AR) o claves libres que un detector de IP
   * puede devolver para pre-seleccionar esta región. Todo en minúsculas.
   */
  matchProvinces?: string[]
}

export const REGIONS_HUB: RegionHubEntry[] = [
  {
    key: "noa",
    name: "NOA",
    description: "Envíos nacionales + Tucumán + Salta capital",
    emoji: "🏜️",
    kind: "tiendanube",
    target: "https://lamascoteranoa.com.ar",
    matchProvinces: ["ar-t", "tucuman", "ar-a", "salta"],
  },
  {
    key: "neuquen",
    name: "Neuquén",
    description: "Neuquén capital",
    emoji: "🏔️",
    kind: "tiendanube",
    target: "https://lamascoteraneuquen.com.ar",
    matchProvinces: ["ar-q", "neuquen"],
  },
  {
    key: "catamarca",
    name: "Catamarca",
    emoji: "🌵",
    kind: "medusa",
    target: "/ar/tienda/catamarca",
    salesChannelId: "sc_01KPKCJEBCTA782VXEHJ128E5Q",
    matchProvinces: ["ar-k", "catamarca"],
  },
  {
    key: "chaco",
    name: "Chaco",
    emoji: "🌾",
    kind: "medusa",
    target: "/ar/tienda/chaco",
    salesChannelId: "sc_01KPKCJECAFV4TNC2FK9DP99DJ",
    matchProvinces: ["ar-h", "chaco"],
  },
  {
    key: "jujuy",
    name: "Jujuy",
    emoji: "⛰️",
    kind: "medusa",
    target: "/ar/tienda/jujuy",
    salesChannelId: "sc_01KPKCJED27208QVXZSRRC1DP0",
    matchProvinces: ["ar-y", "jujuy"],
  },
  {
    key: "mendoza",
    name: "Mendoza",
    emoji: "🍇",
    kind: "medusa",
    target: "/ar/tienda/mendoza",
    salesChannelId: "sc_01KPKCJEDRCBTF9FACT926HTWG",
    matchProvinces: ["ar-m", "mendoza"],
  },
  {
    key: "salta-leguizamon",
    name: "Salta (Leguizamón)",
    description: "Sucursal Gral. Güemes Leguizamón",
    emoji: "🌶️",
    kind: "medusa",
    target: "/ar/tienda/salta-leguizamon",
    salesChannelId: "sc_01KPKCJEEJ2B9HAXTGABMZMX1Q",
    matchProvinces: ["ar-a", "salta"],
  },
  {
    key: "oran",
    name: "Orán",
    emoji: "🌿",
    kind: "medusa",
    target: "/ar/tienda/oran",
    salesChannelId: "sc_01KPKCJEFDXVS09FKHQM5X5P19",
    matchProvinces: ["ar-a", "salta", "oran"],
  },
  {
    key: "cordoba",
    name: "Córdoba",
    emoji: "🏛️",
    kind: "medusa",
    target: "/ar/tienda/cordoba",
    salesChannelId: "sc_01KPKCJEG7KQNYFDM2ZHETYMHN",
    matchProvinces: ["ar-x", "cordoba", "córdoba"],
  },
  {
    key: "zapala",
    name: "Zapala",
    emoji: "❄️",
    kind: "medusa",
    target: "/ar/tienda/zapala",
    salesChannelId: "sc_01KPKCJEH1S313GZPXX6JN8Y09",
    matchProvinces: ["ar-q", "neuquen", "zapala"],
  },
]

export const REGION_COOKIE = "nxv_region"
export const REGION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 año
export const SALES_CHANNEL_COOKIE = "nxv_sales_channel"

export function findRegionByKey(key: string | undefined | null): RegionHubEntry | undefined {
  if (!key) return undefined
  return REGIONS_HUB.find((r) => r.key === key)
}

/**
 * Construye la URL final para una región, agregando UTM para TN y
 * query param de sales_channel para Medusa (útil si el storefront lo consume).
 */
export function buildRegionUrl(region: RegionHubEntry): string {
  if (region.kind === "tiendanube") {
    const u = new URL(region.target)
    u.searchParams.set("utm_source", "hub")
    u.searchParams.set("utm_campaign", "region_selector")
    u.searchParams.set("utm_medium", "modal")
    return u.toString()
  }
  // Medusa: path interno + sales_channel query (consumo opcional del storefront).
  const sep = region.target.includes("?") ? "&" : "?"
  return region.salesChannelId
    ? `${region.target}${sep}sales_channel=${region.salesChannelId}`
    : region.target
}
