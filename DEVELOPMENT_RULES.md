# Reglas de desarrollo

> Cómo se trabaja en `cosmos-portfolio`. Destilado de las reglas fuente del método y aterrizado en este proyecto.
> Los números concretos (versiones, umbrales, presupuestos) **no** viven aquí: están en los docs que se citan,
> para que no se desactualicen.

## 1. Rol

Claude actúa como ingeniero de software senior y arquitecto: piensa antes de tocar, justifica decisiones y
prioriza la mantenibilidad sobre la velocidad aparente. Objetivo: código estructurado, mantenible, escalable y
libre de errores evitables.

## 2. Método: esquema → Visto Bueno → ejecución

1. **Esquema:** pasos, archivos afectados, riesgos y qué se blinda. Solo el plan, sin código.
2. **Visto Bueno:** se espera la aprobación explícita. Si hay cambios, se ajusta el esquema antes de seguir.
3. **Ejecución paso a paso:** un paso, verificable, y no se avanza hasta confirmarlo.

No se salta por tener el código delante ni por parecer obvio. Una rama y un PR por tarea (`docs/06-roadmap/roadmap.md`).

### 2.1 «En cristiano»

Cada esquema (y cada entrega relevante) lleva, además del detalle técnico, un apartado **«En cristiano»**: qué se
hace y para qué, explicado como a alguien que empieza, sin tecnicismos y con alguna comparación cotidiana si ayuda.
Víctor decide el Visto Bueno entendiendo el paso, no solo leyéndolo.

## 3. Contexto en archivos

- Al empezar: leer `CLAUDE.md`, `STATE.md` y estas reglas. Después, solo los docs del Mapa que toque el paso.
- Al cerrar: `STATE.md` al día (dónde quedamos, qué falta, qué falló) y `DECISIONS.md` si hubo decisión.
- **Dudas de Víctor:** cada duda de concepto se responde y se guarda explicada en cristiano y en detalle
  (comparaciones, paso a paso y el porqué) en `_claude/dudas/AAAA-MM-DD-tema.md`, con una línea en su `README.md`.
- Si la conversación se satura de errores o iteraciones: guardar estado y abrir una conversación limpia.
- En cada paso, indicar si conviene seguir en esta conversación o abrir otra, y qué archivos releer.
- Si dos documentos chocan: `DECISIONS.md` > `docs/00-vision/brief.md` > doc específico > prototipo. El
  prototipo (`docs/referencia/`) es referencia visual y de comportamiento, **nunca** código a copiar.

## 4. Prevención de errores

- **Validar antes de modificar:** revisar estructura y código existentes para no duplicar ni romper.
- **Nada destructivo sin confirmación explícita** (borrar, sobrescribir, renombrar).
- **Decisiones técnicas relevantes → ADR** en `DECISIONS.md` (contexto, decisión, alternativas, consecuencias).
- **Señalar los supuestos:** lo no confirmado se marca (⚠) en vez de darlo por hecho.

## 5. Estándares de código

- **TypeScript estricto** con los flags extra de `docs/05-tecnico/calidad.md`. Sin `any`; `unknown` + estrechamiento
  en los bordes. Tipos de retorno explícitos en lo exportado. Sin aserciones que tapen problemas reales.
- **Errores:** ningún camino de fallo sin tratar; ningún `catch` vacío. Todo error capturado se registra con
  contexto (sin datos personales) o se muestra al usuario si le afecta. La escena está aislada en su propio
  `ErrorBoundary`: un fallo 3D nunca tumba la página.
- **Validación en los límites:** variables de entorno al arrancar el build; cualquier dato externo futuro (p. ej.
  NASA APOD) con esquema en tiempo de ejecución. El contenido propio se valida con tipos y tests.
- **Separación de responsabilidades y capas:** se respetan las reglas de dependencia entre `content`, `lib`,
  `stores`, `ui`, `features`, `scene` y `routes` de `docs/05-tecnico/arquitectura.md`; `no-restricted-imports`
  las hace cumplir.
- **Simple y explícito** sobre ingenioso. Sin duplicación, sin números mágicos (constantes con nombre en
  `config/constants.ts` y tokens), sin configuración hardcodeada.

### Reglas propias de este proyecto

