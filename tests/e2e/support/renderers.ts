/**
 * Los nombres de `renderer` con los que se disfrazan los e2e (`presentWebGLAsRenderer`, en `helpers.ts`) y los
 * números de WebGL que se leen para saberlo. Sin Playwright: también los usa el unitario de la detección
 * (`src/lib/device/webgl2/webgl2.test.ts`), que comprueba que cada uno cae del lado que debe en `isSoftwareRenderer`
 * (si la lista de software atrapara el inventado de GPU, casi todos los e2e con escena irían al modo sin WebGL).
 */

/** El `renderer` de los que se presentan como GPU: un nombre de ANGLE inventado, sin nada de los de software. */
export const FAKE_GPU_RENDERER = 'ANGLE (e2e, Fake GPU for the tests, Direct3D11)';

/** El `renderer` de Chromium sin GPU, tal cual (el de la imagen de Playwright y el de PageSpeed). */
export const SWIFTSHADER_RENDERER =
  'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)';

/** `RENDERER` de WebGL y `UNMASKED_RENDERER_WEBGL` de `WEBGL_debug_renderer_info` (los números del estándar). */
export const RENDERER_PARAMETER = 0x1f01;
export const UNMASKED_RENDERER_PARAMETER = 0x9246;
