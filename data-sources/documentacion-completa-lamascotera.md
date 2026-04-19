# Documentación Completa — La Mascotera NOA
### Referencia para diseño de nuevas webs del ecosistema NexoVet
*Extraído: Abril 2026 | Fuente: Tienda Nube admin + tienda pública lamascoteranoa.com.ar*

---

## ÍNDICE
1. [Identidad de Marca](#1-identidad-de-marca)
2. [Arquitectura de la Tienda Actual](#2-arquitectura-de-la-tienda-actual)
3. [Interfaz Cliente — Tienda Pública](#3-interfaz-cliente--tienda-pública)
4. [Interfaz Vendedor — Panel Admin](#4-interfaz-vendedor--panel-admin)
5. [Catálogo de Productos](#5-catálogo-de-productos)
6. [Medios de Pago](#6-medios-de-pago)
7. [Logística y Envíos](#7-logística-y-envíos)
8. [Clientes y CRM](#8-clientes-y-crm)
9. [Marketing y Descuentos](#9-marketing-y-descuentos)
10. [Configuración Técnica](#10-configuración-técnica)
11. [Usuarios y Sucursales](#11-usuarios-y-sucursales)
12. [Observaciones para NexoVet / Medusa.js](#12-observaciones-para-nexovet--medusajs)

---

## 1. Identidad de Marca

### Datos generales
- **Nombre comercial**: La Mascotera
- **Dominio principal**: lamascoteranoa.com.ar (SSL activo)
- **Dominio alternativo**: lamascotera.com.ar (actualmente desactivado)
- **Admin TN**: lamascotera2.mitiendanube.com
- **Email tienda**: soportelamascotera@gmail.com
- **Email admin/notif**: mascoteraalem@gmail.com
- **Teléfono**: 3812391001
- **Historia**: Cadena de tiendas especializadas en mascotas desde 2014
- **Slogan**: "¡Las mejores marcas al mejor precio!"
- **Meta descripción**: "Acompañamos a dueños y mascotas desde el año 2014. Conoce nuestra nueva Tienda Online, compra desde donde estés y recibí nuestros productos."

### Presencia geográfica
Sucursales en: **Tucumán · Salta · Jujuy · Santiago del Estero · Neuquén · Córdoba · Mendoza · Chaco · Rosario**

Centro de distribución principal: Ruta 9, Capital, San Miguel de Tucumán, CP 4000 ("La Mascotera - Depo ruta 9")

### Design Tokens (Tema Amazonas)
| Token | Valor |
|---|---|
| Color primario | `#F6A906` (dorado) |
| Color fondo/dark | `#0D1816` (negro oscuro) |
| Color acento | `#2E9E8A` (verde esmeralda) |
| Tipografía | Montserrat |
| Tema activo | Amazonas |
| Tema draft | Brasilia |

### Redes y analytics
- **Google Tag Manager**: GTM-PCG5WG4F
- **Google Analytics 4**: G-KPK36EVK0F

---

## 2. Arquitectura de la Tienda Actual

### Plataforma
- **Motor**: Tienda Nube (Nuvemshop) — Plan con costos por transacción (CPT 1%)
- **Plan**: Con pago de plan mensual (alerta 24/04/2026 para renovar)

### Estructura de dominios
| Dominio | Estado | SSL | Rol |
|---|---|---|---|
| lamascoteranoa.com.ar | Activado | ✅ | Principal |
| www.lamascoteranoa.com.ar | Activado | ✅ | WWW |
| lamascotera2.mitiendanube.com | Activado | ✅ | Por defecto (TN) |
| lamascotera.com.ar | Desactivado | ❌ | Sin uso |
| www.lamascotera.com.ar | Desactivado | ❌ | Sin uso |

### Idiomas y monedas
- País: Argentina 🇦🇷
- Moneda: Pesos Argentinos (ARS)
- Idioma: Español
- Tasas de cambio: USD / EUR / BRL configurables (no asignadas)

---

## 3. Interfaz Cliente — Tienda Pública

### 3.1 Encabezado (Header)
**Barra superior:**
- Ayuda | Mi cuenta | Mi carrito (con contador)

**Menú de navegación principal:**
- Perros ▾ (con megamenú)
- Gatos ▾
- Otros ▾
- ¡RECIEN LLEGADOS!
- ¡OFERTAS!
- Club La Mascotera
- Peluquería
- Sucursales

### 3.2 Homepage
**Secciones observadas:**
1. Banner hero: "¡LAS MEJORES MARCAS AL MEJOR PRECIO!"
2. Grid de productos destacados (con badges SIN STOCK / precios con descuento transferencia)
3. Productos con precio normal y precio con transferencia (5% OFF)
4. Banners de categorías
5. Sección CTA para sucursales / club

**Formato de precio en cards:**
```
[Nombre producto]
$XX.XXX,00
$XX.XXX,00 con Transferencia o depósito bancario 💰
```

### 3.3 Página de Categoría
**URL pattern**: `/perros/alimentos-balanceados/`

**Elementos presentes:**
- Breadcrumb
- Título de categoría (H1)
- Panel de filtros izquierdo:
  - Etapa (cachorro, adulto, senior...)
  - Presentación (kg, gr...)
  - Razas (pequeña, mediana, grande)
  - Sabor
  - Precio (Desde / Hasta)
- Grid de productos
- Paginación

### 3.4 Página de Producto
**URL pattern**: `/productos/[slug]`

**Elementos presentes:**
- Nombre del producto (H1)
- Precio con IVA: `$72.500,00`
- Precio sin IVA: `Precio sin impuestos $59.917,36`
- Precio transferencia (5% OFF): `$68.875,00 con Transferencia o depósito bancario 💰`
- Cuotas: `24 cuotas de $6.827,99`
- Texto descuento: `5% de descuento pagando con Transferencia o depósito bancario 💰`
- **Selector de variantes** (por tipo: Presentación / Etapa / Razas)
- **Calculadora de envío por CP** (campo + botón CALCULAR)
- **Link**: "Nuestros locales / Ver opciones"
- Zonas de envío programado y express (listado de CP habilitados)
- Descripción de envíos programados (texto informativo)
- Descripción detallada del producto
- Galería de imágenes (hasta 4 por producto, 640px WebP)

**Zonas de envío express activas (producto de ejemplo):**
San Miguel de Tucumán (4000-4001-4002) · Yerba Buena (4107) · Banda del Río Salí (4109) · Tafí Viejo (4103) · San José (4107) · Las Talitas (4101) · Lomas de Tafí (4103) · Villa Carmela (4103) · Concepción (4146)

**Mensaje envíos:**
- Envíos Programados de Lunes a Sábados
- Envíos Programados GRATIS con compras superiores a [monto]
- Durante MASCO WEEK puede haber demoras

### 3.5 Carrito y Checkout
**Acceso**: botón "Mi carrito" en header (contador de ítems)

**Checkout configurado para pedir:**
- Teléfono de contacto ✅
- DNI / CUIT ✅
- Nota del cliente (instrucciones especiales) ✅
- Dirección de facturación
- Opción factura A (Permite elegir)
- Colores del diseño de la tienda en el checkout ✅
- Restringir compras: **Todos los clientes** (sin restricción)
- Cambio de medio de pago desde página de seguimiento: **habilitado**

**Mensaje en página de seguimiento**: Texto personalizado de agradecimiento/promociones

### 3.6 Páginas Especiales
| Página | URL | Contenido |
|---|---|---|
| Franquicias | /franquicias/ | Modelo de negocio, historia, propuesta franquicia |
| Sucursales | /sucursales/ | Mapa interactivo (dinámico) |
| Club La Mascotera | /club-la-mascotera/ | Programa de fidelidad |
| Peluquería | /servicio-de-peluqueria-canina1/ | Servicio grooming |
| Quiénes Somos | /quienes-somos/ | Historia de la empresa |
| Contacto | /contacto/ | Formulario + botón arrepentimiento |
| Preguntas Frecuentes | /preguntas-frecuentes/ | FAQ |
| Política de Devolución | /politica-de-devolucion/ | Legal |
| Términos y condiciones | /terminos-y-condiciones/ | Legal |
| Cómo Comprar | /como-comprar/ | Guía de compra |

### 3.7 Footer
**Columnas:**
1. **Categorías**: Inicio / Contacto / Quiénes Somos / Trabaja con nosotros / Franquicias / Cómo Comprar / Política de Devolución / Preguntas Frecuentes / Términos y condiciones
2. **Contacto**: Teléfono · Email · Dirección/presencia geográfica
3. **Redes sociales** (íconos)
4. **Medios de pago** (logos: MercadoPago, tarjetas, transferencia)
5. **Copyright**: La Mascotera - 2026 · Defensa del consumidor · Botón de arrepentimiento

---

## 4. Interfaz Vendedor — Panel Admin

### 4.1 Estructura del Sidebar
```
├── Inicio (Dashboard)
├── Estadísticas
├── Gestión
│   ├── Ventas [badge: 11]
│   ├── Productos
│   ├── Pago Nube
│   ├── Envío Nube [Nuevo]
│   ├── Clientes
│   │   ├── Lista de clientes
│   │   └── Mensajes
│   └── Descuentos
├── Marketing
├── Canales de venta
│   ├── Tienda online
│   ├── Punto de Venta
│   ├── Chat
│   ├── Instagram y Facebook
│   ├── Google Shopping
│   ├── TikTok
│   ├── Pinterest
│   └── Marketplaces
├── Potenciar
│   └── Aplicaciones
└── Configuración ▾
    ├── Pagos y envíos
    │   ├── Medios de pago
    │   ├── Medios de envío
    │   └── Centros de distribución
    ├── Comunicación
    │   ├── Información de contacto
    │   ├── Botón de WhatsApp
    │   └── E-mails automáticos
    ├── Checkout
    │   ├── Opciones del checkout
    │   └── Mensaje para clientes
    └── Otros
        ├── Usuarios y notificaciones
        ├── Dominios
        ├── Códigos externos
        ├── Idiomas y monedas
        ├── Redireccionamientos 301
        └── Campos personalizados
```

### 4.2 Dashboard (Inicio)
**Estado operativo en tiempo real:**
- Sin ventas: Por cobrar
- 8 ventas: Por empaquetar
- 1 venta: Por enviar
- 1 venta: Por retirar
- Hoy: 68 visitas únicas

**Widgets sugeridos (no usados):**
- Conectar Google (campañas)
- Conectar TikTok
- Crear blog para SEO
- Punto de Venta / Chat / Apps marketing
- Contratar especialista

### 4.3 Estadísticas
**Esta semana:**
- 1.662 visitas únicas
- 12 ventas realizadas
- $745.425 facturación total
- $62.118,75 ticket promedio
- 60 carritos creados → 9 convertidos (20% conversión de carrito → ~15% tasa real)

### 4.4 Ventas
**Estado actual**: 11 abiertas

**Flujo de estados de orden:**
1. Por cobrar → pago confirmado
2. Por empaquetar
3. Por enviar
4. Por retirar (retiro en local)
5. Completada

**Medios de pago recibidos en órdenes reales:**
- MercadoPago (tarjetas / billetera)
- Transferencia bancaria

**Tipos de envío en órdenes:**
- Express (zonas cercanas TUC)
- Envío Programado
- Retiro local

**Órdenes recientes (muestra):**
| Orden | Monto | Estado |
|---|---|---|
| #18899 | ~$130.000 | Varias |
| #18886 | ~$80.000 | Varias |
| Ticket mínimo observado | ~$11.000 | — |
| Ticket máximo observado | ~$130.000 | — |

---

## 5. Catálogo de Productos

### Resumen
- **Total en admin**: 1.188 productos (incluyendo variantes = 13.306 filas en CSV)
- **Total público**: ~780 productos visibles
- **Ocultos**: ~408 productos (sin stock, descontinuados, internos)
- **Imágenes**: 2.306 imágenes descargadas (640px WebP) en `imagenes_productos/`
- **CSV completo**: `catalogo_productos.csv` (365 KB) + `catalogo_completo.json` (1.4 MB)
- **Export TN**: `tiendanube-979500-...csv` con HTML descriptions, SKUs, marcas, SEO (el más completo)

### Estructura de categorías (árbol principal)
```
Perros
├── Alimentos balanceados
│   ├── ALIMENTOS HUMEDOS (latas, sachets)
│   └── ALIMENTOS SECOS
│       ├── SENDA
│       ├── Jaspe
│       ├── HOMEMADE DELIGTHS
│       ├── Agility
│       ├── Sieger
│       ├── Eukanuba
│       ├── Royal Canin
│       │   ├── Secos
│       │   ├── Performance
│       │   ├── Medicados
│       │   └── Específicos
│       ├── Excellent
│       ├── Nutrique
│       ├── Pro Plan
│       ├── Old Prince
│       └── Vital Can
│           ├── Balanced
│           └── Belcan
├── Snacks y premios
├── Higiene y cuidado
├── Accesorios
├── Medicamentos / Antipulgas
└── ...
Gatos
├── Alimentos secos
├── Alimentos húmedos
├── Accesorios
└── ...
Otros
├── Aves
├── Roedores
├── Peces
├── Reptiles
└── Insumos peluquería canina
```

### Filtros disponibles en categorías
- Etapa (cachorro / adulto / senior / gestación / recuperación...)
- Presentación (por peso en kg/gr)
- Razas (pequeña / mediana / grande / gigante)
- Sabor / ingrediente principal
- Precio (rango desde/hasta)

### Lógica de precios
- **Precio base** (con IVA incluido)
- **Precio sin impuestos** (mostrado como referencia)
- **Precio transferencia** = precio base × 0.95 (5% descuento)
- **Cuotas**: hasta 24 cuotas sin interés (vía MercadoPago)
- **Badges**: "SIN STOCK" visible en tarjetas de producto

---

## 6. Medios de Pago

### 6.1 Estado actual en `/admin/settings/payments`

| Proveedor | Estado | Método | Tasas | CPT |
|---|---|---|---|---|
| **Transferencia / Efectivo** | ✅ ACTIVADO | Manual | Sin costo | 1% |
| **MercadoPago Gateway** | ✅ ACTIVADO | Checkout transparente | Crédito: 4.5%+IVA (10-35d) / Débito: 1.2%+IVA / Billetera: 0.8%+IVA | 1% |
| **Pago Nube (TN)** | ❌ DESACTIVADO | Checkout transparente | Crédito: 1.8%+IVA / Débito: 1.2%+IVA / Billetera: 0.8%+IVA | 1% |
| **GOcuotas** | ❌ DESACTIVADO | — | Débito: 11.4%+IVA (22d) | 1% |

> **Nota**: CPT = Costo Por Transacción de Tienda Nube (1% sobre cada venta)

### 6.2 Descuento transferencia
El 5% de descuento para transferencia/depósito se muestra en toda la tienda públicamente como incentivo. Esto es la lógica de precio diferenciado ya implementada.

---

## 7. Logística y Envíos

### 7.1 Centro de distribución
**Único depósito:**
- Nombre: La Mascotera - Depo ruta 9 (Principal)
- Dirección: Ruta 9, Capital, San Miguel de Tucumán, Tucumán, Argentina — CP 4000
- Habilitado para: Tienda online + Punto de Venta

### 7.2 Medios de envío configurados

**Envío Nube** (DESACTIVADO)
- Operadores: Andreani, Correo Argentino, E-Pick (próximamente)
- Ventajas: hasta 15% ahorro, etiqueta automatizada, seguimiento
- Motivo posible de desactivación: gestión manual preferida actualmente

**Envíos personalizados (ACTIVADOS) — Interior de Tucumán vía Correo Argentino:**

| Tramo de peso | Precio | Plazo |
|---|---|---|
| Hasta 0.999 kg | $14.000 | 1-3 días hábiles |
| 1 a 2.999 kg | $14.300 | 1-3 días hábiles |
| 3 kg+ | $17.000 | 1-3 días hábiles |

> Hay más tramos y zonas configuradas (texto truncado en captura). Todos parten desde "La Mascotera - Depo ruta 9".

**Envío Express y Programado (Zonas TUC):**
Cubierto por los envíos personalizados locales. Zonas: San Miguel de Tucumán, Yerba Buena, Banda del Río Salí, Tafí Viejo, Las Talitas, Lomas de Tafí, Villa Carmela, Concepción.

**Retiro en local:** Habilitado (aparece en checkout como opción)

**Envíos gratuitos:** A partir de cierto monto (mostrado en producto, umbral no capturado exactamente)

---

## 8. Clientes y CRM

### 8.1 Base de clientes
- **Total registrados**: 739 clientes
- **Sub-secciones**: Lista de clientes / Mensajes

### 8.2 Campos visibles en lista
- Nombre / Email / DNI (búsqueda)
- Última compra (número de orden + fecha)
- Total consumido (lifetime value)
- Contactar: botón email + botón WhatsApp

### 8.3 Muestra de clientes (top por consumo)
| Cliente | Última compra | Total consumido |
|---|---|---|
| Augusto aragon | #18696 (23/01/2026) | $291.779,75 |
| Julieta Rodriguez | #17912 (31/10/2025) | $235.286,10 |
| Karina Ybañez | #18887 (21/02/2026) | $129.821,07 |
| Sandra Karina Ybañez | #17164 (30/07/2025) | $56.200,00 |
| Aldana Dapia Lardone | #14908 (05/03/2025) | $54.760,14 |
| Perez Ana valeria | #14320 (18/01/2025) | $30.495,00 |
| Ernesto Hernan | #9801 (12/11/2023) | $40.140,00 |

### 8.4 E-mails automáticos
- **Remitente**: hola@tiendanube.com (a nombre de La Mascotera)
- **Reenvío admin**: mascoteraalem@gmail.com

**Tipos disponibles:**
- *Promociones*: Carritos abandonados (incentivo a completar compra)
- *Marketing Nube (ex Perfit)*: Automatización de marketing (no instalado)
- *Cuenta*: Activación de cuenta / Cambio de contraseña / Bienvenida
- *Ventas*: Cancelación / Confirmación de pago / Confirmación de envío / Nuevo pedido / ...

---

## 9. Marketing y Descuentos

### 9.1 Secciones de Marketing
- **Automatizaciones** (`/admin/marketing-automation`)
- **E-mail marketing**
- **Aplicaciones** (marketplace de apps)

### 9.2 Cupones activos (al momento de captura)
| Código | Tipo | Valor |
|---|---|---|
| BRITO15500 | Descuento fijo | $15.500 |
| CASCABEL | Descuento fijo | $4.180 |
| CRIS2300 | Descuento fijo | $2.300 |
| FABIANCUPON | Descuento fijo | $19.000 |
| JESUSCUPON | Descuento fijo | $5.900 |

### 9.3 Cupones expirados / inactivos (patrón)
BIENVENIDA · CECICLUB · CUPONECUZZO · DANICLUB · (más cupones tipo NOMBRECLUB)

> **Patrón identificado**: Los cupones "club" siguen el formato `[NOMBRE]CLUB` — sistema de cupones personalizados por cliente VIP o programa de fidelidad.

### 9.4 Canales de venta disponibles (no todos activos)
- Tienda online ✅ activa
- Punto de Venta (POS) — configurado
- Chat (WhatsApp AI) — configurado
- Instagram y Facebook — integrado (`/admin/social/meta/`)
- Google Shopping — disponible
- TikTok — disponible
- Pinterest — disponible
- Marketplaces — disponible

---

## 10. Configuración Técnica

### 10.1 Información de contacto pública
```
Email:    soportelamascotera@gmail.com
Teléfono: 3812391001
Texto:    "Tenes dudas o consultas sobre alguno de nuestros productos,
           llamanos, y te responderemos a la brevedad."
Dirección: "Sucursales en: Tucumán - Salta - Jujuy - Santiago del Estero -
            Neuquén - Córdoba - Mendoza - Chaco - Rosario"
```

### 10.2 Botón WhatsApp
- Número: +54 3812391001 (prefijo AR)
- Aparece como botón flotante en la tienda

### 10.3 Códigos externos
| Servicio | ID / Código |
|---|---|
| Google Tag Manager | GTM-PCG5WG4F |
| Google Analytics 4 | G-KPK36EVK0F |
| GA4 API Secret | YUmruDBZR5uBx364BVEvvA |

### 10.4 Checkout — Campos activos
| Campo | Estado |
|---|---|
| Teléfono de contacto | ✅ Activado |
| DNI o CUIT | ✅ Activado |
| Dirección de facturación | Disponible |
| Factura A (CUIT) | ✅ Permitido elegir |
| Nota del cliente | ✅ Disponible |
| Colores del diseño en checkout | ✅ Activado |
| Restricción de compradores | Todos los clientes |
| Cambio de medio de pago (post-compra) | ✅ Habilitado |

### 10.5 Datos legales / Defensa del consumidor
- Resolución Nº 104/2005 de Defensa del Consumidor cumplida (datos obligatorios en tienda)
- Botón de arrepentimiento: `/contacto/`
- Copyright La Mascotera - 2026

---

## 11. Usuarios y Sucursales

### 11.1 Usuarios admin (equipo)
| Usuario | Email | Permisos | 2FA | Notificaciones |
|---|---|---|---|---|
| Lucas Salvatierra | salvatierralucas@gmail.com | Acceso total | ✅ | Sin notificaciones |
| Mascotera Alem | mascoteraalem@gmail.com | Acceso total | ✅ | Mensajes + Ventas |
| Barrio Sur Colaborador Web | mascoterajujuy@gmail.com | Solo Ventas* | ❌ | Sin notificaciones |
| Banda del Rio Salí Colaborador Web | mascoterabanda@gmail.com | Solo Ventas* | ❌ | Sin notificaciones |
| Concepción Colaborador Web | mascoteraconcepcion@gmail.com | Solo Ventas* | ❌ | Sin notificaciones |
| Leguizamon Salta Colaborador Web | saltaleguizamon@gmail.com | Solo Ventas* | ❌ | Sin notificaciones |
| Arenales Salta Colaborador Web | saltaarenales@gmail.com | Solo Ventas* | ❌ | Sin notificaciones |
| Reyes Católicos Salta Colaborador Web | saltareyescatolicos@gmail.com | Solo Ventas* | ❌ | Sin notificaciones |
| Oran Salta Colaborador Web | mascoteraoran@gmail.com | Solo Ventas* | ❌ | Sin notificaciones |

> **Permisos "Solo Ventas"** incluyen: ver ventas, marcar pagos como recibidos, exportar listado, cancelar ventas, imprimir etiquetas, marcar como empaquetadas.

### 11.2 Mapa de sucursales identificadas (por usuario admin)
Cada "Colaborador Web" representa una sucursal física:
- **Tucumán**: Alem, Barrio Sur, Banda del Río Salí, Concepción
- **Salta**: Leguizamón, Arenales, Reyes Católicos, Orán
- (Más sucursales en Jujuy, Santiago del Estero, Neuquén, Córdoba, Mendoza, Chaco, Rosario — según info de contacto)

---

## 12. Observaciones para NexoVet / Medusa.js

### 12.1 Qué replicar en cada tienda franquicia

**Obligatorio en toda tienda del ecosistema:**
- Estructura de categorías Perros / Gatos / Otros (árbol idéntico o subset)
- Lógica de precio base + precio transferencia (descuento del 5%)
- Filtros de producto: Etapa / Presentación / Razas / Sabor / Precio
- Calculadora de envío por CP
- Zonas de envío express vs programado por sucursal
- Checkout con: teléfono + DNI + nota + factura A
- Cupones por cliente (tipo NOMBRECLUB)
- Footer con datos legales + botón arrepentimiento
- Botón WhatsApp flotante
- Página Franquicias (puede ser shared)
- GTM instalado (cada tienda puede tener su propio GTM o el mismo)

**Por sucursal (diferente en cada tienda):**
- Dominio propio (ej: lamascoterasalta.com.ar)
- Centro de distribución / depósito local
- Zonas de envío y tarifas de envío específicas
- Usuarios colaboradores de esa sucursal
- Catálogo posiblemente diferente (subset de productos)
- Email de contacto de la sucursal
- Teléfono de la sucursal

**Puede ser global / compartido:**
- Catálogo de productos (sincronizado desde tienda central)
- Cupones globales de la marca
- Templates de emails automáticos
- Identidad visual (mismos tokens CSS)
- Analytics (GTM master + GA4 de red)

### 12.2 Flujo de operación actual (a preservar en Medusa)
```
Cliente compra
    → Pago: MercadoPago o Transferencia
    → Estado: Por cobrar → confirmar pago manualmente si es transferencia
    → Estado: Por empaquetar
    → Colaborador local ve la venta y la empaqueta
    → Estado: Por enviar / Por retirar
    → Envío: Correo Argentino con tarifa por peso / Express local / Retiro
    → Completada
```

### 12.3 Integraciones a migrar / replicar en Medusa.js v2
| Integración | Estado actual | Necesario en Medusa |
|---|---|---|
| MercadoPago (gateway) | ✅ Activo | Plugin medusa-payment-mercadopago |
| Transferencia bancaria | ✅ Activo | Custom payment provider |
| Correo Argentino / Envío Nube | ⚠️ Manual | Plugin de shipping + Envío Nube API |
| Google Tag Manager | ✅ GTM-PCG5WG4F | Storefront: GTM script |
| Google Analytics 4 | ✅ G-KPK36EVK0F | Via GTM o plugin |
| WhatsApp (botón flotante) | ✅ +54 3812391001 | Widget en storefront |
| Instagram/Facebook | ✅ Meta | Meta Pixel + Catalog |

### 12.4 Métricas de baseline para comparar rendimiento
| Métrica | Valor actual (esta semana) |
|---|---|
| Visitas únicas semanales | 1.662 |
| Ventas semanales | 12 |
| Facturación semanal | $745.425 ARS |
| Ticket promedio | $62.118 ARS |
| Tasa conversión carrito | ~20% (9/60 carritos) |
| Clientes totales | 739 |
| Productos en catálogo | 1.188 |

### 12.5 Gaps / Oportunidades detectadas
- **Pago Nube desactivado**: Las tasas de Pago Nube (propio de TN) son menores que MercadoPago para crédito (1.8% vs 4.5%). En Medusa esto no aplica; se puede usar MP directo con tasa negociada.
- **Envío Nube desactivado**: Se gestiona todo manualmente. En Medusa se puede integrar directamente con Andreani/Correo AR vía API.
- **Sin marketing automation activa**: La sección de automatizaciones existe pero no hay flujos activos. En Medusa se puede usar Klaviyo / MailerLite.
- **2FA solo en 2 de 9 usuarios**: Los colaboradores de sucursal no tienen 2FA. En Medusa se puede forzar.
- **Sucursales como usuarios**: El modelo actual usa usuarios admin como proxy de sucursales. En Medusa se modelarán como `locations` separadas con su propio stock y operadores.

---

*Documento generado automáticamente desde scraping de la interfaz pública y el panel de administración de Tienda Nube.*
*Archivos de datos relacionados:*
- `catalogo_completo.json` — 780 productos con JSON estructurado
- `catalogo_productos.csv` — versión CSV del catálogo público
- `tiendanube-979500-...csv` — export completo TN con 1188 productos y HTML
- `imagenes_productos/` — 2306 imágenes 640px WebP
- `informe-diseno-lamascotera.html` — informe visual con diseño/tokens
