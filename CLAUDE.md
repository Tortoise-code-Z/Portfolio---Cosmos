# cosmos-portfolio

Portfolio de Víctor Pérez (Tortoise_code), desarrollador frontend: un viaje por scroll del Big Bang a la Tierra,
pensado para conseguir entrevistas de frontend (React + TypeScript). Sitio EN (principal) / ES.

## Stack
React 19 + TypeScript 6 sobre Vite 8, React Router 8 en modo framework (`ssr: false` + pre-renderizado),
React Three Fiber + shaders GLSL propios, Zustand, CSS Modules + tokens. Node 24 LTS. Sitio estático en Vercel.
Versiones exactas y conflictos → `docs/05-tecnico/stack.md`.

## Estructura
Código en la raíz del repo, `src/` como `appDirectory` de React Router (previsto en
`docs/05-tecnico/arquitectura.md`). Lo confirma `env-init` tras andamiar. Aún no hay código.

## Mapa del proyecto
- Índice de la documentación y prioridad entre docs → `docs/README.md`
- Visión: objetivo, público, principios P1–P6, métricas, alcance, riesgos, dudas D1–D6 → `docs/00-vision/brief.md`
- Contenido y textos EN/ES, modelo de datos tipado → `docs/01-contenido/` (empieza por `README.md`)
  - Proyectos (fichas) → `docs/01-contenido/proyectos/<slug>.md`
- Experiencia: scroll y `m`, navegación, estados y accesibilidad → `docs/02-experiencia/`
  - Un archivo por capítulo (0–4) → `docs/02-experiencia/capitulos/`
  - Página de proyecto → `docs/02-experiencia/pagina-proyecto.md`
- Diseño: tokens, tipografía, componentes, movimiento → `docs/03-diseno/` (empieza por `design-system.md`)
- Escena 3D: partículas, shaders, formas, cámara, constelaciones, placas, rendimiento → `docs/04-escena/`
- Stack y versiones → `docs/05-tecnico/stack.md`
- Arquitectura (carpetas, capas, rutas, estado, errores) → `docs/05-tecnico/arquitectura.md`
- Calidad (TS, lint, tests, cobertura, presupuestos, «hecho») → `docs/05-tecnico/calidad.md`
- Git, CI, despliegue y seguridad → `docs/05-tecnico/git-y-despliegue.md`
- Roadmap: fases F0–F7 y tareas de Víctor → `docs/06-roadmap/roadmap.md`
- Prototipo visual (referencia, no código a copiar) → `docs/referencia/prototipo-v0.1.html`
- Decisiones (ADR) → `DECISIONS.md` · Estado → `STATE.md` · Reglas → `DEVELOPMENT_RULES.md`

Si dos documentos chocan: `DECISIONS.md` > `docs/00-vision/brief.md` > doc específico del tema > prototipo.

## Cómo trabajar aquí
- Método: esquema → «Visto Bueno» → ejecución paso a paso. Reglas completas en `DEVELOPMENT_RULES.md`.
- Primero la web útil, después el espectáculo: si se quita la escena 3D, el sitio sigue completo (P1).
- Carga solo los docs del Mapa que toque el paso actual; no leas `docs/` entero.
- Terminal: Windows 11 + PowerShell.
- Al empezar: lee `STATE.md`. Al cerrar: actualiza `STATE.md` (y `DECISIONS.md` si hubo decisión).
