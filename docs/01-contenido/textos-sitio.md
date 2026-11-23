# Textos del sitio (EN / ES)

> Claves agrupadas por zona. En el código, `src/content/texts/en.ts` y `es.ts`, con las mismas claves
> (planas, tal cual) y los mismos huecos. `{x}` = valor que inserta la interfaz.
> `about.body` no es una clave: solo indica que ese texto sale de `profile.bio`.
> Los modos de trabajo (`availability.mode.*`, en minúscula) no forman una frase fija: la arma
> `workModesText` (`src/lib/i18n/availability/availability.ts`) desde `profile.availability.modes` con `Intl.ListFormat`
> (disyunción) y mayúscula inicial: EN «Remote, hybrid, or on-site» · ES «Remoto, híbrido o presencial».
> `nav.quickShort` es la forma corta de `nav.quick` que se ve por debajo de 520 px: va contenida en ella (el nombre
> accesible del botón es `nav.quick`). `contact.copy.subject` solo lo oye el lector («Copy email»).
> La sugerencia de idioma (`langNotice.*`) habla en el idioma que **ofrece**: hoy solo sale en las páginas en
> inglés y se lee de `es.ts`; la columna EN existe para que los dos diccionarios tengan las mismas claves.
> Las cifras de 4 dígitos en ES van sin punto (norma RAE, como `Intl`): «1000 millones»; desde 5, con punto.

## SEO y metadatos

| Clave | EN | ES |
|---|---|---|
| `meta.title` | Víctor Pérez · Frontend Developer (React + TypeScript) | Víctor Pérez · Desarrollador Frontend (React + TypeScript) |
| `meta.description` | Portfolio of Víctor Pérez, frontend developer. A journey from the Big Bang to Earth through my projects, skills and experience. | Portfolio de Víctor Pérez, desarrollador frontend. Un viaje del Big Bang a la Tierra a través de mis proyectos, habilidades y experiencia. |
| `meta.project.title` | {project} · Víctor Pérez | {project} · Víctor Pérez |
| `meta.notFound.title` | Lost in space · Víctor Pérez | Perdido en el espacio · Víctor Pérez |
| `meta.error.title` | Something went wrong · Víctor Pérez | Algo ha fallado · Víctor Pérez |

## Barra superior, idioma y accesos

| Clave | EN | ES |
|---|---|---|
| `nav.skip` | Skip to content | Saltar al contenido |
| `nav.projects` | Projects | Proyectos |
| `nav.contact` | Contact | Contacto |
| `nav.cv` | CV | CV |
| `nav.cvInEnglish` | CV (PDF, in English) | CV (PDF, en inglés) |
| `nav.quick` | Quick mission | Modo misión rápida |
| `nav.quickShort` | Quick | Rápida |
| `nav.language` | Language | Idioma |
| `nav.langEn` | English | English |
| `nav.langEs` | Español | Español |
| `nav.availability` | Open to work | Disponible |
| `link.newTab` | (opens in a new tab) | (se abre en una pestaña nueva) |

## Raíl de capítulos

| Clave | EN (sección · escena) | ES (sección · escena) |
|---|---|---|
| `chapter.0` | Home · Singularity | Inicio · Singularidad |
| `chapter.1` | About · Nebula | Sobre mí · Nebulosa |
| `chapter.2` | Skills · Galaxy | Habilidades · Galaxia |
| `chapter.3` | Projects · Cosmic turtle | Proyectos · Tortuga cósmica |
| `chapter.4` | Contact · Earth | Contacto · Tierra |
| `chapter.5` | Crew file · Epilogue | Tripulación · Epílogo |
| `interlude.1` | Mission log · transmission | Bitácora · transmisión |
| `interlude.2` | Mission control · transmission | Control de misión · transmisión |
| `rail.label` | Chapters | Capítulos |

Cada `chapter.N` es el nombre accesible del botón del raíl. Su texto visible se parte por « · »: la sección encima
y la escena debajo (lo comprueba un test: exactamente una sección y una escena por clave).

## HUD (reloj cósmico y escala)

