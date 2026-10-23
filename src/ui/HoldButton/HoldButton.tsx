import { useId, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from 'react';

import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './HoldButton.module.css';

/** Teclas que cargan mientras se mantienen (con el foco en el botón). */
const HOLD_KEYS = new Set([' ', 'Enter']);

interface HoldButtonProps {
  /** Texto visible; también es el nombre accesible (lo que se ve es lo que se dice). */
  readonly label: string;
  /** Explicación para el lector de pantalla (`aria-describedby`). */
  readonly description: string;
  /** Ya cumplió su función: queda `aria-disabled` (sin perder el foco) hasta que se rearme. */
  readonly done: boolean;
  readonly onPress: () => void;
  readonly onRelease: () => void;
  /** Elemento donde el dueño escribe la carga (`--_charge`, 0–1) que dibuja el anillo. */
  readonly ref?: Ref<HTMLButtonElement>;
}

/**
 * Botón de mantener pulsado (docs/03-diseno/componentes.md → «Botón de mantener»): carga mientras se
 * mantiene con ratón, dedo o `Espacio`/`Enter`, y descarga al soltar. Un clic corto no hace nada.
 * La lógica de la carga es del dueño; este componente solo traduce gestos y dibuja el anillo.
 */
export function HoldButton({
  label,
  description,
  done,
  onPress,
  onRelease,
  ref,
}: HoldButtonProps): ReactNode {
  const descriptionId = useId();

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    if (event.button !== 0) return;
    onPress();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (!HOLD_KEYS.has(event.key)) return;
    event.preventDefault();
    if (!event.repeat) onPress();
  };

  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (!HOLD_KEYS.has(event.key)) return;
    event.preventDefault();
    onRelease();
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={styles.button}
        aria-describedby={descriptionId}
        aria-disabled={done ? true : undefined}
        onPointerDown={onPointerDown}
        onPointerUp={onRelease}
        onPointerLeave={onRelease}
        onPointerCancel={onRelease}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={onRelease}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
      >
        <svg className={styles.ring} viewBox="0 0 26 26" aria-hidden="true" focusable="false">
          <circle className={styles.track} cx="13" cy="13" r="11" pathLength={1} />
          <circle className={styles.progress} cx="13" cy="13" r="11" pathLength={1} />
        </svg>
        <span>{label}</span>
      </button>
      <VisuallyHidden id={descriptionId}>{description}</VisuallyHidden>
    </>
  );
}
