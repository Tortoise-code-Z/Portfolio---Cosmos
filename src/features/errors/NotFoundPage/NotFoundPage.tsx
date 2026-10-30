import type { ReactNode } from 'react';

import { homePath } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { ActionLink } from '~/ui/ActionLink/ActionLink';

import styles from './NotFoundPage.module.css';

/**
 * Página «te has perdido» en el idioma del prefijo (docs/02-experiencia/estados-y-accesibilidad.md →
 * «404»): título, frase y vuelta al inicio, centrados en la pantalla. La pintan la ruta `*`, las de
 * página con un slug desconocido o con mayúsculas, y en `root.tsx` el `ErrorBoundary` (con un 404) y el
 * `HydrateFallback`: el mismo HTML que el 404 pre-renderizado, así que hidrata sin errores. Sin barra
 * ni raíl: solo hay un camino, volver. La nebulosa atenuada y a la deriva llega en F5, con la
 * escena atenuada de las páginas de proyecto (roadmap).
 */
export function NotFoundPage(): ReactNode {
  const t = useT();
  const locale = useLocale();

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.title}>{t('notFound.title')}</h1>
        <p className={styles.body}>{t('notFound.body')}</p>
        <p>
          <ActionLink href={homePath(locale)} kind="internal" icon="arrow-right">
            {t('notFound.cta')}
          </ActionLink>
        </p>
      </div>
    </main>
  );
}