Los números los formatea `Intl` según el idioma. En `hud.billionYears`, `{n}` va en miles de millones en EN
(`13.8`) y en millones en ES (`13.800`), según la regla 5 de `README.md`. En `hud.seconds`, `{exp}` es el
exponente ya escrito en superíndice (`t = 10⁻⁴³ s`). El HUD pinta en ámbar el valor que inserta (`{n}` o
`{exp}`); `hud.zero` y `hud.mythic` no llevan valor.

| Clave | EN | ES |
|---|---|---|
| `hud.zero` | t = 0 s · singularity | t = 0 s · singularidad |
| `hud.seconds` | t = 10{exp} s | t = 10{exp} s |
| `hud.years` | t ≈ {n} years | t ≈ {n} años |
| `hud.millionYears` | t ≈ {n} million years | t ≈ {n} millones de años |
| `hud.billionYears` | t ≈ {n} billion years | t ≈ {n} millones de años |
| `hud.mythic` | t = ∞ · mythic time | t = ∞ · tiempo mítico |
| `hud.scale.0` | scale ≈ 10⁻³⁵ m | escala ≈ 10⁻³⁵ m |
| `hud.scale.1` | scale ≈ 20 light-years | escala ≈ 20 años luz |
| `hud.scale.2` | scale ≈ 100,000 light-years | escala ≈ 100.000 años luz |
| `hud.scale.3` | scale · 1 turtle, mythic size | escala · 1 tortuga, tamaño mítico |
| `hud.scale.4` | scale · 12,742 km across | escala · 12.742 km de diámetro |
| `hud.scale.5` | scale · 1 crew member | escala · 1 tripulante |

`hud.scale.5` no se ve: el HUD se esconde en el epílogo (lo lee como transmisión). Existe porque cada capítulo tiene
su escala (`SCALE_KEYS` es un registro de todos).

## Capítulo 0 · Inicio (Singularidad)

| Clave | EN | ES |
|---|---|---|
| `hero.kicker` | Tortoise_code · Frontend developer · React + TypeScript | Tortoise_code · Desarrollador frontend · React + TypeScript |
| `hero.lead` | Everything that exists started as a single point. So did my code. | Todo lo que existe empezó siendo un punto. Mi código también. |
| `hero.detonate` | Hold to detonate | Mantén pulsado para detonar |
| `hero.detonate.aria` | Hold to trigger the Big Bang and start the journey | Mantén pulsado para provocar el Big Bang y empezar el viaje |
| `hero.scroll` | or scroll | o haz scroll |

La pista `hero.scroll` va seguida del icono de flecha abajo (SVG, `design-system.md` → «Iconos»), que no forma parte
del texto.

## Capítulo 1 · Sobre mí (Nebulosa)

| Clave | EN | ES |
|---|---|---|
| `about.eyebrow` | About · nebula · t ≈ 200 million years | Sobre mí · nebulosa · t ≈ 200 millones de años |
| `about.title` | A star born from curiosity | Una estrella que nace de la curiosidad |
| `about.body` | → `profile.bio` | → `profile.bio` |

## Interludio 1 · Mission log (transmisión, canal ámbar)

Los datos de la misión están en `experiencia.md`; aquí, los rótulos.

| Clave | EN | ES |
|---|---|---|
| `missionLog.channel` | Channel 01 · amber | Canal 01 · ámbar |
| `missionLog.incoming` | Incoming transmission · source located | Transmisión entrante · origen localizado |
| `missionLog.title` | Mission 01 | Misión 01 |
| `missionLog.source` / `.role` / `.position` / `.window` / `.status` | Source / Role / Position / Window / Status | Origen / Puesto / Posición / Ventana / Estado |
| `missionLog.manifest` | Payload manifest | Manifiesto de carga |
| `missionLog.entries` | Log entries {list} | Entradas del diario {list} |
| `missionLog.log` | Flight log | Diario de vuelo |
| `missionLog.reference` | Reference | Referencia |
| `missionLog.quote` | “{quote}” | «{quote}» |
| `missionLog.by` | {author}, {title} | {author}, {title} |
| `missionLog.clock` | t ≈ 200 million years | t ≈ 200 millones de años |
| `interlude.skip` | Skip transmission | Saltar transmisión |
| `interlude.clock` | {clock} · cosmic clock paused | {clock} · reloj cósmico en pausa |
| `interlude.end` | End of transmission | Fin de la transmisión |