- **P1 · La información primero:** todo el contenido vive en el DOM y funciona sin WebGL, con movimiento reducido
  y con lector de pantalla. El lienzo es `aria-hidden`; nada interactivo existe solo en él.
- **Nada que cambie en cada frame pasa por estado de React** (ADR-004). Cero asignaciones por frame en `useFrame`.
- **Una sola fuente de contenido** (`src/content/`). EN es la referencia; EN y ES con las mismas claves.
- **Tokens siempre:** ningún color, tamaño o duración literal en componentes (ADR-005).
- **Determinismo:** PRNG con semilla, nunca `Math.random` en la escena (ADR-011).
- **Movimiento reducido de primera clase**, no un parche (`docs/02-experiencia/estados-y-accesibilidad.md`).
- **Accesibilidad:** teclado, foco visible, contraste AA, área táctil ≥ 44 px, ningún estado comunicado solo con color.
- **El código cita docs y ADR del repo**, nunca las notas de trabajo que viven fuera de git (el buzón
  `_claude/`, las decisiones vivas, las claves de encargo `EST-…`/`AUD-…`): el repo es público y esas referencias no
  se pueden seguir. Si la frase ya se explica sola, sin cita. Lo vigila `src/code-references.test.ts`.
- **Archivos con el mismo nombre, en su carpeta** (ADR-018): `x.ts` + `x.test.ts` (o `x.module.css`) van en `x/`
  con su nombre, sin `index.ts`. Solo en `src/` y `tests/`; excepción: `src/root.tsx` + `src/root.test.tsx`. Lo
  vigila `src/structure.test.ts`.

## 6. Versiones y dependencias

- Fuente única: `docs/05-tecnico/stack.md` (versiones exactas, motivo, Windows 11, conflictos, política trimestral).
- Versiones **exactas**, sin rangos; instalación con `npm ci`. Nunca `npm update` a ciegas.
- Antes de añadir o subir una dependencia: justificarla, comprobar compatibilidad con lo fijado, pasar por
  esquema → Visto Bueno y actualizar `stack.md`.
- Lo que no se usa a propósito (drei, GSAP, Lenis, librerías de i18n, Tailwind…) no entra sin un ADR nuevo.

## 7. Entorno obligatorio

TSConfig estricto · ESLint + Prettier sin conflictos · Git con `.gitignore` y `.gitattributes` (`eol=lf`) desde el
primer commit · `.env` fuera de git y `.env.example` dentro · testing configurado desde el principio.
Detalle en `docs/05-tecnico/calidad.md` y `docs/05-tecnico/git-y-despliegue.md`.

## 8. Windows 11 + PowerShell

- Todos los comandos, compatibles con Windows PowerShell: `New-Item`, `Set-Content`, `Get-ChildItem`,
  `Copy-Item`, `Remove-Item`, `mkdir`.
- Nada de `touch`, `mkdir -p`, `rm -rf` ni otra sintaxis bash. Rutas y separadores válidos en Windows.

## 9. Seguridad

- Ningún secreto en el repo ni en el cliente; solo variables de entorno (Vercel). En la v1 no hay secretos.
- Las credenciales `TryIt` son cuentas de demo públicas; nunca se pone una credencial real.
- Validar y sanear toda entrada externa. Mínimo privilegio. No registrar datos sensibles.
- `npm audit` en CI (aviso) y antes de cada versión (bloqueante si hay altas en producción).
- Enlaces externos con `rel="noopener noreferrer"`. CSP sin `unsafe-eval`.

## 10. Git

- Ramas cortas por tarea (`feat/`, `fix/`, `chore/`, `docs/`, `test/`, `refactor/`); `main` protegida, solo por PR
  con CI en verde; fusión squash.
- **Conventional Commits en inglés**, pequeños y atómicos (`feat(scene): add turtle shape generator`).
- Nunca se commitea código que no compila, tests rotos, `.env`, `node_modules`, `build/` ni informes.
- **Claude prepara siempre los PR (preferencia de Víctor):** al terminar cada tarea entrega, listos para pegar en
  GitHub, el **título** (formato Conventional Commits, en inglés) y la **descripción** en inglés con: qué cambia,
  por qué (ADR si los hay), cómo probarlo, checklist de la definición de «hecho» y notas o deuda. También da los
  comandos de commit y push. Víctor solo los copia y pega.
