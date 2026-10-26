import { Component, type ErrorInfo, type ReactNode } from 'react';

interface SceneErrorBoundaryProps {
  /** Se llama una vez, con el error ya registrado: quien monta la escena pasa a sin WebGL. */
  readonly onError: () => void;
  readonly children: ReactNode;
}

interface SceneErrorBoundaryState {
  readonly failed: boolean;
}

/**
 * Aísla la escena (DEVELOPMENT_RULES.md §5, docs/05-tecnico/arquitectura.md → «Errores»): un fallo 3D
 * (el chunk que no llega, el contexto que no se crea, un error al pintar) nunca tumba la página. Lo
 * registra con contexto, deja de pintar sus hijos y avisa para pasar a sin WebGL. No reintenta: la visita
 * sigue sin escena.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  override state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      '[scene] The 3D scene failed; continuing without WebGL',
      error,
      info.componentStack,
    );
    this.props.onError();
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
