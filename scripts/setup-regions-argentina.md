# Setup de regiones Argentina en Medusa (2026-04-19)

Este setup se ejecuto una vez via Admin API. Registra los IDs generados para referencia.

## Region
- **Argentina (ARS)** -> `reg_01KPKCG4EBTD2AJEXKQVCEECQB`

## Sales Channels (8, uno por region del ecommerce propio)

| Nombre | ID |
|---|---|
| Catamarca | sc_01KPKCJEBCTA782VXEHJ128E5Q |
| Chaco | sc_01KPKCJECAFV4TNC2FK9DP99DJ |
| Cordoba | sc_01KPKCJEG7KQNYFDM2ZHETYMHN |
| Jujuy | sc_01KPKCJED27208QVXZSRRC1DP0 |
| Mendoza | sc_01KPKCJEDRCBTF9FACT926HTWG |
| Oran | sc_01KPKCJEFDXVS09FKHQM5X5P19 |
| Salta-Leguizamon | sc_01KPKCJEEJ2B9HAXTGABMZMX1Q |
| Zapala | sc_01KPKCJEH1S313GZPXX6JN8Y09 |

## Stock Locations (9, mapeados a depositos DUX)

| Nombre | Medusa ID | DUX id_deposito |
|---|---|---|
| Deposito Julio Monti Catamarca | sloc_01KPKCJEQBDQZQ7MH9YTZA5ADW | 18353 |
| Deposito Chaco Fernando | sloc_01KPKCJEKKEWD51NH1S42CRJVX | 20585 |
| Deposito Masjujuy Lamadrid | sloc_01KPKCJENWK76968C5YS05EASY | 18311 |
| Deposito Godoy Cruz | sloc_01KPKCJEN2M2HCANDM7ABPEE48 | 20329 |
| Deposito Las Heras Mendoza | sloc_01KPKCJEM9KXXFDKFWHYYBZ406 | 19144 |
| Deposito Leguizamon Salta | sloc_01KPKCJEJVWE7Y2PYC70R1G9WM | 18498 |
| Deposito Mascotera Oran | sloc_01KPKCJEHW9T6Z00156A8KRQ6B | 18321 |
| Deposito Rumipet Cordoba | sloc_01KPKCJEPKK8W136KEDT04SHFV | 18313 |
| Deposito Zapala | sloc_01KPKCJER84NGPKN59WXZ0GV5M | 17719 |

## Links sales_channel <-> stock_location

Cada sales_channel mapea a su stock_location directo, EXCEPTO **Mendoza que tiene 2** (Godoy Cruz + Las Heras consolidados).

## Publishable API Key expandida

`apk_01KPKBC6BGDP4DSNAE2C8WBM6F` tiene acceso a los 9 sales channels.

## Admin user
- Email: admin@lamascotera.com.ar
- Password: NexovetAdmin2026! (cambiar despues del primer login en /app)
