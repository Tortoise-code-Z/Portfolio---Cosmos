// Portadas y galerías de los proyectos (docs/01-contenido/assets.md → «Capturas de proyectos»), aparte de
// sus textos: los imports de imagen (`?project`, `?share`) solo los entiende Vite con `vite-imagetools`
// (y Vitest, con su sustituto). Lo que carga los textos sin Vite —la config de React Router y los e2e—
// importa `projectEntries` (entries.ts), que no pasa por aquí. Imports relativos, como el resto del
// contenido. Cada portada es la captura de Inicio del proyecto, la misma que abre su galería.

import chessmateHome from '../../assets/projects/chessmate/01-home.png?project';
import chessmateHomeShare from '../../assets/projects/chessmate/01-home.png?share';
import chessmateCourses from '../../assets/projects/chessmate/02-courses.png?project';
import chessmateCourseDetail from '../../assets/projects/chessmate/03-course-detail.png?project';
import chessmateDashboard from '../../assets/projects/chessmate/04-dashboard.png?project';
import chessmateClassroom from '../../assets/projects/chessmate/05-classroom.png?project';
import chessmatePurchasedClassroom from '../../assets/projects/chessmate/06-purchased-course-classroom.png?project';
import chessmateLogin from '../../assets/projects/chessmate/07-login.png?project';
import chessmateSignUp from '../../assets/projects/chessmate/08-sign-up.png?project';
import chessmateContact from '../../assets/projects/chessmate/09-contact.png?project';
import astrohubHome from '../../assets/projects/astrohub/01-home.png?project';
import astrohubHomeShare from '../../assets/projects/astrohub/01-home.png?share';
import astrohubNews from '../../assets/projects/astrohub/02-news.png?project';
import astrohubAppointments from '../../assets/projects/astrohub/03-appointments.png?project';
import astrohubLogin from '../../assets/projects/astrohub/04-login.png?project';
import astrohubSignUp from '../../assets/projects/astrohub/05-sign-up.png?project';
import astrohubProfile from '../../assets/projects/astrohub/06-profile.png?project';
import astrohubAdminUsers from '../../assets/projects/astrohub/07-admin-users.png?project';
import astrohubAdminNews from '../../assets/projects/astrohub/08-admin-news.png?project';
import astrohubAdminAppointments from '../../assets/projects/astrohub/09-admin-appointments.png?project';
import astrohubAdminEditUser from '../../assets/projects/astrohub/10-admin-edit-user.png?project';
import astrohubAdminEditNews from '../../assets/projects/astrohub/11-admin-edit-news.png?project';
import astrohubAdminEditAppointment from '../../assets/projects/astrohub/12-admin-edit-appointment.png?project';
import type { ProjectMedia } from '../types';

/** Imágenes de cada proyecto, por `slug`. Sin entrada (Cosmos, hasta F6): sin portada ni galería. */
export const projectMedia: Readonly<Partial<Record<string, ProjectMedia>>> = {
  chessmate: {
    cover: {
      ...chessmateHome,
      alt: { en: 'Chessmate home page', es: 'Página de inicio de Chessmate' },
      share: chessmateHomeShare,
    },
    // En el orden de la ficha (docs/01-contenido/proyectos/chessmate.md → «Imágenes»).
    gallery: [
      { ...chessmateHome, alt: { en: 'Home', es: 'Inicio' } },
      { ...chessmateCourses, alt: { en: 'Courses', es: 'Cursos' } },
      { ...chessmateCourseDetail, alt: { en: 'Course detail', es: 'Detalle del curso' } },
      { ...chessmateDashboard, alt: { en: 'Dashboard', es: 'Dashboard' } },
      { ...chessmateClassroom, alt: { en: 'Classroom', es: 'Classroom' } },
      {
        ...chessmatePurchasedClassroom,
        alt: { en: 'Classroom for a purchased course', es: 'Classroom de un curso comprado' },
      },
      { ...chessmateLogin, alt: { en: 'Login', es: 'Inicio de sesión' } },
      { ...chessmateSignUp, alt: { en: 'Sign-up', es: 'Registro' } },
      { ...chessmateContact, alt: { en: 'Contact', es: 'Contacto' } },
    ],
  },
  astrohub: {
    cover: {
      ...astrohubHome,
      alt: { en: 'AstroHub home page', es: 'Página de inicio de AstroHub' },
      share: astrohubHomeShare,
    },
    // En el orden de la ficha (docs/01-contenido/proyectos/astrohub.md → «Imágenes»).
    gallery: [
      { ...astrohubHome, alt: { en: 'Home', es: 'Inicio' } },
      { ...astrohubNews, alt: { en: 'News', es: 'Noticias' } },
      { ...astrohubAppointments, alt: { en: 'Appointments', es: 'Citas' } },
      { ...astrohubLogin, alt: { en: 'Login', es: 'Inicio de sesión' } },
      { ...astrohubSignUp, alt: { en: 'Sign-up', es: 'Registro' } },
      { ...astrohubProfile, alt: { en: 'Profile', es: 'Perfil' } },
      { ...astrohubAdminUsers, alt: { en: 'Admin · users', es: 'Administración de usuarios' } },
      { ...astrohubAdminNews, alt: { en: 'Admin · news', es: 'Administración de noticias' } },
      {
        ...astrohubAdminAppointments,
        alt: { en: 'Admin · appointments', es: 'Administración de citas' },
      },
      { ...astrohubAdminEditUser, alt: { en: 'Editing a user', es: 'Edición de usuarios' } },
      { ...astrohubAdminEditNews, alt: { en: 'Editing a news item', es: 'Edición de noticias' } },
      {
        ...astrohubAdminEditAppointment,
        alt: { en: 'Editing an appointment', es: 'Edición de citas' },
      },
    ],
  },
};
