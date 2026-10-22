# Estado del proyecto

> Actualizado: 2026-10-22

## Fase actual
**F0 · Contexto del proyecto** (modo NUEVO, `/docs` + Mapa): espina dorsal creada e incoherencias entre docs
corregidas. Falta decidir Taller/Mesa; después, F1 (`env-init`).

## Hecho
- Documentación fuente completa en `docs/` (00-vision … 06-roadmap + prototipo v0.1).
- Espina dorsal en la raíz: `CLAUDE.md` (con Mapa a `docs/`), `STATE.md`, `DECISIONS.md` (ADR-001 a ADR-012),
  `DEVELOPMENT_RULES.md`.
- Corregidas 7 incoherencias entre docs (2026-10-22):
  1. `modelo-de-datos.md`: `SkillGroupId` incluye `'ai'` (4 constelaciones).
  2. `arquitectura.md`: `<SceneMount />` se monta una sola vez en `root.tsx`; las rutas solo escriben en `sceneStore`.
  3. `04-escena/README.md`: `sceneStore` sale de `src/scene/`; vive en `src/stores/`.
  4. `movimiento.md`: el nombre se comprime hasta `wdth` 50 (mínimo de Anybody), no 48.
  5. `textos-sitio.md`: `hud.billionYears` ES = «{n} millones de años» con `{n}` en millones (13.800).
  6. `componentes.md`: `ActionLink` con `rel="noopener noreferrer"`.
  7. `02-experiencia/README.md` y `navegacion.md`: ES en `/es` y segmento `projects` en ambos idiomas.
- Repo git inicializado, sin commits (rama actual `master`).

## Pendiente / siguiente paso
1. Decidir si se usa la cadena **Taller/Mesa** (el roadmap la recomienda a partir de F3).
2. F1 · `env-init`: renombrar la rama a `main`, `.gitattributes` (`* text=auto eol=lf`) **antes del primer
   commit**, `.gitignore`, `.nvmrc`, `.npmrc`, andamiaje de React Router en la raíz con `appDirectory: "src"`,
   calidad, CI, repo en GitHub y Vercel. Hecho cuando: `npm run check` y `npm run build` en verde en local y CI.

## Deuda / incoherencias detectadas
Entre documentos (aún no hay código):
1. **`SkillGroupId` sin `ai`:** `docs/01-contenido/modelo-de-datos.md` define `'web' | 'libraries' | 'tools'`, pero
   `habilidades.md` y `constelaciones-y-placas.md` usan 4 grupos (también `ai`).
2. **Dónde se monta la escena:** `arquitectura.md` dice que `routes/journey.tsx` y `routes/project.tsx`
   renderizan `<SceneMount />`, y en el mismo documento (y en `04-escena/README.md`) que el lienzo vive en
   `root.tsx` y persiste entre rutas. Montarlo por ruta lo recrearía al navegar (rompe la transición de F5).
3. **Ubicación de `sceneStore`:** `04-escena/README.md` propone `src/scene/store/sceneStore.ts`; `arquitectura.md`
   lo pone en `src/stores/` (y la regla de capas lo exige ahí: `stores` no importa `scene`).
4. **Eje `wdth` fuera de rango:** `03-diseno/movimiento.md` comprime el nombre hasta `wdth` 48, pero Anybody va
   de 50 a 150 (`design-system.md`, `assets.md`).
5. **Cifras del HUD en ES:** `textos-sitio.md` → `hud.billionYears` ES «{n} mil millones de años» daría
   «13,8 mil millones», mientras la regla 5 de `01-contenido/README.md` y los eyebrows usan «13.800 millones de años».
6. **`rel` de enlaces externos:** `03-diseno/componentes.md` (`ActionLink`) dice `rel="noopener"`;
   `git-y-despliegue.md` exige `rel="noopener noreferrer"`.
7. **Rutas ES pendientes en un doc ya resuelto:** `02-experiencia/README.md` deja abierto `/es/projects/` vs
   `/es/proyectos/` (y escribe `/es/`); `arquitectura.md` ya fijó `/es` + `projects` en ambos idiomas.

## Bloqueos / dudas abiertas
- **D2 · Dominio** propio o subdominio de Vercel (necesario en F7).
- **D5 · Analítica:** ninguna o una sin cookies (F7).
- Tareas de Víctor: confirmar curso de Hola Mundo terminado (F2) · estrellas de IA como prácticas o herramientas
  (F2/F4.3) · script de consola en el README de Chessmate (F2) · CV en PDF EN/ES.
- ⚠ Por verificar en `env-init`: `@fontsource-variable/anybody` con `standard.css` incluye el eje `wdth`.
- ⚠ Por verificar en F7: servir la 404 pre-renderizada con estado 404 real en Vercel.
