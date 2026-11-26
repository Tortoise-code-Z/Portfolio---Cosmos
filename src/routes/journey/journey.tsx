import { useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router';

import { JOURNEY_SEGMENTS } from '~/content/chapters';
import { profile } from '~/content/profile';
import { siteShare } from '~/content/shareImage';
import { skillGroups } from '~/content/skills';
import { NotFoundPage } from '~/features/errors/NotFoundPage/NotFoundPage';
import { CosmicHud } from '~/features/hud/CosmicHud/CosmicHud';
import { About } from '~/features/journey/About/About';
import { BigBangFlash } from '~/features/journey/BigBangFlash/BigBangFlash';
import { JOURNEY_SEGMENT_SELECTOR } from '~/features/journey/chapterDom/chapterDom';
import { Contact } from '~/features/journey/Contact/Contact';
import { CrewFile } from '~/features/journey/CrewFile/CrewFile';
import { Hero } from '~/features/journey/Hero/Hero';
import { MissionControl } from '~/features/journey/MissionControl/MissionControl';
import { MissionLog } from '~/features/journey/MissionLog/MissionLog';
import { Projects } from '~/features/journey/Projects/Projects';
import { Skills } from '~/features/journey/Skills/Skills';
import { ChapterRail } from '~/features/navigation/ChapterRail/ChapterRail';
import { LanguageNotice } from '~/features/navigation/LanguageNotice/LanguageNotice';
import { QuickMissionDialog } from '~/features/navigation/QuickMissionDialog/QuickMissionDialog';
import { SkipLink } from '~/features/navigation/SkipLink/SkipLink';
import { TopBar } from '~/features/navigation/TopBar/TopBar';
import { SceneStills } from '~/features/scene-mount/SceneStills/SceneStills';
import { SITE_ORIGIN } from '~/lib/env/site/site';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { isLowerCasePathname } from '~/lib/i18n/paths/paths';
import { useScrollTarget } from '~/lib/scroll/useScrollTarget/useScrollTarget';
import { homeMeta, notFoundMeta } from '~/lib/seo/meta/meta';
import {
  setReadingArrival,
  setReadingInterlude,
  setScrollTarget,
} from '~/stores/sceneStore/sceneStore';

import type { Route } from './+types/journey';

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  const locale = localeFromPathname(location.pathname);
  // `/ES` casa esta ruta en el cliente, pero es 404 (ver `isLowerCasePathname`).
  if (!isLowerCasePathname(location.pathname)) return notFoundMeta({ locale, profile });
  return homeMeta({ origin: SITE_ORIGIN, locale, profile, siteShare, skillGroups });
}

/**
 * Con `m`, la posición en los tramos (las formas y las naves) y el tramo: si es de un interludio (también los huecos de
 * su nave) o la llegada de un capítulo, el raíl lo marca.
 */
function onScrollTarget(m: number, segment: number, j: number): void {
  setScrollTarget(m, j);
  const reading = JOURNEY_SEGMENTS[segment];
  setReadingInterlude(reading !== undefined && 'interlude' in reading ? reading.interlude : null);
  setReadingArrival(reading?.kind === 'arrival' ? reading.chapter : null);
}

const SCROLL_TARGET = {
  selector: JOURNEY_SEGMENT_SELECTOR,
  steps: JOURNEY_SEGMENTS,
  onTarget: onScrollTarget,
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
 * El viaje: los seis capítulos (el último, el epílogo) y los dos interludios (Mission log tras About, Mission control tras Projects), en el
 * orden de `JOURNEY_SEGMENTS` (docs/02-experiencia/README.md), sin montar la escena (la monta `Layout`, `root.tsx`), con la interfaz fija en el
 * orden del Tab (Skip → barra → contenido → raíl → sugerencia de idioma, si sale; el HUD es decorativo) y el modo
 * misión rápida (un diálogo modal: fuera del orden hasta que se abre). Su scroll fija `mTarget` en `sceneStore` (y
 * `m = mTarget`) y el interludio que se lee: el raíl, el HUD y el idioma leen la parada activa (`selectActiveStop`),
 * las fotos fijas leen `m`, y la escena, `mTarget`. El destello del Big Bang va fuera de `<main>`, entre el lienzo y el
 * contenido. Las fotos fijas de la escena (solo en el modo sin WebGL, ADR-029) son solo del viaje: las fichas y la
 * 404 se quedan con el degradado del espacio.
 */
function JourneyPage(): ReactNode {
  const mainRef = useRef<HTMLElement>(null);
  useScrollTarget(mainRef, SCROLL_TARGET);

  return (
    <>
      <SceneStills />
      <BigBangFlash />
      <SkipLink />
      <TopBar />
      <main ref={mainRef}>
        <Hero />
        <About />
        <MissionLog />
        <Skills />
        <Projects />
        <MissionControl />
        <Contact />
        <CrewFile />
      </main>
      <ChapterRail />
      <CosmicHud />
      <QuickMissionDialog />
      <LanguageNotice />
    </>
  );
}
