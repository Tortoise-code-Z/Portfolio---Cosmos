// El foco dentro del escenario fijo de una llegada (ADR-039). Aparte de `arrival`: esa carpeta entra en la huella de las
// fotos fijas (la escena la usa) y esto no cambia lo que se ve.

/** Lo que hace falta para colocar algo enfocado dentro del escenario fijo de una llegada (`stageFocusScroll`). */
export interface StageFocus {
  /** Dónde está el marcador del final de la llegada en el documento (su `top` + `scrollY`). */
  readonly landingY: number;
  /** Cuánto baja lo enfocado desde el borde de arriba del escenario, y su alto. */
  readonly offset: number;
  readonly height: number;
  /**
   * Lo que se reserva arriba y abajo al enfocar (`scroll-padding-block-start`, la barra, y `scroll-padding-block-end`,
   * el aire de abajo y el aviso «Copied» si está), el alto de la ventana y el aire para el anillo.
   */
  readonly bar: number;
  readonly end: number;
  readonly viewport: number;
  readonly margin: number;
}

/**
 * El scroll que enseña algo enfocado dentro del escenario de una llegada (ADR-039). Mientras dura la llegada el
 * escenario está pegado bajo la barra, así que lo que cae por debajo de la ventana no sube con el scroll y el
 * navegador no consigue enseñarlo al enfocarlo (Tab): hay que ir al final de la llegada, donde el escenario se suelta,
 * y bajar lo justo para que quepa entero con su anillo y el aire de abajo. En píxeles enteros y con `FOCUS_SAFETY_PX`
 * de más: un motor que redondea el scroll hacia abajo (WebKit) dejaba el anillo una fracción de píxel fuera.
 */
export function stageFocusScroll({
  landingY,
  offset,
  height,
  bar,
  end,
  viewport,
  margin,
}: StageFocus): number {
  const landed = landingY - bar;
  return Math.ceil(
    landed + Math.max(0, bar + offset + height + margin + FOCUS_SAFETY_PX + end - viewport),
  );
}

/** Lo que `stageFocusScroll` deja de más bajo lo enfocado (los redondeos del scroll). */
export const FOCUS_SAFETY_PX = 2;
