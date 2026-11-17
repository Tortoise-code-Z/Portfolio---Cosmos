import { STAR_LABEL_KEEP_OUT } from '../../config/constellationLayout/constellationLayout';

/**
 * Las etiquetas proyectadas que caben (docs/04-escena/constelaciones-y-placas.md → «Etiquetas»): cada una se ve
 * solo si no pisa lo que tapa la interfaz, ni el borde del lienzo, ni otra que ya se vea. En móvil y en anchos
 * medios no caben todas: se ocultan las que sobran, en el orden del panel (la lista del panel sigue completa).
 */

/** Un rectángulo en píxeles CSS del lienzo: izquierda, arriba, derecha, abajo. */
export type Rect = readonly [left: number, top: number, right: number, bottom: number];

/** La caja de una etiqueta en un frame (la misma para toda la visita: cero objetos nuevos por frame, ADR-004). */
export interface LabelBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** Debería verse (su estrella está delante de la cámara y el capítulo, presente). */
  wanted: boolean;
  /** Se ve: lo decide `fitLabels`. */
  visible: boolean;
}

export function createLabelBox(): LabelBox {
  return { left: 0, top: 0, right: 0, bottom: 0, wanted: false, visible: false };
}

/**
 * Lo que no puede pisar una etiqueta en un lienzo de `width`×`height`: lo que tapa la interfaz
 * (`STAR_LABEL_KEEP_OUT`, en escritorio o por debajo) y el borde del lienzo, todo con su margen. Se calcula al
 * cambiar el tamaño, no en cada frame.
 */
export function keepOutZones(width: number, height: number, wide: boolean): Rect[] {
  const { marginPx: m } = STAR_LABEL_KEEP_OUT;
  const edges: Rect[] = [
    [-Infinity, -Infinity, m, Infinity],
    [width - m, -Infinity, Infinity, Infinity],
    [-Infinity, height - m, Infinity, Infinity],
  ];
  if (wide) {
    const { panelRight, barBottom, rail, hud } = STAR_LABEL_KEEP_OUT.wide;
    return [
      ...edges,
      [-Infinity, -Infinity, panelRight + m, Infinity],
      [-Infinity, -Infinity, Infinity, barBottom + m],
      [
        width - rail.fromRight - m,
        height / 2 - rail.halfHeight - m,
        Infinity,
        height / 2 + rail.halfHeight + m,
      ],
      [width - hud.fromRight - m, height - hud.fromBottom - m, Infinity, Infinity],
    ];
  }
  const { barBottom, rail, hud } = STAR_LABEL_KEEP_OUT.narrow;
  return [
    ...edges,
    [-Infinity, -Infinity, Infinity, barBottom + m],
    [
      width - rail.fromRight - m,
      height / 2 - rail.halfHeight - m,
      Infinity,
      height / 2 + rail.halfHeight + m,
    ],
    [-Infinity, height - hud.fromBottom - m, hud.fromLeft + m, Infinity],
  ];
}

function overlaps(box: Readonly<LabelBox>, zone: Rect): boolean {
  return box.left < zone[2] && zone[0] < box.right && box.top < zone[3] && zone[1] < box.bottom;
}

function collide(a: Readonly<LabelBox>, b: Readonly<LabelBox>): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function clear(boxes: readonly LabelBox[], index: number, zones: readonly Rect[]): boolean {
  const box = boxes[index];
  if (!box?.wanted) return false;
  for (const zone of zones) if (overlaps(box, zone)) return false;
  for (let other = 0; other < index; other += 1) {
    const shown = boxes[other];
    if (shown?.visible === true && collide(box, shown)) return false;
  }
  return true;
}

/**
 * Decide qué etiquetas se ven, en su orden: la que pisa algo ya visible se oculta, no la anterior. Bucles a mano:
 * corre en cada frame y no crea nada (ADR-004).
 */
export function fitLabels(boxes: readonly LabelBox[], zones: readonly Rect[]): void {
  for (let index = 0; index < boxes.length; index += 1) {
    const box = boxes[index];
    if (box !== undefined) box.visible = clear(boxes, index, zones);
  }
}
