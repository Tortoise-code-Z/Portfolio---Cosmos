# Textos del sitio (EN / ES)

> Claves agrupadas por zona. En el código, `src/content/texts/en.ts` y `es.ts`, con las mismas claves
> (planas, tal cual) y los mismos huecos. `{x}` = valor que inserta la interfaz.
> `about.body` no es una clave: solo indica que ese texto sale de `profile.bio`.

## SEO y metadatos

| Clave | EN | ES |
|---|---|---|
| `meta.title` | Víctor Pérez · Frontend Developer (React + TypeScript) | Víctor Pérez · Desarrollador Frontend (React + TypeScript) |
| `meta.description` | Portfolio of Víctor Pérez, frontend developer. A journey from the Big Bang to Earth through my projects, skills and experience. | Portfolio de Víctor Pérez, desarrollador frontend. Un viaje del Big Bang a la Tierra a través de mis proyectos, habilidades y experiencia. |
| `meta.project.title` | {project} · Víctor Pérez | {project} · Víctor Pérez |
| `meta.notFound.title` | Lost in space · Víctor Pérez | Perdido en el espacio · Víctor Pérez |

## Barra superior, idioma y accesos

| Clave | EN | ES |
|---|---|---|
| `nav.skip` | Skip to content | Saltar al contenido |
| `nav.projects` | Projects | Proyectos |
| `nav.contact` | Contact | Contacto |
| `nav.cv` | CV | CV |
| `nav.quick` | Quick mission | Modo misión rápida |
| `nav.language` | Language | Idioma |
| `nav.langEn` | English | English |
| `nav.langEs` | Español | Español |
| `nav.availability` | Open to work | Disponible |

## Raíl de capítulos

| Clave | EN (sección · escena) | ES (sección · escena) |
|---|---|---|
| `chapter.0` | Home · Singularity | Inicio · Singularidad |
| `chapter.1` | About · Nebula | Sobre mí · Nebulosa |
| `chapter.2` | Skills · Galaxy | Habilidades · Galaxia |
| `chapter.3` | Projects · Cosmic turtle | Proyectos · Tortuga cósmica |
| `chapter.4` | Contact · Earth | Contacto · Tierra |
| `rail.label` | Chapters | Capítulos |

## HUD (reloj cósmico y escala)

Los números los formatea `Intl` según el idioma. En `hud.billionYears`, `{n}` va en miles de millones en EN
(`13.8`) y en millones en ES (`13.800`), según la regla 5 de `README.md`.

| Clave | EN | ES |
|---|---|---|
| `hud.zero` | t = 0 s · singularity | t = 0 s · singularidad |
| `hud.seconds` | t = 10^{exp} s | t = 10^{exp} s |
| `hud.years` | t ≈ {n} years | t ≈ {n} años |
| `hud.millionYears` | t ≈ {n} million years | t ≈ {n} millones de años |
| `hud.billionYears` | t ≈ {n} billion years | t ≈ {n} millones de años |
| `hud.mythic` | t = ∞ · mythic time | t = ∞ · tiempo mítico |
| `hud.scale.0` | scale ≈ 10⁻³⁵ m | escala ≈ 10⁻³⁵ m |
| `hud.scale.1` | scale ≈ 20 light-years | escala ≈ 20 años luz |
| `hud.scale.2` | scale ≈ 100,000 light-years | escala ≈ 100.000 años luz |
| `hud.scale.3` | scale · 1 turtle, mythic size | escala · 1 tortuga, tamaño mítico |
| `hud.scale.4` | scale · 12,742 km across | escala · 12.742 km de diámetro |

## Capítulo 0 · Inicio (Singularidad)

