import type { ReactNode } from 'react';

import type { ProjectNote as ProjectNoteData } from '~/content/types';
import { useT } from '~/lib/i18n/useT/useT';
import { Icon } from '~/ui/Icon/Icon';
import { VisuallyHidden } from '~/ui/VisuallyHidden/VisuallyHidden';

import styles from './ProjectNote.module.css';

interface ProjectNoteProps {
  readonly kind: ProjectNoteData['kind'];
  readonly children: ReactNode;
}

/**
 * Nota de proyecto (docs/03-diseno/componentes.md → «Nota de proyecto»): borde izquierdo de 2 px
 * turquesa (`info`) o ámbar (`warning`), icono y texto. El tipo no se dice solo con color ni con el
 * icono (decorativo): el lector oye «Note:» o «Warning:» delante.
 */
export function ProjectNote({ kind, children }: ProjectNoteProps): ReactNode {
  const t = useT();
  return (
    <div className={styles.note} data-kind={kind}>
      <Icon name={kind} />
      <p className={styles.text}>
        <VisuallyHidden>{t(`project.note.${kind}`)} </VisuallyHidden>
        {children}
      </p>
    </div>
  );
}
