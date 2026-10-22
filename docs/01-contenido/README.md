# Contenido · índice y reglas

> Todo el texto y los datos reales del sitio. La escena 3D **no** define contenido: lo lee de aquí.
> Idioma principal del sitio: **inglés (EN)**. Segundo idioma: **español (ES)**.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `modelo-de-datos.md` | Tipos TypeScript del contenido, reglas de validación y dónde vivirá en el código |
| `perfil.md` | Datos personales: identidad, bio, fortalezas, disponibilidad, contacto, formación |
| `habilidades.md` | Grupos de habilidades (las constelaciones) |
| `textos-sitio.md` | Todos los textos de interfaz EN/ES: capítulos, navegación, HUD, modo misión rápida, 404, SEO |
| `proyectos/chessmate.md` | Ficha completa de Chessmate (EN/ES) |
| `proyectos/astrohub.md` | Ficha completa de AstroHub (EN/ES) |
| `proyectos/cosmos.md` | Ficha de este propio portfolio (EN/ES, se completa al construirlo) |
| `assets.md` | Inventario de imágenes, tipografías, CV e imagen para compartir |

## Reglas de contenido

1. **Una sola fuente.** Cada dato existe en un único sitio (`src/content/`). La escena, el modo misión rápida,
   las páginas de proyecto y el SEO leen de ahí; nada se copia a mano entre componentes.
2. **EN es la referencia.** Se escribe primero en inglés; el español es traducción fiel, no otro texto.
   Ninguna clave puede existir en un idioma y faltar en el otro (lo comprueba un test).
3. **Voz.** Primera persona, frases cortas y directas, sin superlativos vacíos («increíble», «apasionado»).
   La metáfora cósmica vive en títulos y etiquetas; los párrafos cuentan hechos concretos.
4. **Nombres propios sin traducir.** Tecnologías, academias y proyectos se escriben igual en los dos idiomas.
5. **Cifras con formato local.** Se formatean con `Intl` según el idioma:
   EN `13.8 billion years`, `100,000 light-years`; ES `13.800 millones de años`, `100.000 años luz`.
6. **Accesibilidad del texto.** Toda imagen lleva `alt` en los dos idiomas; los textos de los botones dicen
   exactamente lo que hacen.

## Correcciones respecto al sitio actual

- **Nota del curso Fullstack:** no se muestra en ningún sitio (decisión del paso 2). En su lugar, la bio destaca
  las 948 horas de formación intensiva.
- **Curso de React + TypeScript (Hola Mundo):** el dato actual mezcla «terminado» con «En progreso».
  Se marca como **completado (2025, 13 h)**, confirmado por Víctor (F2 · paso 2).
- El email del pie de la web actual enlaza a la home; en la nueva se muestra como texto copiable con botón «Copy».
- «Portfolio Web» (sitio actual) deja de ser proyecto: su placa la ocupa **Cosmos** (decisión del paso 2).
