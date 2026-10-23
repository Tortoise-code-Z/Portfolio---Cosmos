// Fuente: docs/01-contenido/proyectos/astrohub.md.

import type { Project } from '../types';
import { DEMO_USER_LABEL, RESPONSIVE_DESIGN } from './labels';

export const astrohub: Project = {
  slug: 'astrohub',
  order: 2,
  featured: false,
  name: 'AstroHub',
  tagline: {
    en: 'A full web app about the universe, from database to interface.',
    es: 'Una aplicación web completa sobre el universo, de la base de datos a la interfaz.',
  },
  year: 2024,
  role: 'fullstack',
  context: 'course',
  summary: {
    en: 'My final project for the Full-Stack program: a space-themed web app with users, roles, news and astronomy appointments, built with HTML, CSS, JavaScript, PHP and MySQL.',
    es: 'Mi proyecto final del curso Fullstack: una web temática del espacio con usuarios, roles, noticias y citas astronómicas, hecha con HTML, CSS, JavaScript, PHP y MySQL.',
  },
  about: {
    en: [
      'AstroHub is a dynamic, complete web application built as the final project of the web development module of the MasterD Full-Stack program.',
      'Inspired by the universe and space exploration, it combines front end, back end and database.',
      'It supports user registration, profile management, news administration and astronomy appointments, all built with HTML, CSS, JavaScript, PHP and MySQL.',
      'It was tested and run locally with XAMPP, covering both the public site and the internal user and admin panels.',
    ],
    es: [
      'AstroHub es una aplicación web dinámica y completa, desarrollada como proyecto final del módulo de desarrollo web del curso Fullstack de MasterD.',
      'Inspirada en el universo y la exploración espacial, combina frontend, backend y base de datos.',
      'Permite registro de usuarios, gestión de perfiles, administración de noticias y control de citas astronómicas, todo con HTML, CSS, JavaScript, PHP y MySQL.',
      'Se probó y ejecutó en local con XAMPP, integrando la parte pública y los paneles internos de usuario y administrador.',
    ],
  },
  features: [
    {
      en: 'User registration and authentication',
      es: 'Registro y autenticación de usuarios',
    },
    { en: 'Astronomy news management', es: 'Gestión de noticias astronómicas' },
    { en: 'Full admin panel', es: 'Panel de administración completo' },
    { en: 'Interactive astronomy appointments', es: 'Citas astronómicas interactivas' },
    {
      en: 'Form validation and hashed passwords',
      es: 'Validación de formularios y contraseñas cifradas',
    },
    {
      en: 'Responsive design with HTML5 and CSS3',
      es: 'Diseño responsive con HTML5 y CSS3',
    },
  ],
  stack: {
    core: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
    libraries: [],
    design: ['Figma', RESPONSIVE_DESIGN],
    tooling: ['Apache', 'XAMPP', 'phpMyAdmin'],
  },
  process: {
    en: [
      'AstroHub covered the whole stack. The interface was built with HTML5, CSS3 and JavaScript, while server logic and data handling ran on PHP and MySQL.',
      'An authentication and role system (visitor, user and admin) controls access to each section, with separate panels to manage news, appointments and profiles.',
      'The database was created and imported with phpMyAdmin and run locally on XAMPP for a realistic test environment.',
    ],
    es: [
      'AstroHub abarcó todo el stack. La interfaz se hizo con HTML5, CSS3 y JavaScript, y la lógica de servidor y los datos, con PHP y MySQL.',
      'Un sistema de autenticación y roles (visitante, usuario y administrador) controla el acceso a cada sección, con paneles diferenciados para gestionar noticias, citas y perfiles.',
      'La base de datos se creó e importó con phpMyAdmin y se ejecutó en local con XAMPP, para un entorno de pruebas realista.',
    ],
  },
  highlights: [
    { en: 'Authentication and user roles', es: 'Autenticación y roles de usuario' },
    {
      en: 'Separate user and admin panels',
      es: 'Paneles separados para usuarios y administradores',
    },
    {
      en: 'Full MySQL database management',
      es: 'Gestión completa de base de datos con MySQL',
    },
    { en: 'Local integration with XAMPP', es: 'Integración local con XAMPP' },
  ],
  notes: [
    {
      kind: 'warning',
      text: {
        en: 'AstroHub runs locally only. It needs XAMPP (Apache + PHP + MySQL) and the bundled database.',
        es: 'AstroHub solo funciona en local. Necesita XAMPP (Apache + PHP + MySQL) y la base de datos incluida.',
      },
    },
    {
      kind: 'info',
      text: {
        en: 'Built for learning purposes as a course project.',
        es: 'Desarrollado con fines educativos como proyecto de curso.',
      },
    },
  ],
  tryIt: {
    intro: {
      en: 'Install XAMPP, import astrohub.sql and open http://localhost/astrohub/. Full steps in the README.',
      es: 'Instala XAMPP, importa astrohub.sql y abre http://localhost/astrohub/. Pasos completos en el README.',
    },
    steps: [
      {
        en: "Copy the project into XAMPP's htdocs folder.",
        es: 'Copia el proyecto en la carpeta htdocs de XAMPP.',
      },
      {
        en: 'Start Apache and MySQL, then import astrohub.sql in phpMyAdmin.',
        es: 'Arranca Apache y MySQL e importa astrohub.sql en phpMyAdmin.',
      },
      {
        en: 'Open http://localhost/astrohub/ and log in.',
        es: 'Abre http://localhost/astrohub/ e inicia sesión.',
      },
    ],
    // Cuentas de demo públicas de la base de datos de ejemplo (modelo-de-datos.md → «Credenciales de demo»).
    credentials: [
      { label: DEMO_USER_LABEL, user: 'lisa12', password: '123456' },
      { label: { en: 'Admin', es: 'Administrador' }, user: 'root', password: '1234567' },
    ],
  },
  cover: null,
  gallery: [],
  links: {
    code: 'https://github.com/Tortoise-code-Z/Astrohub',
    demo: null,
    readme: 'https://github.com/Tortoise-code-Z/Astrohub#readme',
  },
};
