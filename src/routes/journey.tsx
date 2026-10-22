import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

import type { Locale } from '~/content/types';
import { localeFromPathname } from '~/lib/i18n/locale';

import type { Route } from './+types/journey';

// Provisional (F1): página «hello» para validar rutas, idiomas y pre-renderizado.
// En F2 los textos pasan a src/content y esta ruta monta los cinco capítulos.
const HELLO: Readonly<Record<Locale, { readonly title: string; readonly lead: string }>> = {
  en: {
    title: 'Víctor Pérez · Frontend Developer (React + TypeScript)',
    lead: 'Everything that exists started as a single point. So did my code.',
  },
  es: {
    title: 'Víctor Pérez · Desarrollador Frontend (React + TypeScript)',
    lead: 'Todo lo que existe empezó siendo un punto. Mi código también.',
  },
};

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: HELLO[localeFromPathname(location.pathname)].title }];
}

export default function Journey(): ReactNode {
  const { pathname } = useLocation();
  const text = HELLO[localeFromPathname(pathname)];

  return (
    <main>
      <h1>Víctor Pérez</h1>
      <p>{text.lead}</p>
    </main>
  );
}