## Capítulo 2 · Habilidades (Galaxia)

| Clave | EN | ES |
|---|---|---|
| `skills.eyebrow` | Skills · galaxy · t ≈ 1 billion years | Habilidades · galaxia · t ≈ 1000 millones de años |
| `skills.title` | My galaxy of tools | Mi galaxia de herramientas |
| `skills.lead` | Each star is a technology I use. | Cada estrella es una tecnología que uso. |
| `skills.lead.pointer` | Hover a group to light up its constellation. | Pasa el cursor por un grupo para encender su constelación. |
| `skills.lead.touch` | Tap a group to light up its constellation. | Toca un grupo para encender su constelación. |

La instrucción va detrás de `skills.lead`, en la misma frase guía: la de ratón con puntero fino, la táctil en lo
demás, y ninguna sin escena (`no-gl`): sin constelaciones no hay nada que encender.

## Capítulo 3 · Proyectos (Tortuga cósmica)

| Clave | EN | ES |
|---|---|---|
| `projects.eyebrow` | Projects · cosmic turtle · t = mythic time | Proyectos · tortuga cósmica · t = tiempo mítico |
| `projects.title` | What I carry on my shell | Lo que llevo a cuestas |
| `projects.lead` | Legend says a turtle carries the world. Mine carries my projects: every glowing plate on its shell is one of them. | Según el mito, una tortuga carga con el mundo. La mía carga con mis proyectos: cada placa iluminada del caparazón es uno. |
| `projects.featured` | Featured | Destacado |
| `projects.role.frontend` | Front end | Frontend |
| `projects.role.fullstack` | Full stack | Fullstack |
| `projects.context.personal` | Personal project | Proyecto personal |
| `projects.context.course` | Course project | Proyecto de curso |
| `projects.open` | View project | Ver proyecto |
| `projects.demo` | Live demo | Demo |
| `projects.code` | Code | Código |

## Interludio 2 · Mission control (transmisión, canal azul)

La secuencia (orden, `T-n`, qué va antes del código y el bucle) está en `src/content/workflow.ts`; las cifras, en la
telemetría contada al construir (ADR-035). `{n}` es la cuenta atrás; `{browsers}`, los navegadores del CI con la
conjunción del idioma. Tras `missionControl.telemetry` va « · » y el mes del build con `Intl` (`Nov 2026` /
`nov 2026`), aparte: es lo único que la captura tapa del rótulo.

| Clave | EN | ES |
|---|---|---|
| `missionControl.channel` | Channel 02 · blue | Canal 02 · azul |
| `missionControl.incoming` | Mission control · how I work | Control de misión · cómo trabajo |
| `missionControl.title` | How I work | Cómo trabajo |
| `missionControl.countdown` | T-{n} | T-{n} |
| `missionControl.lead` | Every change on this site went through the same countdown. AI speeds it up; I read and understand every change before it goes in. | Cada cambio de este sitio pasó por la misma cuenta atrás. La IA la acelera; yo leo y entiendo cada cambio antes de que entre. |
| `missionControl.sequence` | Schematic · launch sequence | Esquema · secuencia de lanzamiento |
| `missionControl.noCode` | No code yet | Aún sin código |
| `missionControl.loop` | Fixes from the audit go back to build | Lo que corrige la auditoría vuelve a construcción |
| `missionControl.plan` / `.detail` | Plan / Steps, files and risks. No code yet. | Plan / Pasos, archivos y riesgos. Aún sin código. |
| `missionControl.greenLight` / `.detail` | Green light / The plan is approved before anything is built. | Luz verde / El plan se aprueba antes de construir nada. |
| `missionControl.build` / `.detail` | Build / One branch and one PR per task, strict TypeScript. | Construcción / Una rama y un PR por tarea, TypeScript estricto. |
| `missionControl.audit` / `.detail` | Audit / A fresh-eyes review in a separate session; its fixes ship before the next task. | Auditoría / Una revisión con mirada fresca en otra sesión; lo que corrige sale antes de la siguiente tarea. |
| `missionControl.launch` / `.detail` | Launch / Checks green in {browsers}. | Lanzamiento / Checks en verde en {browsers}. |
| `missionControl.telemetry` | Telemetry · this site | Telemetría · este sitio |
| `missionControl.unitTests` | Unit tests · Vitest | Tests unitarios · Vitest |
| `missionControl.e2eTests` | E2E tests · Playwright | Tests e2e · Playwright |
| `missionControl.browsers` | Browsers in CI | Navegadores en el CI |
| `missionControl.decisions` | Decisions logged | Decisiones registradas |
| `missionControl.copilot` | Co-pilot: Claude Code with skills I wrote | Copiloto: Claude Code con skills que escribí yo |
| `missionControl.touchdown` | Touchdown · Contact | Aterrizaje · Contacto |
| `missionControl.clock` | t = mythic time | t = tiempo mítico |

