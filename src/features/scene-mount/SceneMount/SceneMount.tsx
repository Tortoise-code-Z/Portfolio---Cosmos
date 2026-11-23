import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { projectEntries } from '~/content/projects/entries';
import { skillGroups } from '~/content/skills';

import { chooseInitialLevel, readBrowserSignals } from '~/lib/device/sceneLevel/sceneLevel';
import { detectWebGL2 } from '~/lib/device/webgl2/webgl2';
import { localize } from '~/lib/i18n/localize/localize';
import { homePath, projectPath } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import {
  selectLanguageNoticeOpen,
  selectSceneLevel,
  setSceneLevel,
  turnSceneOff,
  useUiStore,
} from '~/stores/uiStore/uiStore';
import { ButtonOutline } from '~/ui/ButtonOutline/ButtonOutline';
import { Notice } from '~/ui/Notice/Notice';

import { SceneErrorBoundary } from '../SceneErrorBoundary';

/**
 * El único punto por el que la interfaz llega a la escena: un import dinámico. Three.js y React Three
 * Fiber van en ese chunk aparte, que solo se pide si hay WebGL2 pintado por la tarjeta gráfica (ADR-002, ADR-020,
 * ADR-029).
 */
const SceneRoot = lazy(() => import('~/scene/SceneRoot/SceneRoot'));

/** Clase de `<html>` en el modo sin WebGL (docs/02-experiencia/estados-y-accesibilidad.md). */
export const NO_GL_CLASS = 'no-gl';

/**
 * Clase de `<html>` mientras la escena pinta partículas: el punto CSS del hero se funde y la singularidad de
 * partículas lo releva en el mismo sitio; el halo se queda (estados-y-accesibilidad.md → «Secuencia de carga»).
 * Sin escena (o si falla) no está, y el punto vuelve.
 */
export const SCENE_ON_CLASS = 'scene-on';

/** Lo más que se espera a que el navegador quede libre antes de decidir (con `requestIdleCallback`). */
export const IDLE_TIMEOUT_MS = 2000;

/**
 * Llama a `task` cuando el navegador está libre (o, como mucho, en `IDLE_TIMEOUT_MS`). Safari no tiene
 * `requestIdleCallback`: allí, en la siguiente vuelta del bucle de eventos, ya con la página hidratada.
 */
function whenIdle(task: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
    return () => {
      window.cancelIdleCallback(handle);
    };
  }
  const timer = setTimeout(task, 0);
  return () => {
    clearTimeout(timer);
  };
}

/** La página es el viaje (no una ficha ni la 404). */
function useInJourney(): boolean {
  const locale = useLocale();
  const { pathname } = useLocation();
  return (pathname.replace(/\/$/, '') || '/') === homePath(locale);
}

/** El nombre de cada proyecto, por slug, para los pins de las placas: solo en el viaje (si no, `null`, sin pins). */
const PROJECT_NAMES: Readonly<Record<string, string>> = Object.fromEntries(
  projectEntries.map(({ slug, name }) => [slug, name] as const),
);

/**
 * El texto de la etiqueta de cada estrella de las constelaciones, por `Skill.id`, en el idioma de la página: solo en
 * el viaje (en las fichas y la 404 no hay capítulo de Skills, así que tampoco etiquetas: `null`).
 */
function useSkillLabels(inJourney: boolean): Readonly<Record<string, string>> | null {
  const locale = useLocale();
  return useMemo(
    () =>
      inJourney
        ? Object.fromEntries(
            skillGroups.flatMap((group) =>
              group.skills.map((skill) => [skill.id, localize(locale, skill.label)] as const),
            ),
          )
        : null,
    [inJourney, locale],
  );
}

/**
 * Monta la escena 3D (docs/05-tecnico/arquitectura.md → «Carga de la escena»). `root.tsx` lo pinta una
 * sola vez, en `Layout` detrás de las rutas, para que el lienzo no se recree al navegar. En el pre-render y al hidratar
 * no pinta nada (solo la región del aviso, vacía); después, con el navegador libre:
 * - sin WebGL2, o con WebGL2 pintado por software (ADR-029) → modo sin WebGL, sin descargar Three.js;
 * - con WebGL2 en la tarjeta gráfica → elige el nivel y carga la escena en diferido, dentro de su
 *   `ErrorBoundary`, con los textos de las etiquetas de las constelaciones y los nombres de los pins en el viaje.
 * Cualquier fallo de la escena pasa a sin WebGL para el resto de la visita: clase `no-gl` en `<html>` y un
 * aviso, una vez por visita, que espera su turno si la sugerencia de idioma se está viendo.
 */
export function SceneMount(): ReactNode {
  const level = useUiStore(selectSceneLevel);
  const inJourney = useInJourney();
  const skillLabels = useSkillLabels(inJourney);
  const locale = useLocale();
  const navigate = useNavigate();
  // Un pin abre la ficha de su proyecto, en el idioma de la página (como «View project» de su fila).
  const openProject = useCallback(
    (slug: string) => {
      void navigate(projectPath(locale, slug));
    },
    [navigate, locale],
  );

  useEffect(
    () =>
      whenIdle(() => {
        // Pintada por la CPU, la escena va a tirones en el hilo principal y estropea el scroll: mejor sin ella (P1).
        if (detectWebGL2() !== 'hardware') {
          turnSceneOff();
          return;
        }
        setSceneLevel(chooseInitialLevel(readBrowserSignals()));
      }),
    [],
  );

  const off = level === 'off';
  const [painted, setPainted] = useState(false);
  // Cada clase se quita al desmontar (o antes de volver a decidirla): sin `SceneMount` no hay escena que relevar.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(NO_GL_CLASS, off);
    return () => {
      root.classList.remove(NO_GL_CLASS);
    };
  }, [off]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(SCENE_ON_CLASS, painted && !off);
    return () => {
      root.classList.remove(SCENE_ON_CLASS);
    };
  }, [painted, off]);

  return (
    <>
      {level === null || level === 'off' ? null : (
        <SceneErrorBoundary onError={turnSceneOff}>
          <Suspense fallback={null}>
            <SceneRoot
              level={level}
              onFail={turnSceneOff}
              skillLabels={skillLabels}
              projectNames={inJourney ? PROJECT_NAMES : null}
              onOpenProject={openProject}
              onPainted={() => {
                setPainted(true);
              }}
            />
          </Suspense>
        </SceneErrorBoundary>
      )}
      <NoGlNotice off={off} />
    </>
  );
}

/**
 * «Your browser can't show the 3D universe…» (textos-sitio.md → `noGl.*`). Una vez por visita: descartarlo
 * dura hasta recargar (si el navegador sigue sin WebGL, volver a decirlo es útil). Si la sugerencia de
 * idioma se está viendo, espera a que se conteste: nunca se tapan.
 */
function NoGlNotice({ off }: { readonly off: boolean }): ReactNode {
  const t = useT();
  const languageNoticeOpen = useUiStore(selectLanguageNoticeOpen);
  const [dismissed, setDismissed] = useState(false);
  const open = off && !dismissed && !languageNoticeOpen;

  return (
    <Notice open={open}>
      {open ? (
        <>
          <p>{t('noGl.notice')}</p>
          <ButtonOutline
            onClick={() => {
              setDismissed(true);
            }}
          >
            {t('noGl.dismiss')}
          </ButtonOutline>
        </>
      ) : null}
    </Notice>
  );
}
