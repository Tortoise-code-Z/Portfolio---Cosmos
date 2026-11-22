import colorUrl from '~/assets/portrait/portrait-color.jpg?url';
import packUrl from '~/assets/portrait/portrait-depth.png?url';

import type { PortraitPixels } from '../../shapes/portrait/portrait';

/**
 * Las imágenes del retrato, descargadas y leídas en el worker (docs/04-escena/rendimiento.md → «Worker de las
 * formas»): `fetch`, `createImageBitmap` y un `OffscreenCanvas`. Su test sustituye esas tres piezas del navegador y
 * mira el camino (cada imagen a su sitio, el paquete leído como datos, los fallos); que se vea de verdad, el e2e.
 */

/** Sin gestión de color ni alfa premultiplicado: el paquete de profundidad son datos, no una imagen. */
const RAW: ImageBitmapOptions = { colorSpaceConversion: 'none', premultiplyAlpha: 'none' };

async function readImage(url: string, options?: ImageBitmapOptions): Promise<ImageData> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${String(response.status)}`);
  const bitmap = await createImageBitmap(await response.blob(), options);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) throw new Error('OffscreenCanvas 2D is not available');
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

/** Las dos imágenes del retrato. Lanza si no llegan o no se pueden leer (quien llama se queda en la Tierra). */
export async function decodePortrait(): Promise<PortraitPixels> {
  const [color, pack] = await Promise.all([readImage(colorUrl), readImage(packUrl, RAW)]);
  if (color.width !== pack.width || color.height !== pack.height) {
    throw new Error('The portrait images do not match in size');
  }
  return { width: color.width, height: color.height, color: color.data, pack: pack.data };
}
