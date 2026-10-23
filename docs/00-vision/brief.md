# Brief · Portfolio Cosmos

> Documento fuente del proyecto. Lo lee `project-bootstrap` para montar el contexto.
> Idioma de la documentación: español. Idioma principal del sitio: **inglés** (segundo: español).

## 1. Qué es

El portfolio personal de **Víctor Pérez (Tortoise_code)**, desarrollador frontend, contado como un viaje
por scroll desde el Big Bang hasta la Tierra. Cada etapa del universo es una sección del portfolio, y una
tortuga cósmica carga sus proyectos sobre el caparazón.

Nombre del proyecto: **`cosmos-portfolio`**. Repo en GitHub: **`Tortoise-code-Z/Portfolio---Cosmos`**.

## 2. Objetivo

1. **Conseguir entrevistas** para puestos de frontend (React + TypeScript).
2. **Demostrar con la propia web** lo que se vende: precisión de maquetación, interactividad, rendimiento,
   accesibilidad y código limpio. La web es, en sí misma, el proyecto estrella del portfolio.
3. **Ser memorable**: que quien la vea la recuerde y la comparta.

## 3. Público

| Perfil | Qué hace en la web | Qué necesita |
|---|---|---|
| RR. HH. / recruiters | Escanea 30–60 s, a menudo desde el móvil | Nombre, rol, proyectos y contacto sin esfuerzo |
| Tech leads / devs | Explora, abre el repo, mira el código y el rendimiento | Calidad técnica visible, repo público ordenado |
| Curiosos / red | Juega con la experiencia | Un momento «wow» que den ganas de compartir |

## 4. Tesis y principios

**Tesis: espectacular, pero fácil de seguir.** El espectáculo nunca puede costarle a nadie la información.

- **P1 · La información primero.** Todo el contenido existe en el HTML y se puede leer, navegar y usar sin la
  escena 3D: sin WebGL, con `prefers-reduced-motion` o con un lector de pantalla.
- **P2 · Un recorrido lineal.** Scroll = tiempo cósmico. Siempre se sabe dónde estás (raíl con el nombre real
  de cada sección) y cómo saltar a lo que buscas (accesos directos y modo misión rápida).
- **P3 · Espectáculo con propósito.** Cada efecto cuenta algo del contenido: la nebulosa es el origen, las
  constelaciones agrupan las skills y las placas del caparazón son los proyectos.
- **P4 · El rendimiento es parte del diseño.** Presupuesto de partículas por dispositivo, carga diferida de la
  escena y degradación elegante.
- **P5 · Accesible de serie.** Teclado, foco visible, contraste, textos alternativos y movimiento reducido.
- **P6 · Código de escaparate.** Repo público, TypeScript estricto, tests y documentación: lo que vea un tech
  lead en GitHub también vende.

## 5. Concepto narrativo

| # | Capítulo (escena) | Sección | Tiempo cósmico | Escala |
|---|---|---|---|---|
| 0 | Singularidad → Big Bang | Inicio (hero) | t = 0 s | ≈ 10⁻³⁵ m |
| 1 | Nebulosa y nacimiento de una estrella | Sobre mí | ≈ 200 millones de años | ≈ 20 años luz |
| 2 | Galaxia espiral y constelaciones | Habilidades | ≈ 1000 millones de años | ≈ 100.000 años luz |
| 3 | Tortuga cósmica con un bosque sobre el caparazón | Proyectos | tiempo mítico (∞) | 1 tortuga |
| 4 | La Tierra al amanecer | Contacto + formación | 13.800 millones de años | 12.742 km |

El detalle de cada capítulo vive en `docs/02-experiencia/`.

## 6. Métricas de éxito (medibles)

**Seguible**
- Un recruiter llega a los proyectos en **≤ 10 s y ≤ 2 interacciones** (acceso directo o modo misión rápida).
- El contenido es legible **antes** de que cargue la escena 3D.

**Rendimiento** (medido en build de producción)
- **60 fps** en un portátil medio; **≥ 30 fps** en un móvil de gama media.
- Core Web Vitals en móvil: **LCP < 2,5 s**, **CLS < 0,1**, **INP < 200 ms**.
- Lighthouse móvil: Performance **≥ 85**, Accessibility **≥ 95**, Best Practices **≥ 95**, SEO **≥ 95**.

**Calidad**
- 0 errores en consola; funciona sin WebGL y con movimiento reducido.
- Build, lint y tests en verde en CI en cada push a la rama principal.

## 7. Alcance

**Versión 1 (MVP)**
- Los 5 capítulos con su escena de partículas y el morph entre ellos guiado por el scroll.
- «Mantén pulsado para detonar», gravedad del cursor, constelaciones interactivas y placas de proyecto.
- Barra superior, raíl de capítulos, HUD (reloj cósmico y escala) y **modo misión rápida**.
- **Página propia por proyecto** (ruta tipo `/projects/chessmate`): descripción, retos, stack, capturas y enlaces.
  Se puede compartir y la indexan los buscadores.
- **Disponibilidad visible**: indicador «open to work», ubicación y modalidad.
- **CV en PDF** descargable (el enlace aparece cuando el PDF exista; prepararlo es tarea aparte).
- Contenido bilingüe **EN (principal) / ES** con selector de idioma.
- Alternativa sin WebGL, `prefers-reduced-motion` y versión móvil.
- SEO básico (meta, Open Graph, imagen para compartir) y despliegue en Vercel.

**Fuera de la v1 (backlog)**
- Cielo real según la ubicación y la hora del visitante.
- Foto astronómica del día (NASA APOD).
- Sonido ambiente opcional y easter egg de «salto warp».

## 8. Restricciones

- Entorno de desarrollo: **Windows 11 + PowerShell**.
- Stack base: **React + TypeScript** (detalle y versiones en `docs/05-tecnico/`).
- Git con repo en **GitHub**; despliegue en **Vercel**.
- Sin backend en la v1: sitio estático.
- Coste: 0 € (servicios en plan gratuito).

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Rendimiento en móvil (decenas de miles de partículas) | Presupuesto por dispositivo, DPR limitado, carga diferida y medición en dispositivo real |
| La animación tapa la información | Principio P1, modo misión rápida y tests de recorrido sin escena |
| SEO de una SPA con rutas propias | HTML pre-renderizado por ruta e idioma, decisión en `docs/05-tecnico/` |
| Alcance que crece sin fin | Backlog cerrado y fases con «hecho» definido en el roadmap |
| Accesibilidad de un lienzo WebGL | El lienzo es decorativo (`aria-hidden`); todo el contenido vive en el DOM |

## 10. Dudas abiertas

**Resueltas**
- D1 · Nombre: proyecto `cosmos-portfolio`; repo `Portfolio---Cosmos` (se mantiene el nombre con el que se creó).
- D3 · CV en PDF: sí; hay que prepararlo (tarea fuera del código).
- D4 · Detalle de proyectos: rutas propias por proyecto.
- D6 · Disponibilidad: se muestran «open to work», ubicación y modalidad (valores en `docs/01-contenido/`).

**Abiertas**
- **D2 · Dominio propio** o subdominio de Vercel.
- **D5 · Analítica**: ninguna, o una respetuosa con la privacidad y sin cookies (por ejemplo, Vercel Web Analytics).
