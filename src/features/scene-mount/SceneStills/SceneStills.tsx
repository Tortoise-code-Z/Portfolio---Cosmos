import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';

import desktop1Avif from '~/assets/scene-stills/avif/scene-still-desktop-1.avif';
import desktop1Webp from '~/assets/scene-stills/webp/scene-still-desktop-1.webp';
import handheld1Avif from '~/assets/scene-stills/avif/scene-still-handheld-1.avif';
import handheld1Webp from '~/assets/scene-stills/webp/scene-still-handheld-1.webp';
import desktop2Avif from '~/assets/scene-stills/avif/scene-still-desktop-2.avif';
import desktop2Webp from '~/assets/scene-stills/webp/scene-still-desktop-2.webp';
import handheld2Avif from '~/assets/scene-stills/avif/scene-still-handheld-2.avif';
import handheld2Webp from '~/assets/scene-stills/webp/scene-still-handheld-2.webp';
import desktop3Avif from '~/assets/scene-stills/avif/scene-still-desktop-3.avif';
import desktop3Webp from '~/assets/scene-stills/webp/scene-still-desktop-3.webp';
import handheld3Avif from '~/assets/scene-stills/avif/scene-still-handheld-3.avif';
import handheld3Webp from '~/assets/scene-stills/webp/scene-still-handheld-3.webp';
import desktop4Avif from '~/assets/scene-stills/avif/scene-still-desktop-4.avif';
import desktop4Webp from '~/assets/scene-stills/webp/scene-still-desktop-4.webp';
import handheld4Avif from '~/assets/scene-stills/avif/scene-still-handheld-4.avif';
import handheld4Webp from '~/assets/scene-stills/webp/scene-still-handheld-4.webp';
import { selectActiveChapter, sceneStore } from '~/stores/sceneStore/sceneStore';
import { selectSceneLevel, useUiStore } from '~/stores/uiStore/uiStore';

import styles from './SceneStills.module.css';
import { DESKTOP_STILL_QUERY, STILL_CHAPTERS, type StillChapter } from '../stillFrames/stillFrames';

/** Las dos variantes (AVIF y WebP) de una foto. */
interface StillFormats {
  readonly avif: string;
  readonly webp: string;
}

/** Las fotos de cada capítulo, por encuadre (`STILL_FRAMES`). Una que falte rompe el build, no la visita. */
export const STILL_SOURCES: Readonly<
  Record<StillChapter, { readonly desktop: StillFormats; readonly handheld: StillFormats }>
> = {
  1: {
    desktop: { avif: desktop1Avif, webp: desktop1Webp },
    handheld: { avif: handheld1Avif, webp: handheld1Webp },
  },
  2: {
    desktop: { avif: desktop2Avif, webp: desktop2Webp },
    handheld: { avif: handheld2Avif, webp: handheld2Webp },
  },
  3: {
    desktop: { avif: desktop3Avif, webp: desktop3Webp },
    handheld: { avif: handheld3Avif, webp: handheld3Webp },
  },
  4: {
    desktop: { avif: desktop4Avif, webp: desktop4Webp },
    handheld: { avif: handheld4Avif, webp: handheld4Webp },
  },
};

function isStillChapter(chapter: number): chapter is StillChapter {
  return (STILL_CHAPTERS as readonly number[]).includes(chapter);
}

/**
 * Las fotos fijas de la escena en el modo sin WebGL (ADR-029; docs/02-experiencia/estados-y-accesibilidad.md →
 * «Sin WebGL»): solo en el viaje (la ruta las pinta) y solo con el nivel `off`. Con escena, o mientras se decide,
 * nada: ni el DOM ni las descargas.
 */
export function SceneStills(): ReactNode {
  const level = useUiStore(selectSceneLevel);
  return level === 'off' ? <Stills /> : null;
}

/**
 * La foto del capítulo activo (`sceneStore` → `activeChapter`, como el HUD), encima del degradado del espacio y
 * fundida con `screen`: la foto es la escena sobre negro y las partículas se suman como luz, así que el negro no se
 * ve. Solo se descargan las de los capítulos por los que pasa la visita; una vez en el DOM se quedan (ya bajadas),
 * así que volver a un capítulo es inmediato. La nueva entra cuando ha llegado: hasta entonces sigue la anterior
 * (nunca un hueco a medias). En la singularidad (capítulo 0), ninguna. Decorativas: sin texto ni foco; si una no
 * llega, se queda la anterior y no se avisa (el contenido no depende de ellas).
 */
function Stills(): ReactNode {
  const chapter = useStore(sceneStore, selectActiveChapter);
  const target = isStillChapter(chapter) ? chapter : null;
  const [visited, setVisited] = useState<readonly StillChapter[]>([]);
  const [loaded, setLoaded] = useState<ReadonlySet<StillChapter>>(() => new Set());
  const [shown, setShown] = useState<StillChapter | null>(null);

  // Estado que sale de lo anterior (la guía de React: «guardar información de renders previos»).
  if (target !== null && !visited.includes(target)) setVisited([...visited, target]);
  const next = target === null || loaded.has(target) ? target : shown;
  if (next !== shown) setShown(next);

  return (
    <div className={styles.stills} aria-hidden="true" data-scene-stills="">
      {visited.map((still) => (
        <Still
          key={still}
          chapter={still}
          visible={still === shown}
          onLoad={() => {
            setLoaded((previous) => new Set(previous).add(still));
          }}
        />
      ))}
    </div>
  );
}

interface StillProps {
  readonly chapter: StillChapter;
  readonly visible: boolean;
  readonly onLoad: () => void;
}

/**
 * Una foto: la de escritorio o la de móvil (`DESKTOP_STILL_QUERY`), en AVIF o WebP, la que elija el navegador.
 *
 * El `src` del `<img>` (la WebP de móvil, el respaldo) se pone ya dentro del `<picture>`, no en el JSX: React crea el
 * `<img>` suelto, le pone sus atributos y después lo mete en el `<picture>`. Chromium espera a ese momento para
 * elegir (lo que pide el estándar); WebKit, en el CI, pidió también la foto de móvil en escritorio, y la causa
 * deducida es que pide el `src` en cuanto lo recibe. Sin `src` hasta estar dentro, cada navegador pide solo la que
 * elige (lo vigila el e2e de escritorio sin WebGL, también en WebKit: ninguna foto de móvil pedida).
 */
function Still({ chapter, visible, onLoad }: StillProps): ReactNode {
  const { desktop, handheld } = STILL_SOURCES[chapter];
  const image = useRef<HTMLImageElement>(null);
  useLayoutEffect(() => {
    if (image.current !== null) image.current.src = handheld.webp;
  }, [handheld.webp]);
  return (
    <picture>
      <source media={DESKTOP_STILL_QUERY} type="image/avif" srcSet={desktop.avif} />
      <source media={DESKTOP_STILL_QUERY} type="image/webp" srcSet={desktop.webp} />
      <source type="image/avif" srcSet={handheld.avif} />
      <img
        ref={image}
        className={styles.still}
        alt=""
        decoding="async"
        fetchPriority="low"
        data-chapter={chapter}
        data-visible={visible}
        onLoad={onLoad}
      />
    </picture>
  );
}
