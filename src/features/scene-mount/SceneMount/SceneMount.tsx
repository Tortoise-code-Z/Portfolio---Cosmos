import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';

import { chooseInitialLevel, readBrowserSignals } from '~/lib/device/sceneLevel/sceneLevel';
import { detectWebGL2 } from '~/lib/device/webgl2/webgl2';
import { useT } from '~/lib/i18n/useT/useT';
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
 * Fiber van en ese chunk aparte, que solo se pide si hay WebGL2 (ADR-002, ADR-020).
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

/**
 * Monta la escena 3D (docs/05-tecnico/arquitectura.md → «Carga de la escena»). `root.tsx` lo pinta una
 * sola vez, en `Layout` detrás de las rutas, para que el lienzo no se recree al navegar. En el pre-render y al hidratar
 * no pinta nada (solo la región del aviso, vacía); después, con el navegador libre:
 * - sin WebGL2 → modo sin WebGL, sin descargar Three.js;
 * - con WebGL2 → elige el nivel (Bajo si pinta por software) y carga la escena en diferido, dentro de su
 *   `ErrorBoundary`.
 * Cualquier fallo de la escena pasa a sin WebGL para el resto de la visita: clase `no-gl` en `<html>` y un
 * aviso, una vez por visita, que espera su turno si la sugerencia de idioma se está viendo.
 */
export function SceneMount(): ReactNode {
  const level = useUiStore(selectSceneLevel);

  useEffect(
    () =>
      whenIdle(() => {
        const support = detectWebGL2();
        if (support === 'none') {
          turnSceneOff();
          return;
        }
        // Pintado por la CPU (sin GPU usable): arranca en Bajo.
        const softwareRendering = support === 'software';
        setSceneLevel(chooseInitialLevel(readBrowserSignals({ softwareRendering })));
      }),
    [],
  );

  const off = level === 'off';
  const [painted, setPainted] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle(NO_GL_CLASS, off);
  }, [off]);
  useEffect(() => {
    document.documentElement.classList.toggle(SCENE_ON_CLASS, painted && !off);
  }, [painted, off]);

  return (
    <>
      {level === null || level === 'off' ? null : (
        <SceneErrorBoundary onError={turnSceneOff}>
          <Suspense fallback={null}>
            <SceneRoot
              level={level}
              onFail={turnSceneOff}
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
