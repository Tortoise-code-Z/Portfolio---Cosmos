# Técnico · índice y decisiones de partida

| Archivo | Qué define |
|---|---|
| `stack.md` | Versiones exactas, motivos, compatibilidad con Windows 11, conflictos y política de actualización |
| `arquitectura.md` | Tipo de app, estructura de carpetas, capas, rutas e idiomas, estado, carga de la escena, entorno, errores |
| `calidad.md` | TypeScript, ESLint/Prettier, scripts, tests, cobertura, presupuestos y definición de «hecho» |
| `git-y-despliegue.md` | Repo, ramas, commits, hooks, CI, despliegue en Vercel y seguridad |

## Decisiones de partida (para convertir en ADR en `DECISIONS.md` al hacer `project-bootstrap`)

| # | Decisión | Alternativas descartadas |
|---|---|---|
| 1 | Vite + React + TypeScript con **React Router en modo framework, `ssr: false` + pre-renderizado** | Next.js (más peso y servidor que no necesitamos); SPA sin pre-render (SEO y LCP peores) |
| 2 | **React Three Fiber** sin drei, shaders GLSL propios | Three.js imperativo (peor integración con React); drei (dependencia grande para poco uso) |
| 3 | **Un único sistema de partículas** con morph en el shader | Objetos por escena (más memoria y cortes entre escenas) |
| 4 | **Zustand** para estado de UI y store mutable de escena | Context (re-renders); Redux (exceso) |
| 5 | **CSS Modules + tokens CSS** | Tailwind (efectos a medida acabarían fuera) |
| 6 | **i18n propio** con diccionarios tipados; EN principal sin prefijo, ES en `/es` | react-i18next (dependencia innecesaria); redirección automática (malo para SEO) |
| 7 | **Solo tema oscuro** | Tema claro (rompe el mundo visual) |
| 8 | **TypeScript 6.0.3 y ESLint 9.39.5** en lugar de las últimas mayores | TS 7 y ESLint 10 (incompatibles hoy con typescript-eslint y jsx-a11y) |
| 9 | **Node 24.22.0 LTS** | Node 26 (LTS desde el 28-10-2026; se evalúa tras la v1) |
| 10 | Capturas de regresión visual en **Docker** (imagen oficial de Playwright) | Capturas en cada máquina (difieren entre Windows y Linux) |
| 11 | **Universo determinista** (PRNG con semilla) | `Math.random` (tests y capturas inestables) |
| 12 | Repo **público** con licencia MIT para el código | Repo privado (pierde valor de escaparate) |
