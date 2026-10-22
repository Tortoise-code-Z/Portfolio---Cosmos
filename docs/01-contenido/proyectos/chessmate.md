# Proyecto · Chessmate

> Fuente: ficha de detalle del portfolio actual (texto ES original), traducida y ordenada al nuevo modelo.

## Ficha

| Campo | Valor |
|---|---|
| slug | `chessmate` |
| order | 1 |
| featured | `true` (placa central) |
| name | Chessmate |
| year | 2025 |
| role | `frontend` |
| context | `personal` |
| links.code | https://github.com/Tortoise-code-Z/Chessmate-react |
| links.demo | https://tortoise-code-z.github.io/Chessmate-react/ |
| links.readme | https://github.com/Tortoise-code-Z/Chessmate-react#readme |

## Tagline

- EN: An online chess academy with interactive courses.
- ES: Una academia de ajedrez online con cursos interactivos.

## Summary (fila del capítulo y modo misión rápida)

- EN: A chess-learning platform designed in Figma and built with React and TypeScript. It simulates a full
  backend in the browser: sign-up, course purchases, a personal dashboard and progress tracking.
- ES: Una plataforma para aprender ajedrez diseñada en Figma y construida con React y TypeScript. Simula un
  backend completo en el navegador: registro, compra de cursos, panel personal y seguimiento del progreso.

## About

**EN**
1. Chessmate is a modern web platform for learning chess online through interactive courses.
2. I designed it from scratch in Figma and built it with React and TypeScript, simulating a complete backend
   on the client.

**ES**
1. Chessmate es una plataforma web moderna para aprender ajedrez online mediante cursos interactivos.
2. La diseñé desde cero en Figma y la desarrollé con React y TypeScript, simulando un backend completo desde
   el cliente.

## Features

| EN | ES |
|---|---|
| Sign-up and login | Registro y login |
| Course search and filters | Filtro y búsqueda de cursos |
| Course purchases | Compra de cursos |
| Personal dashboard | Dashboard personalizado |
| Virtual classrooms | Classrooms virtuales |
| Progress tracking | Seguimiento de progreso |

## Stack

- core: React, TypeScript
- libraries: React Query, Zustand, React Router, React Hook Form, Zod (+ resolvers), Embla Carousel, React Player
- design: CSS Modules, Figma, responsive design
- tooling: Vite, Git, npm

## Process

**EN**
1. Chessmate was designed and built from scratch to simulate a real online learning platform, entirely on the
   client side with no backend. The goal was to rebuild an earlier version of the project with everything I had
   learned about design and code since.
2. I planned the architecture in Figma, defining reusable components for each section (Home, Courses,
   Dashboard, Classroom…). In code, I used Zustand for global state and React Query to handle data simulated
   in localStorage, mimicking calls to a real API. That made purchases, progress and authentication work without
   a server, with dynamic feedback for errors and invalid routes.
3. Private routes use React Router, and forms are validated with React Hook Form and Zod. On the visual side,
   CSS Modules, Embla Carousel and React Player kept the design smooth and performant, with Vite handling the
   build.

**ES**
1. Chessmate se diseñó y desarrolló desde cero para simular una plataforma real de aprendizaje online,
   completamente del lado del cliente y sin backend. El objetivo era rehacer una versión anterior del proyecto con
   todo lo que había aprendido desde entonces de diseño y código.
2. Planifiqué la arquitectura en Figma, con componentes reutilizables para cada sección (Home, Courses,
   Dashboard, Classroom…). En el código usé Zustand para el estado global y React Query para manejar los datos
   simulados en localStorage, imitando llamadas a una API real. Así funcionan compras, progreso y autenticación
   sin servidor, con feedback dinámico ante errores y rutas inválidas.
3. Las rutas privadas usan React Router y los formularios se validan con React Hook Form y Zod. En lo visual,
   CSS Modules, Embla Carousel y React Player mantuvieron un diseño fluido y con buen rendimiento, con Vite para
   el build.

## Highlights

| EN | ES |
|---|---|
| Validation and visual feedback for error cases | Validación y feedback visual ante posibles errores |
| Protected routes | Protección de rutas |
| Real-time sync between components | Sincronización en tiempo real entre componentes |
| Performance tuned with React Query caching | Optimización de rendimiento con React Query |

## Notes

- `info` · EN: The GitHub Pages demo uses a hash router because GitHub Pages only serves static files. Locally,
  the browser router gives clean URLs and real deep links (`/dashboard`, `/course/:id`, `/classroom`).
- `info` · ES: La demo de GitHub Pages usa un router con hash porque GitHub Pages solo sirve archivos estáticos. En
  local, el router del navegador da URLs limpias y enlaces directos reales (`/dashboard`, `/course/:id`,
  `/classroom`).

## Try it (resumido)

- intro · EN: Log in, buy a couple of courses and explore the dashboard. The README explains how to force error
  states from the browser console to see the feedback system in action.
- intro · ES: Inicia sesión, compra un par de cursos y explora el panel. El README explica cómo forzar errores desde
  la consola del navegador para ver el sistema de feedback en acción.
- steps:
  1. EN: Log in with the demo account (or sign up). · ES: Inicia sesión con la cuenta de demostración (o regístrate).
  2. EN: Go to Courses → All courses and buy the first two. · ES: Ve a Cursos → Todos los cursos y compra los dos primeros.
  3. EN: Open the dashboard and a classroom to see your progress. · ES: Abre el panel y un classroom para ver tu progreso.
- credentials: EN: User / ES: Usuario · `admin` · `1234` (cuenta de demo pública).

> El script de consola completo de la ficha actual **pasa al README del repo de Chessmate** (si no está ya).
> ⚠ Comprobar que el README lo incluye antes de enlazarlo.

## Imágenes

Origen: repo del portfolio actual, `src/assets/images/`. Destino: `src/assets/projects/chessmate/`.

| Archivo | Alt EN | Alt ES |
|---|---|---|
| cover · `Chessmate.webp` (1920×922) | Chessmate home page | Página de inicio de Chessmate |
| `screenshot-index.png` (1920×922) | Home | Inicio |
| `screenshot-courses.png` (1920×916) | Courses | Cursos |
| `screenshot-course-detail.png` (1920×914) | Course detail | Detalle del curso |
| `screenshot-dashboard.png` (1920×906) | Dashboard | Dashboard |
| `screenshot-classroom.png` (1920×911) | Classroom | Classroom |
| `screenshot-course-obtained-classroom.png` (1920×909) | Classroom for a purchased course | Classroom de un curso comprado |
| `screenshot-login.png` (1920×911) | Login | Inicio de sesión |
| `screenshot-register.png` (1920×909) | Sign-up | Registro |
| `screenshot-contact.png` (1920×911) | Contact | Contacto |
