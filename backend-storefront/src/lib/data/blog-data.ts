// Articles seed for /blog. Each has slug, title, excerpt, body (MDX-style markdown),
// category, emoji, readingTime (min), seoTitle/description.

export type BlogArticle = {
  slug: string
  title: string
  excerpt: string
  body: string
  category: string
  emoji: string
  readingMinutes: number
  seoTitle: string
  seoDescription: string
  publishedAt: string
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "cuanto-come-por-dia-un-perro-adulto",
    title: "¿Cuánto come por día un perro adulto?",
    excerpt:
      "Una guía rápida para calcular la ración diaria según peso, raza y nivel de actividad. Sin fórmulas complicadas.",
    category: "Alimentación",
    emoji: "🐕",
    readingMinutes: 4,
    seoTitle: "¿Cuánto debe comer un perro adulto por día? | La Mascotera",
    seoDescription:
      "Calculá la ración diaria de tu perro adulto según peso, tamaño y actividad. Guía en gramos y medidas caseras para alimentos balanceados.",
    publishedAt: "2026-03-12",
    body: `
La cantidad exacta depende del alimento elegido (cada bolsa trae su tabla en el reverso), pero esta es una guía rápida en gramos por día asumiendo alimentos secos balanceados de gama media-alta:

| Peso adulto | Ración diaria | En medida casera (taza = 250 cc) |
|---|---|---|
| 5 kg | 80–110 gr | ~3/4 taza |
| 10 kg | 140–180 gr | 1 1/3 taza |
| 15 kg | 190–240 gr | ~2 tazas |
| 20 kg | 240–300 gr | 2 1/2 tazas |
| 30 kg | 340–420 gr | ~3 1/2 tazas |
| 40 kg | 420–520 gr | ~4 1/3 tazas |

### Factores que ajustan la ración

- **Actividad física:** un perro que sale 2 veces al día a correr necesita +10% a +20%. Un perro de departamento sedentario necesita -10%.
- **Edad:** los **cachorros** comen el doble que un adulto del mismo peso (hasta los 12 meses, razas grandes hasta 18 meses). **Seniors** (>7 años en razas medianas, >5 años en razas gigantes) necesitan menos calorías pero alimento con más fibra.
- **Estado corporal:** si le tocás las costillas y sentís grasa, reducí un 10%. Si las costillas se marcan demasiado, aumentá 10%.
- **Castrado:** los perros castrados necesitan ~15% menos de calorías.

### Cómo dividir la ración

- Cachorros: 3–4 comidas por día
- Adultos: 2 comidas por día (mañana y tarde)
- Seniors: 2–3 comidas pequeñas

### Errores frecuentes

1. **Darle las sobras de la mesa.** Aumenta mucho las calorías y desequilibra la dieta. Las cebollas, uvas, chocolate y cafeína son tóxicas.
2. **Cambiar de alimento de golpe.** Genera diarrea. Siempre mezclar 75% viejo + 25% nuevo durante 3 días, 50/50 los 3 siguientes, 25/75 los últimos 3 días.
3. **Dejarle el plato lleno todo el día ("ad libitum").** La mayoría come más de la cuenta. Dejá el plato 15–20 min y retiralo.

### Cuándo consultar al veterinario

Si tu perro baja o sube más del 10% de su peso en 1 mes sin que hayas cambiado nada, hay algo clínico detrás: parasitosis, tiroides, diabetes, gastroenteritis crónica. Pedí turno.

¿Querés que te recomendemos la ración exacta con la marca que compra tu perro? Consultanos por WhatsApp con la marca + presentación y te la calculamos.
    `.trim(),
  },
  {
    slug: "calendario-sanitario-canino-completo",
    title: "Calendario sanitario canino completo — vacunas y desparasitación año por año",
    excerpt:
      "Desde los 45 días hasta toda la vida adulta. Qué vacuna toca a cada edad, cuándo desparasitar y por qué.",
    category: "Salud",
    emoji: "💉",
    readingMinutes: 6,
    seoTitle: "Calendario de vacunación y desparasitación para perros | La Mascotera",
    seoDescription:
      "Qué vacunas y desparasitaciones necesita tu perro, organizadas por edad. Desde cachorros hasta adultos mayores. Guía actualizada 2026.",
    publishedAt: "2026-03-20",
    body: `
Un calendario sanitario claro evita enfermedades graves (moquillo, parvovirus, rabia) y la mayoría de parasitosis. Es lo primero que hacemos cuando llega un cachorro.

### Cachorros (de 45 días a 4 meses)

| Edad | Qué toca |
|---|---|
| **45 días** | Primera vacuna: Séxtuple (moquillo, parvovirus, hepatitis, parainfluenza, adenovirus, leptospirosis) + 1er desparasitación |
| **60 días** | Refuerzo séxtuple + 2da desparasitación |
| **75 días** | Óctuple (séxtuple + coronavirus + 2 serovariedades de lepto adicionales) |
| **90 días** | Refuerzo óctuple |
| **4 meses** | Antirrábica (obligatoria por ley en Argentina) |

Hasta completar el esquema, **no saques al cachorro a zonas con tierra/pasto donde hayan hecho sus necesidades otros perros**. El parvovirus y moquillo se contagian por contacto con heces/vómitos infectados y sobreviven meses en el suelo.

### Adulto (de 1 año en adelante)

| Vacuna | Frecuencia |
|---|---|
| Óctuple | 1 vez al año |
| Antirrábica | 1 vez al año (obligatoria) |
| Tos de las perreras (Bordetella) | 1 vez al año si va a guarderías, peluquería, paseador grupal |
| Leishmaniosis (Leisguard) | Según zona (endémica en norte argentino) |

### Desparasitación

- **Interna (pastillas/jarabe):** cada 3 meses en perros adultos con vida normal. Cada 1 mes si conviven con niños pequeños, si caza bichos o si hay diagnóstico reciente de parásitos.
- **Externa (pulguicida/garrapaticida):** mensual sin excepción en zonas del NOA y NEA (la garrapata del perro transmite erliquiosis y babesiosis, ambas graves). Usamos collar (Seresto/Scalibor) o pipeta (Frontline/Bravecto) según conveniencia.

### Otros controles anuales

- **Examen de sangre básico** a partir de los 7 años: detecta insuficiencia renal, diabetes, hipotiroidismo antes de síntomas.
- **Limpieza dental con anestesia** cada 1–2 años en razas pequeñas (son propensas a sarro).
- **Placas de cadera** en razas grandes (Labrador, Pastor Alemán, Rottweiler) antes del primer año.

### Errores frecuentes

1. **Omitir la antirrábica.** Si tu perro muerde a alguien y no tiene rabia al día, podés tener problemas legales graves.
2. **Saltar desparasitación externa en invierno.** Las garrapatas sobreviven en el pelaje aunque haga frío; en el NOA hay 11 meses de actividad.
3. **"Ya le di una vez, no hace falta más."** Las vacunas necesitan refuerzos. Sin ellos, la protección baja al 30% en 12 meses.

---

¿Querés que te armemos un recordatorio automático para cada toma? Sumate al **[Club La Mascotera](/club)** y te mandamos el aviso por WhatsApp 15 días antes de que toque.
    `.trim(),
  },
  {
    slug: "primeros-pasos-con-un-gato-bebe",
    title: "Primeros pasos con un gato bebé",
    excerpt:
      "Ya llegó a casa el gatito. Qué hacer los primeros 7 días: comida, arenero, vacunas y cómo integrarlo con otras mascotas.",
    category: "Gatos",
    emoji: "🐱",
    readingMinutes: 5,
    seoTitle: "Guía para cuidar un gato bebé — primeros días en casa | La Mascotera",
    seoDescription:
      "Todo lo que necesitás para recibir un gatito: alimentación por edad, arenero, vacunación, socialización y lista de compras esenciales.",
    publishedAt: "2026-03-28",
    body: `
Los primeros 7 días con un gatito marcan toda su personalidad adulta. Armamos la checklist que nosotros usamos con los rescatados que llegan a las sucursales.

### Checklist del primer día

- **Arenero pequeño + arena sanitaria de grano fino.** Los gatos bebé rascan por instinto desde la semana 3. Ubicalo lejos del plato de comida.
- **Plato de comida y bebedero por separado.** Algunos prefieren beber agua corriente: si lo ves juguetear con el grifo, una fuente eléctrica ($15k) baja la deshidratación.
- **Cama o manta blanda** en un lugar tranquilo lejos del paso.
- **Transportadora** (aunque no salgas seguido, la vas a necesitar para el vet).
- **Juguete de plumas con varilla** para estimular caza.
- **Rascador vertical** (vital para que no arruine tus sillones).
- **Alimento húmedo en sachets** (no más de 1 por día como ayuda a transicionar del lactante) + **alimento seco para gatitos** (de calidad desde el primer mes).

### Alimentación por edad

| Edad | Alimento | Ración aproximada |
|---|---|---|
| 0–4 semanas | Leche maternizada en mamadera (Bio-Canina, KMR) — NUNCA leche de vaca | Cada 3 horas incluida la noche |
| 4–8 semanas | Papilla de alimento para gatitos + leche maternizada | 4 comidas por día |
| 2–4 meses | Alimento seco para **gatitos** hidratado con agua tibia al principio | 3–4 comidas de 30 gr |
| 4–12 meses | Alimento seco **gatito/kitten** libre o en 2 comidas | 50–70 gr/día |
| 12+ meses | Alimento para **gato adulto** | 40–60 gr/día según peso |

La **leche de vaca da diarrea** en gatos porque no digieren bien la lactosa.

### Vacunación

| Edad | Vacuna |
|---|---|
| 60 días | 1ra Triple felina (panleucopenia + rinotraqueítis + calicivirus) |
| 75 días | Refuerzo triple felina |
| 90 días | Leucemia felina (opcional pero recomendada si va a salir) |
| 4 meses | Antirrábica (obligatoria) |
| Anual | Refuerzos triple + rábica |

### Socialización

La ventana crítica es entre **3 y 9 semanas**: lo que conozca en ese tiempo lo va a aceptar toda la vida sin estrés. Exponelo a:

- Distintas personas (hombres, mujeres, niños)
- Ruidos cotidianos (licuadora, aspiradora, timbre, secador)
- Otras mascotas (con supervisión y presentación gradual)
- Cepillo, cortauñas, pasta dental felina

### Integrar con otras mascotas

Si ya tenés un perro o gato adulto:

1. **Aislá al gatito en una habitación** los primeros 2–3 días (sin contacto visual).
2. **Intercambiá olores:** pasá un trapo por la mejilla del gatito y llevalo a la otra mascota, y viceversa.
3. **Contacto controlado con puerta cerrada:** dejá que se olfateen por debajo de la puerta 1–2 días.
4. **Primer encuentro cara a cara de 15 min** con distracciones positivas (comida para ambos, juego).
5. **Supervisar 100% la primera semana.** Nunca dejarlos solos si hay tensión.

### Banderas rojas para ir al vet urgente

- No come en 24 horas (en gatitos, el ayuno activa lipidosis hepática en 2 días)
- Diarrea con sangre o moco
- Vómitos repetidos
- Secreción ocular o nasal amarilla
- Letargia extrema

---

Estamos para ayudar: si dudas con algo del primer mes, podés agendar una **[consulta por televeterinaria](/televeterinaria/agendar)** sin salir de casa.
    `.trim(),
  },
  {
    slug: "royal-canin-vs-pro-plan-vs-jaspe",
    title: "Royal Canin vs Pro Plan vs Jaspe — ¿qué marca conviene para mi perro?",
    excerpt:
      "Comparativa real de las 3 marcas más vendidas en nuestras sucursales. Proteína, cereales, precio por kilo y a quién le conviene cada una.",
    category: "Alimentación",
    emoji: "🏆",
    readingMinutes: 5,
    seoTitle: "Royal Canin, Pro Plan o Jaspe — cuál alimento elegir | La Mascotera",
    seoDescription:
      "Comparativa objetiva de ingredientes, proteína, precio por kilo y recomendación por tipo de perro. Elegí el alimento correcto para tu mascota.",
    publishedAt: "2026-04-02",
    body: `
Es la pregunta que más nos hacen. Acá va la comparación cruda, sin sponsoreos (vendemos las 3 y no nos conviene que elijas una sobre otra, solo la correcta).

### Resumen rápido

| Marca | Gama | Proteína (típica adulto) | Precio por kilo (ARS 2026) | Para quién |
|---|---|---|---|---|
| **Royal Canin** | Premium / terapéutica | 22–26% | ~$3.600–$4.500 | Perros con patologías específicas, razas puras |
| **Pro Plan** | Premium | 25–27% | ~$3.200–$3.800 | Perros adultos sanos que buscás performance |
| **Jaspe** | Nacional calidad | 21–23% | ~$2.100–$2.600 | Relación precio/calidad, presupuesto medio |

### Royal Canin

Fortaleza: **líneas específicas por raza y por patología**. Tienen alimento distinto para Yorkshire que para Labrador, porque los masticadores, las mandíbulas y los requerimientos cambian. También tienen las líneas **Hypoallergenic**, **Urinary**, **Renal**, **Hepatic** que son las que más recetan los veterinarios.

Debilidad: **precio alto**, algunos ingredientes no son los más limpios (harinas de carne, maíz y trigo) a pesar del precio.

Nuestra recomendación: **elegila si tu perro tiene una indicación clínica** (alergia alimentaria, problemas urinarios, renal). Para un perro sano, hay opciones con mejor relación calidad/precio.

### Pro Plan

Fortaleza: **alto contenido proteico (25–27%) y fuentes claras** (pollo, salmón, cordero como primer ingrediente). Línea **Performance** y **Active Mind** con muy buenos resultados en perros de trabajo o jóvenes activos.

Debilidad: **cara** (aunque menos que Royal). Algunas líneas tienen maíz en los primeros 5 ingredientes.

Nuestra recomendación: **perros adultos sanos, activos, sin sensibilidades**. Razas grandes que necesitan mucha proteína para mantener masa muscular.

### Jaspe

Fortaleza: **nacional, precio muy conveniente, fórmula aceptable**. La línea **Jaspe Premium** tiene 21–23% de proteína, pollo y arroz como ingredientes principales, sin colorantes. Para la mayoría de los perros adultos sanos es totalmente adecuada.

Debilidad: **menos líneas específicas** (no hay variedad por raza o patología compleja). La presentación X 20 kg no siempre viene con la mejor calidad de fresco.

Nuestra recomendación: **presupuesto acotado o perros adultos sanos de casa** que no tienen problemas digestivos ni alergias. Es lo que alimentaría yo a mi perro si no tuviera una patología específica.

### Cómo hacer la transición sin que le caiga mal

Independiente de qué marca elijas, la transición toma 7–10 días:

- Días 1–3: 75% alimento viejo + 25% nuevo
- Días 4–6: 50% + 50%
- Días 7–9: 25% + 75%
- Día 10: 100% alimento nuevo

Si hay diarrea, volvé un paso atrás 2 días antes de seguir avanzando.

### Nuestro top 3 por tipo de perro

- **Perro adulto sano, presupuesto medio:** Jaspe Premium
- **Perro activo o de raza grande, sin patología:** Pro Plan Adult
- **Perro con alergia, problema urinario o renal:** Royal Canin línea específica (con indicación del vet)

---

Si dudas, entrá a cualquier sucursal con una bolsa del alimento actual — miramos la tabla nutricional y te recomendamos la equivalencia más cercana en relación precio/valor. O pedí una [consulta televeterinaria](/televeterinaria/agendar) si querés planificar un cambio más profundo.
    `.trim(),
  },
  {
    slug: "como-prevenir-garrapatas-en-el-noa",
    title: "Cómo prevenir garrapatas en el NOA — la guía definitiva",
    excerpt:
      "En Tucumán, Salta y Jujuy las garrapatas son endémicas todo el año. Estos son los 4 métodos que funcionan y los que son una estafa.",
    category: "Salud",
    emoji: "🦠",
    readingMinutes: 4,
    seoTitle: "Prevención de garrapatas en el NOA — collar, pipeta, spray | La Mascotera",
    seoDescription:
      "Guía local: qué método antigarrapatas funciona mejor en Tucumán, Salta, Jujuy. Collar vs pipeta vs comprimido. Qué NO usar.",
    publishedAt: "2026-04-08",
    body: `
Si vivís en el NOA y tenés un perro, las garrapatas son un tema serio. La **erliquiosis** y la **babesiosis** que transmiten pueden matar a tu perro en menos de 3 semanas si no las tratás a tiempo.

### Por qué el NOA es crítico

El clima cálido y húmedo de Tucumán, Salta, Jujuy y parte de Catamarca permite que la **garrapata marrón del perro (*Rhipicephalus sanguineus*)** se reproduzca **11 meses al año**. Una sola hembra pone 3.000 huevos. Un perro infestado puede tener 200+ garrapatas en 2 semanas.

### Los 4 métodos que FUNCIONAN

#### 1. Collar Seresto (el gold standard)

- Fipronil + permetrina de liberación lenta.
- **Dura 8 meses** por collar.
- Precio: ~$35.000 (perro chico) / $42.000 (perro grande).
- Costo mensual equivalente: $4.500 / $5.200.
- **Pros:** sin manipulación, impermeable, súper efectivo.
- **Contras:** los perros de paseador lo pierden a veces (cuidar que no queden colgando con otro perro).

#### 2. Comprimido oral NexGard Spectra / Bravecto

- Afoxolaner (NexGard) o fluralaner (Bravecto).
- **NexGard: 1 mes por comprimido. Bravecto: 3 meses.**
- Precio NexGard: ~$15.000 el mensual. Bravecto: ~$38.000 el trimestral.
- **Pros:** mata garrapatas en 12–24 hs después de la picadura, además cubre pulgas y parásitos intestinales (Spectra).
- **Contras:** efecto sistémico (pasa por hígado). No recomendado en perros con epilepsia o insuficiencia hepática.

#### 3. Pipeta mensual (Frontline, Advantix, Advocate)

- Permetrina / imidacloprid tópicos.
- **Dura 1 mes**. Precio: ~$5.000 la pipeta.
- **Pros:** económico, buen costo/beneficio.
- **Contras:** hay que acordarse todos los meses. Si se mojan en las primeras 48 hs pierde efectividad.
- **Importante:** la permetrina es **mortal para gatos**. Si tenés perro y gato en casa, usá pipetas sin permetrina (Advantage, no Advantix).

#### 4. Spray o baño pulguicida (Frontline, K-Othrine)

- Solo para **tratamiento puntual**. No sirve como prevención mensual porque dura 2–3 días.
- Útil para una infestación visible antes de empezar con un método de los anteriores.

### Lo que NO sirve

- **Shampoo "anti-pulgas y garrapatas" genérico.** Solo actúa mientras estás bañándolo. Dura 0 efecto al día siguiente.
- **Polvos y aerosoles "naturales".** La mayoría son repelentes olfativos suaves (lavanda, eucalipto) y las garrapatas del NOA son inmunes por exposición constante.
- **Collar pulguicida genérico de dos luquitas.** No tienen la concentración ni el tiempo de liberación de Seresto; funcionan 15–30 días.

### Combinación recomendada

Lo que funciona en la mayoría de nuestros clientes del NOA:

- **Collar Seresto permanente** (baseline)
- **+ pipeta mensual en primavera/verano** (septiembre a marzo, cuando hay picos)
- **+ revisión manual diaria** en zonas que los collares no alcanzan (entre dedos, orejas internas, axilas)

### Si encontrás una garrapata pegada

1. NO la arranques con los dedos ni le pongas aceite/alcohol (vomita y te transmite bichos).
2. Con una pinza fina, agarrala lo más cerca posible de la piel del perro y tirá recto, sin rotar.
3. Lavá la zona con agua y jabón.
4. Si la encontrás con la cabeza hundida o se rompe, andá al vet.
5. Mirá a tu perro los siguientes 14 días: fiebre, decaimiento, orina oscura → al vet urgente para descartar erliquiosis.

---

En nuestras sucursales te asesoramos gratis qué combinación te conviene según dónde vivís (Yerba Buena tiene más garrapatas que Salta capital) y cuántos perros tenés. O pedí una [consulta televeterinaria](/televeterinaria/agendar) para armar un plan personalizado.
    `.trim(),
  },
]
