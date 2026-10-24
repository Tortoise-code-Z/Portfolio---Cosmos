import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useT } from '~/lib/i18n/useT/useT';

import { ButtonOutline } from '../ButtonOutline/ButtonOutline';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';

/** Lo que dura «Copied» o «Select and copy it» antes de volver a «Copy» (componentes.md). */
export const COPY_FEEDBACK_MS = 1800;

type CopyState = 'idle' | 'copied' | 'failed';

const LABEL_KEYS = {
  idle: 'contact.copy',
  copied: 'contact.copied',
  failed: 'contact.copyFailed',
} as const;

interface CopyButtonProps {
  /** Lo que se copia. */
  readonly text: string;
  /** Elemento con ese texto: si el portapapeles falla, se selecciona para copiarlo a mano. */
  readonly targetId: string;
  /** Qué se copia, solo para el lector de pantalla («Copy email»): fuera de su fila se entiende. */
  readonly subject: string;
}

/**
 * Botón copiar (docs/03-diseno/componentes.md → «Botón copiar»): Copy → Copied durante 1,8 s. Si el
 * portapapeles no está (http, navegador viejo) o lo rechaza, selecciona el texto y dice «Select and
 * copy it». El resultado se anuncia en una región viva aparte (el cambio de texto de un botón no se
 * anuncia solo) y el foco no se mueve.
 */
export function CopyButton({ text, targetId, subject }: CopyButtonProps): ReactNode {
  const t = useT();
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  function show(next: CopyState): void {
    if (!mounted.current) return;
    window.clearTimeout(timer.current);
    setState(next);
    timer.current = window.setTimeout(() => {
      setState('idle');
    }, COPY_FEEDBACK_MS);
  }

  function selectByHand(): void {
    const target = document.getElementById(targetId);
    if (target !== null) window.getSelection()?.selectAllChildren(target);
    show('failed');
  }

  function copy(): void {
    // Sin contexto seguro (http) no existe, aunque el tipo diga lo contrario.
    const clipboard = navigator.clipboard as Clipboard | undefined;
    if (clipboard === undefined) {
      selectByHand();
      return;
    }
    clipboard.writeText(text).then(
      () => {
        show('copied');
      },
      (error: unknown) => {
        console.warn('[copy] Clipboard write was rejected', error);
        selectByHand();
      },
    );
  }

  return (
    <>
      <ButtonOutline onClick={copy}>
        {t(LABEL_KEYS[state])}
        {state === 'idle' ? (
          <>
            {' '}
            <VisuallyHidden>{subject}</VisuallyHidden>
          </>
        ) : null}
      </ButtonOutline>
      <VisuallyHidden role="status">{state === 'idle' ? '' : t(LABEL_KEYS[state])}</VisuallyHidden>
    </>
  );
}
