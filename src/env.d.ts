// Variables de entorno que lee el cliente (docs/05-tecnico/arquitectura.md → «Configuración y entorno»).
interface ImportMetaEnv {
  readonly VITE_SITE_URL: string | undefined;
}

// Imports de imagen con los presets de `vite-imagetools` (vite.config.ts → IMAGE_PRESETS).
declare module '*?project' {
  const image: import('~/content/types').ResponsiveImage;
  export default image;
}

declare module '*?share' {
  const image: import('~/content/types').ImageFile;
  export default image;
}
