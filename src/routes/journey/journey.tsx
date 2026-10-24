import { useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router';

import { CHAPTER_MORPH_START } from '~/content/chapters';
import { profile } from '~/content/profile';
import { skillGroups } from '~/content/skills';
import { NotFoundPage } from '~/features/errors/NotFoundPage/NotFoundPage';
import { CosmicHud } from '~/features/hud/CosmicHud/CosmicHud';
import { About } from '~/features/journey/About/About';
import { CHAPTER_SELECTOR } from '~/features/journey/chapterDom/chapterDom';
import { Contact } from '~/features/journey/Contact/Contact';
import { Hero } from '~/features/journey/Hero/Hero';
import { Projects } from '~/features/journey/Projects/Projects';
import { Skills } from '~/features/journey/Skills/Skills';
import { ChapterRail } from '~/features/navigation/ChapterRail/ChapterRail';
import { LanguageNotice } from '~/features/navigation/LanguageNotice/LanguageNotice';
import { QuickMissionDialog } from '~/features/navigation/QuickMissionDialog/QuickMissionDialog';
import { SkipLink } from '~/features/navigation/SkipLink/SkipLink';
import { TopBar } from '~/features/navigation/TopBar/TopBar';
import { SITE_ORIGIN } from '~/lib/env/site/site';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { isLowerCasePathname } from '~/lib/i18n/paths/paths';
import { useScrollTarget } from '~/lib/scroll/useScrollTarget/useScrollTarget';
import { homeMeta, notFoundMeta } from '~/lib/seo/meta/meta';
import { setScrollTarget } from '~/stores/sceneStore/sceneStore';

import type { Route } from './+types/journey';

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  const locale = localeFromPathname(location.pathname);
  // `/ES` casa esta ruta en el cliente, pero es 404 (ver `isLowerCasePathname`).
  if (!isLowerCasePathname(location.pathname)) return notFoundMeta({ locale, profile });
  return homeMeta({ origin: SITE_ORIGIN, locale, profile, skillGroups });
}

const SCROLL_TARGET = {
  selector: CHAPTER_SELECTOR,
  morphStart: CHAPTER_MORPH_START,
  onTarget: setScrollTarget,
} as const;

/**
 * La ruta del viaje: `/ES` (y cualquier prefijo con mayúsculas) es 404 aunque case en el cliente. Solo
 * decide entre la 404 y el viaje, para que el viaje (y lo que mide su `<main>`) se monte y se desmonte
 * con él: si no, al volver de la 404 al inicio los hooks del scroll ya habrían corrido sin `<main>`.
 */
export default function Journey(): ReactNode {
  const { pathname } = useLocation();
  if (!isLowerCasePathname(pathname)) return <NotFoundPage />;
  return <JourneyPage />;
}

/**
 * El viaje: los cinco capítulos en orden (docs/02-experiencia/README.md), sin escena, con la interfaz
 * fija en el orden del Tab (Skip → barra → contenido → raíl → sugerencia de idioma, si sale; el HUD es
 * decorativo) y el modo misión rápida (un diálogo modal: fuera del orden hasta que se abre). Su scroll fija el
 * `m` de `sceneStore`, que leen el raíl, el HUD y el idioma (y, desde F3, la escena).
 */
function JourneyPage(): ReactNode {
  const mainRef = useRef<HTMLElement>(null);
  useScrollTarget(mainRef, SCROLL_TARGET);

  return (
    <>
      <SkipLink />
      <TopBar />
      <main ref={mainRef}>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <ChapterRail />
      <CosmicHud />
      <QuickMissionDialog />
      <LanguageNotice />
    </>
  );
}
