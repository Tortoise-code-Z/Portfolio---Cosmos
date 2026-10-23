// Variables de entorno que lee el cliente (docs/05-tecnico/arquitectura.md → «Configuración y entorno»).
interface ImportMetaEnv {
  readonly VITE_SITE_URL: string | undefined;
}