El enlace a Contacto se ve «T-0 → Touchdown · Contact ↓»: «T-0», la flecha (el icono) y «↓» son dibujo.

## Capítulo 4 · Contacto (Tierra)

| Clave | EN | ES |
|---|---|---|
| `contact.eyebrow` | Contact · Earth · t = 13.8 billion years | Contacto · Tierra · t = 13.800 millones de años |
| `contact.title` | Touchdown | Aterrizaje |
| `contact.lead` | 13.8 billion years later, here we are. If you have a project or a team where I'd fit, let's talk. | Después de 13.800 millones de años, aquí estamos. Si tienes un proyecto o un equipo donde encaje, hablemos. |
| `contact.copy.subject` | email | el email |
| `availability.mode.remote` | remote | remoto |
| `availability.mode.hybrid` | hybrid | híbrido |
| `availability.mode.onsite` | on-site | presencial |
| `contact.availability.relocation` | Open to relocation | Abierto a reubicarme |
| `contact.availability.now` | Available immediately | Incorporación inmediata |
| `contact.cv` | Download CV (PDF) | Descargar CV (PDF, en inglés) |
| `education.hours` | {n} h | {n} h |
| `footer.line` | Víctor Pérez · Frontend Developer · {year} | Víctor Pérez · Desarrollador Frontend · {year} |
| `footer.source` | This site is open source | Esta web es de código abierto |

La formación y el pie (`footer.*`) se mudaron al epílogo en C.6; `education.hours` lo usa su ficha.

## Epílogo · Crew file (transmisión, canal verde)

Textos de C.6a (los escribió Claude; Víctor los revisa cuando quiera). La ficha usa además `contact.availability.*`,
`availability.mode.*`, `contact.cv`, `contact.copy.subject`, `education.hours` y `footer.*`.

| Clave | EN | ES |
|---|---|---|
| `crewFile.channel` | Channel 03 · green | Canal 03 · verde |
| `crewFile.closed` | All channels closed | Todos los canales cerrados |
| `crewFile.incoming` | Crew file · identity verified | Ficha de tripulación · identidad verificada |
| `crewFile.verified` | Identity verified | Identidad verificada |
| `crewFile.title` | Crew file | Ficha de tripulación |
| `crewFile.lead` | The one who built this journey. Everything you need to bring me on board. | Quien ha construido este viaje. Todo lo que necesitas para sumarme a la tripulación. |
| `crewFile.role` | Role | Puesto |
| `crewFile.stack` | React + TypeScript | React + TypeScript |
| `crewFile.base` | Base | Base |
| `crewFile.rightToWork` | Right to work | Permiso de trabajo |
| `crewFile.availability` | Availability | Disponibilidad |
| `crewFile.languages` | Languages | Idiomas |
| `crewFile.training` | Training | Formación |
| `crewFile.footer` | End of journey · 13.8 billion years + now | Fin del viaje · 13.800 millones de años + ahora |

## Modo misión rápida

| Clave | EN | ES |
|---|---|---|
| `quick.title` | Quick mission · everything on one page | Modo misión rápida · todo en una página |
| `quick.back` | Close quick mission | Cerrar la misión rápida |
| `quick.about` | About | Sobre mí |
| `quick.projects` | Projects | Proyectos |
| `quick.skills` | Skills | Habilidades |
| `quick.education` | Education | Formación |
| `quick.contact` | Contact | Contacto |
| `quick.availability` | Availability | Disponibilidad |
| `quick.experience` | Experience | Experiencia |
| `quick.workflow` | How I work | Cómo trabajo |

