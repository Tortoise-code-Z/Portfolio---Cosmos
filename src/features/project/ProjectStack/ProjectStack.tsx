import type { ReactNode } from 'react';

import type { Project } from '~/content/types';
import { localize } from '~/lib/i18n/localize/localize';
import { useLocale, useT } from '~/lib/i18n/useT/useT';

import styles from './ProjectStack.module.css';

/** Los cuatro grupos del stack, en orden de lectura (docs/01-contenido/modelo-de-datos.md). */
const GROUPS = ['core', 'libraries', 'design', 'tooling'] as const;

interface ProjectStackProps {
  readonly stack: Project['stack'];
}

/** ¿Hay algo que pintar en el stack? Un stack sin ninguna etiqueta no pinta su sección. */
export function hasStack(stack: Project['stack']): boolean {
  return GROUPS.some((group) => stack[group].length > 0);
}

/**
 * Tech stack de la página de proyecto (pagina-proyecto.md → «Estructura», punto 5): un bloque por grupo
 * con su título (`h3`) y sus etiquetas. Un grupo vacío no se pinta.
 */
export function ProjectStack({ stack }: ProjectStackProps): ReactNode {
  const t = useT();
  const locale = useLocale();
  const groups = GROUPS.filter((group) => stack[group].length > 0);

  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <div key={group} className={styles.group}>
          <h3 className={styles.title}>{t(`project.stack.${group}`)}</h3>
          <ul role="list" className={styles.tags}>
            {stack[group].map((label) => {
              const text = localize(locale, label);
              return (
                <li key={text} className={styles.tag}>
                  {text}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