- Si Claude cambia archivos **después** de dar los comandos de commit, lo avisa y vuelve a dar los comandos;
  ningún commit con mensaje vacío o «.».
- **Al abrir el PR, se pega siempre el título que da Claude.** Con varios commits, GitHub propone el nombre de la
  rama («Feat/design tokens») y el squash usaría ese título en `main` (pasó con el PR #6).

## 11. Definición de «hecho»

1. `npm run check` en verde y build correcto.
2. Tests del comportamiento añadido, con casos límite (pirámide y cobertura en `docs/05-tecnico/calidad.md`).
3. Accesibilidad revisada (teclado, foco, lector) si toca interfaz.
4. Auditoría con mirada fresca (`code-audit` o la Mesa), idealmente en contexto separado, antes de cerrar la fase.
5. `STATE.md` y, si aplica, `DECISIONS.md` y los docs afectados, actualizados.

## 12. Forma de las entregas (cuando el paso lo merece)

Para pasos relevantes (arquitectura, configuración, funcionalidad con riesgo u opciones en juego):

1. **Diagnóstico:** qué se construye, qué resuelve, qué riesgos evita, qué blinda.
2. **Comandos PowerShell** (si aplica), con una explicación breve por bloque.
3. **Instrucción de contexto:** seguir aquí o abrir conversación nueva, y qué releer.
4. **Implementación**, tras el Visto Bueno.
5. **Trade-offs:** alternativas descartadas, riesgos futuros, impacto en mantenimiento.

Para cambios pequeños y obvios, basta con lo esencial.

## 13. Cadena Taller/Mesa (auditorías en contexto separado)

Activada en la sesión 2 en **modo piloto** (2 sesiones) y en **modo completa** desde la sesión 4: auditorías a la
Mesa y, solo cuando Víctor lo pide, estudio del paso siguiente en paralelo (como mucho dos encargos abiertos).
Método general en las skills `taller` y `mesa`; aquí, solo lo propio del proyecto.

### Lo que las skills leen de cosmos-portfolio

- **Fuente de verdad:** `DECISIONS.md` > `docs/00-vision/brief.md` > doc específico del tema (Mapa de `CLAUDE.md`).
  Al cerrar, cada decisión viva va a su doc del Mapa y, si cambia arquitectura, producto o método, a un ADR en
  `DECISIONS.md`; lecciones y dudas, a `STATE.md`.
- **Buzón:** `_claude/cadena/` (tablero, decisiones vivas, una carpeta por encargo, `hecho/AAAA-MM-DD/`). Fuera de
  git con `.git/info/exclude` en el equipo de Víctor (no se añade a `.gitignore`).
- **Zona horaria:** `Europe/Dublin`.
- **Git:** lo ejecuta Víctor. Claude solo lee, con `--no-optional-locks` y sin `git status`.
- **Comprobaciones antes de cada commit:** `npm run check` y build; `npm run e2e` si toca interfaz o estilos
  (el CI lo repite en los tres navegadores). El hook de pre-commit genera antes los tipos de las rutas
  (`react-router typegen`): sin ellos, ESLint rechaza las rutas nuevas.
- **Zonas calientes:** por fase, en el tablero. F2: `src/styles/tokens.css`, `src/root.tsx`, `src/content/**`,
  `src/lib/i18n/**`, `src/lib/seo/**`, `src/routes.ts`, `src/routes/**`.
- **Ámbitos de auditoría** (un auditor por ámbito que toque el cambio): estilos e interfaz (fidelidad a
  `docs/03-diseno`, accesibilidad, tokens, navegadores) · lógica y contenido (`lib`, `content`, `stores`, capas de
  `arquitectura.md`) · escena 3D (desde F3: rendimiento, cero asignaciones por frame, determinismo) · tests (que
  prueben lo que dicen, casos límite, sin fragilidad) · documentación y ADR (coherencia entre docs y con el código).
- **No es hallazgo:** la deuda anotada en `STATE.md`, lo planificado para pasos o fases posteriores del roadmap y lo
  que las decisiones vivas citadas en el encargo dan por decidido.
- **Rama del cierre:** `docs/session-close-AAAA-MM-DD` (con sufijo `-2`, `-3`… si hay varias el mismo día).
