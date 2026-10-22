# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** F2 · paso 1 hecho y en `main` (`b5f6592`) · siguiente: decidir la auditoría **AUD-F2-1** de la
Mesa y **F2 · paso 2 · capa de contenido tipada**.

_Última actualización: 2026-10-22 (**CIERRE DE SESIÓN · 2**) · GitHub blindado, CI con límite de tiempo, tokens,
estilos globales y fuentes en `main`; cadena Taller/Mesa activada en piloto._

**Hecho esta sesión:**
1. **GitHub:** solo «squash merging» (título del PR), borrado automático de ramas, «Always suggest updating».
   `main` protegida (regla clásica: PR sin aprobaciones, rama al día, checks `Typecheck · lint · format · tests`,
   `Build` y `E2E (Chromium · Firefox · WebKit)`; el admin puede saltársela). Dependabot: alerts, security updates
   y grouped security updates; version updates apagado. Documentado en `git-y-despliegue.md`.
2. **PR #5** (`1942617`): `timeout-minutes: 15` en cada job de CI.
3. **PR #6** (`b5f6592`) · **F2 · paso 1:** `src/styles/tokens.css` (todos los tokens), `global.css` (reset, fondo,
   `h1`–`h3` en rol display, foco ámbar), `fonts.css` (`@font-face` propios, solo latino: **111,4 KB** de 150) y
   precarga de Anybody y Geologica en `root.tsx`. Eje `wdth` de Anybody verificado. Tokens nuevos
   (`--leading-*`, `--weight-*`, `--wdth-*`, foco, `--gutter`…) y `--dur-fade-*` para el movimiento reducido.
   **ADR-015** (solo tema oscuro). Tests: invariantes de tokens (ningún token sin definir, ningún color literal,
   contraste AA) y e2e del sistema de diseño; CI en verde en los tres navegadores.
4. **Cadena Taller/Mesa activada** en modo piloto. Buzón en `_claude/cadena/` (ignorado en local con
   `.git/info/exclude`). AUD-F2-1 lanzada (en curso al cerrar). Reglas de la cadena en `DEVELOPMENT_RULES.md` §13.
5. `DEVELOPMENT_RULES.md`: §2.1 «En cristiano» y regla del título del PR en §10.

**Incidencias y lecciones:**
- El squash del PR #6 entró como «Feat/design tokens (#6)», no en Conventional Commits: con varios commits, GitHub
  titula el PR con el nombre de la rama. `main` no se reescribe. Regla nueva en §10: pegar siempre el título del
  Taller al abrir el PR.
- Los checks obligatorios de `main` se identifican por el `name` del job: renombrar un job exige actualizar la
  regla de protección (anotado en `git-y-despliegue.md`).
- En jsdom, `new URL(..., import.meta.url)` no es `file:`: los tests que leen archivos usan
  `// @vitest-environment node`.
- Cada navegador serializa distinto el valor de una custom property: los e2e miden el efecto calculado
  (p. ej. `transition-duration`), no el texto de la variable.
- **Piloto · sesión 1 de 2:** un encargo (AUD-F2-1), lanzado sin incidentes; la entrega llega a la sesión 3.

**Deuda anotada:**
- **JS inicial ~112 KB gzip** frente a ≤ 120 KB (`calidad.md`): sin cambios con el paso 1 (el CSS suma 1,7 KB
  gzip). Vigilar en cada paso de F2; si no cabe, ADR.
- La tilde de «VÍCTOR» toca el borde superior en la página «hello» (sin maquetación): se resuelve en F2.4 con
  `--hero-accent-room`.
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- Provisional: textos de «hello» y del `ErrorBoundary` raíz (→ `src/content` en F2); `favicon.svg` (→ F6); 404
  genérica de Vercel (→ nuestra página en F2, configuración en F7).

**Siguiente paso (próxima sesión):**
1. Arrancar con `session-start` (y la skill `taller`). Leer la entrega de la Mesa en
   `_claude/cadena/aud-f2-1/auditoria.md`, elegir qué se corrige y hacerlo en su propio commit y PR.
2. **F2 · paso 2:** capa de contenido tipada + tests de invariantes (`docs/01-contenido/`, empezar por su
   `README.md` y `modelo-de-datos.md`), con esquema → Visto Bueno. Zona caliente: `src/content/**`.

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7) · ¿pasar la cadena a modo completo tras la
sesión 3? · Tareas de Víctor: confirmar curso de Hola Mundo terminado (F2), estrellas de IA como prácticas o
herramientas (F2/F4.3), script de consola en el README de Chessmate (F2), CV en PDF EN/ES.
**Limpieza manual del usuario:** ramas locales ya fusionadas: `git branch -D chore/env-init chore/site-url
docs/session-close-2026-10-22 feat/design-tokens` (y la del cierre de hoy, cuando se fusione). ·
**Bloqueos:** ninguno.
