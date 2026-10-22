# Movimiento

## Principios

1. **Un solo gran momento.** El Big Bang es el clímax orquestado (carga, temblor, destello, explosión, nombre que
   se expande). El resto del movimiento es tranquilo y continuo.
2. **El scroll manda.** Casi todo lo que cambia lo hace porque el usuario avanza; el movimiento autónomo
   (giros, nado, respiración) es lento y sutil.
3. **La interfaz no baila.** Los componentes DOM solo animan color, opacidad y posición corta en transiciones
   breves. Nada de rebotes ni escalas exageradas.
4. **Movimiento reducido es de primera clase**, no un parche (tabla en `docs/02-experiencia/estados-y-accesibilidad.md`).

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--dur-fast` | 150 ms | Color y borde en hover/focus |
| `--dur-base` | 250 ms | Encendido de grupos, filas y pins |
| `--dur-slow` | 400 ms | Entrada del lienzo, avisos, diálogos |
| `--dur-flight` | 800 ms | Vuelo de cámara a una placa |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entradas y vuelos (salida exponencial) |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Fundidos simétricos |

Con `prefers-reduced-motion: reduce`, las duraciones de la interfaz pasan a 0 ms, salvo los fundidos de
opacidad, que se quedan en 150 ms.

## Constantes de la experiencia (referencia; viven en el código como constantes con nombre)

| Constante | Valor | Dónde |
|---|---|---|
| Suavizado del scroll `k` | 3,4 (12 con movimiento reducido) | `scroll-y-escena.md` |
| Carga de detonación | 1,5 s para llenar; descarga 1,8/s | Capítulo 0 |
| Destello | pico en `m` 0–0,2, opacidad máx. 0,75 (0,95 al detonar) | Capítulo 0 |
| Temblor | hasta 9 px con el destello + 3 px por carga | Capítulo 0 |
| Retraso de morph por partícula | hasta el 25 % de la transición | Escena |
| Ciclo de placas | 2,6 s | Capítulo 3 |
| Giro de nebulosa / galaxia / Tierra | 0,018 / 0,035 / 0,05 rad/s | Escena |
| Nado de la tortuga | aletas 1,3 rad/s; balanceo 0,7 rad/s; giro 0,25 rad/s | Escena |
| Entrada del lienzo | 400 ms | Carga |

## Coreografía del Big Bang

```
t (carga)     0 ─────────────── 1,5 s
punto         crece y vibra ──────────► 
halo          se expande ─────────────►
nombre wdth   62 ──────────────────► 50   (se comprime hasta el mínimo del eje)
pantalla      temblor leve ───────────►
                                    │ detonación
destello                            ███▓▒░  (≈ 0,6 s)
partículas                          explosión → nebulosa
nombre wdth                         50 → 150 + espaciado, mientras sube y se va
scroll                              automático hasta «About»
```
