// Dónde está el marco del retrato respecto a donde lo pinta la escena (ADR-042). Fuera de la huella de las fotos fijas:
// la escena no importa esto (recibe la cifra por `sceneStore`) y las fotos se sacan sin desplazar.

/** Lo que hay que mover la escena para que el retrato caiga en su marco, en px de la ventana (y, hacia abajo). */
export interface PortraitShift {
  x: number;
  y: number;
}

export function createPortraitShift(): PortraitShift {
  return { x: 0, y: 0 };
}

/** La caja del marco en la ventana (`getBoundingClientRect`). */
export interface FrameBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Cuánto se separa el centro del marco del centro de la ventana (el ancho y el alto del lienzo: `position: fixed;
 * inset: 0`), que es donde la cámara del epílogo pinta el retrato. Un marco sin tamaño (no está en la maqueta o está
 * escondido) o una medida que no es un número no mueve nada. Escribe en `out` y lo devuelve.
 */
export function portraitShift(
  frame: FrameBox,
  viewportWidth: number,
  viewportHeight: number,
  out: PortraitShift,
): PortraitShift {
  const x = frame.left + frame.width / 2 - viewportWidth / 2;
  const y = frame.top + frame.height / 2 - viewportHeight / 2;
  const sized = frame.width > 0 && frame.height > 0;
  out.x = sized && Number.isFinite(x) ? x : 0;
  out.y = sized && Number.isFinite(y) ? y : 0;
  return out;
}