## Página de proyecto

| Clave | EN | ES |
|---|---|---|
| `project.back` | Back to the shell | Volver al caparazón |
| `project.about` | About the project | Sobre el proyecto |
| `project.features` | Key features | Funcionalidades |
| `project.stack` | Tech stack | Stack tecnológico |
| `project.stack.core` | Languages & frameworks | Lenguajes y frameworks |
| `project.stack.libraries` | Libraries & utilities | Librerías y utilidades |
| `project.stack.design` | Design & styling | Diseño y estilos |
| `project.stack.tooling` | Tooling | Herramientas |
| `project.process` | Development process | Proceso de desarrollo |
| `project.highlights` | Technical highlights | Retos técnicos |
| `project.gallery` | Gallery | Galería |
| `project.tryIt` | Try it | Pruébalo |
| `project.readme` | Read the full guide in the README | Lee la guía completa en el README |
| `project.credentials` | Demo account | Cuenta de demostración |
| `project.credentials.many` | Demo accounts | Cuentas de demostración |
| `project.next` | Next project | Siguiente proyecto |
| `project.prev` | Previous project | Proyecto anterior |
| `project.gallery.open` | Open image {n} of {total} | Abrir imagen {n} de {total} |
| `project.notes` | Notes | Notas |
| `project.note.info` | Note: | Nota: |
| `project.note.warning` | Warning: | Atención: |
| `project.credentials.user` | Username | Nombre de usuario |
| `project.credentials.password` | Password | Contraseña |
| `project.copy.user` | username ({account}) | nombre de usuario ({account}) |
| `project.copy.password` | password ({account}) | contraseña ({account}) |
| `project.pager` | More projects | Más proyectos |
| `project.contact` | Contact | Contacto |

- `project.note.*` va oculto a la vista delante de cada nota: el tipo no se dice solo con color ni con el icono.
- `project.copy.*` completa el nombre accesible del botón copiar («Copy password (Admin)»); `{account}` es el
  nombre de la cuenta de demo (`TryIt.credentials[].label`).
- `project.credentials` titula las cuentas de demo cuando hay una y `project.credentials.many` cuando hay varias.

## Botón copiar (común)

Las etiquetas de `CopyButton`, iguales en Contacto, el modo misión rápida y el «Try it» de la ficha. Lo que se
copia lo dice cada uso (`contact.copy.subject`, `project.copy.*`).

| Clave | EN | ES |
|---|---|---|
| `copy.idle` | Copy | Copiar |
| `copy.copied` | Copied | Copiado |
| `copy.failed` | Select and copy it | Selecciónalo y cópialo |

## Visor de galería (común)

Las etiquetas de `ui/Lightbox`, que no sabe de qué página es (abrir cada imagen es de la galería:
`project.gallery.open`).

| Clave | EN | ES |
|---|---|---|
| `lightbox.close` | Close | Cerrar |
| `lightbox.prev` | Previous image | Imagen anterior |
| `lightbox.next` | Next image | Imagen siguiente |
| `lightbox.counter` | {n} of {total} | {n} de {total} |

- El contador visible del visor es «3 / 9»; `lightbox.counter` es lo que se anuncia («3 of 9: …») y la
  descripción del diálogo.

## Estados especiales

| Clave | EN | ES |
|---|---|---|
| `langNotice.text` | This page is also available in English. | Esta página también está en español. |
| `langNotice.accept` | View in English | Ver en español |
| `langNotice.dismiss` | No, thanks | No, gracias |
| `noGl.notice` | Your browser can't show the 3D universe, but everything else is here. | Tu navegador no puede mostrar el universo 3D, pero todo lo demás está aquí. |
| `noGl.dismiss` | Got it | Entendido |
| `notFound.title` | Lost in space | Perdido en el espacio |
| `notFound.body` | This page drifted out of orbit. | Esta página se salió de su órbita. |
| `notFound.cta` | Back to the start | Volver al inicio |
| `error.title` | Something went wrong | Algo ha fallado |
| `error.body` | A system failed mid-flight. Reload the page or go back to the start. | Un sistema ha fallado en pleno vuelo. Recarga la página o vuelve al inicio. |

El enlace de la página de error reutiliza `notFound.cta` (no hay `error.cta`).