| Clave | EN | ES |
|---|---|---|
| `hero.kicker` | Tortoise_code · Frontend developer · React + TypeScript | Tortoise_code · Desarrollador frontend · React + TypeScript |
| `hero.lead` | Everything that exists started as a single point. So did my code. | Todo lo que existe empezó siendo un punto. Mi código también. |
| `hero.detonate` | Hold to detonate | Mantén pulsado para detonar |
| `hero.detonate.aria` | Hold to trigger the Big Bang and start the journey | Mantén pulsado para provocar el Big Bang y empezar el viaje |
| `hero.scroll` | or scroll ↓ | o haz scroll ↓ |

## Capítulo 1 · Sobre mí (Nebulosa)

| Clave | EN | ES |
|---|---|---|
| `about.eyebrow` | About · nebula · t ≈ 200 million years | Sobre mí · nebulosa · t ≈ 200 millones de años |
| `about.title` | A star born from curiosity | Una estrella que nace de la curiosidad |
| `about.body` | → `profile.bio` | → `profile.bio` |
| `about.strengths` | Strengths | Fortalezas |

## Capítulo 2 · Habilidades (Galaxia)

| Clave | EN | ES |
|---|---|---|
| `skills.eyebrow` | Skills · galaxy · t ≈ 1 billion years | Habilidades · galaxia · t ≈ 1.000 millones de años |
| `skills.title` | My galaxy of tools | Mi galaxia de herramientas |
| `skills.lead.pointer` | Each star is a technology I use. Hover a group to light up its constellation. | Cada estrella es una tecnología que uso. Pasa el cursor por un grupo para encender su constelación. |
| `skills.lead.touch` | Each star is a technology I use. Tap a group to light up its constellation. | Cada estrella es una tecnología que uso. Toca un grupo para encender su constelación. |

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

## Capítulo 4 · Contacto (Tierra)

| Clave | EN | ES |
|---|---|---|
| `contact.eyebrow` | Contact · Earth · t = 13.8 billion years | Contacto · Tierra · t = 13.800 millones de años |
| `contact.title` | Touchdown | Aterrizaje |
| `contact.lead` | 13.8 billion years later, here we are. If you have a project or a team where I'd fit, let's talk. | Después de 13.800 millones de años, aquí estamos. Si tienes un proyecto o un equipo donde encaje, hablemos. |
| `contact.copy` | Copy | Copiar |
| `contact.copied` | Copied | Copiado |
| `contact.copyFailed` | Select and copy it | Selecciónalo y cópialo |
| `contact.availability.modes` | Remote, hybrid or on-site | Remoto, híbrido o presencial |
| `contact.availability.relocation` | Open to relocation | Abierto a reubicarme |
| `contact.cv` | Download CV (PDF) | Descargar CV (PDF) |
| `education.title` | Completed orbits · education | Órbitas completadas · formación |
| `education.hours` | {n} h | {n} h |
| `footer.line` | Víctor Pérez · Frontend Developer · {year} | Víctor Pérez · Desarrollador Frontend · {year} |
| `footer.source` | This site is open source | Esta web es de código abierto |

## Modo misión rápida

| Clave | EN | ES |
|---|---|---|
| `quick.title` | Quick mission · everything on one page | Modo misión rápida · todo en una página |
| `quick.back` | Back to the journey | Volver al viaje |
| `quick.about` | About | Sobre mí |
| `quick.projects` | Projects | Proyectos |
| `quick.skills` | Skills | Habilidades |
| `quick.education` | Education | Formación |
| `quick.contact` | Contact | Contacto |

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
| `project.next` | Next project | Siguiente proyecto |
| `project.prev` | Previous project | Proyecto anterior |
| `project.gallery.open` | Open image {n} of {total} | Abrir imagen {n} de {total} |
| `project.gallery.close` | Close | Cerrar |

## Estados especiales

| Clave | EN | ES |
|---|---|---|
| `noGl.notice` | Your browser can't show the 3D universe, but everything else is here. | Tu navegador no puede mostrar el universo 3D, pero todo lo demás está aquí. |
| `notFound.title` | Lost in space | Perdido en el espacio |
| `notFound.body` | This page drifted out of orbit. | Esta página se salió de su órbita. |
| `notFound.cta` | Back to the start | Volver al inicio |
