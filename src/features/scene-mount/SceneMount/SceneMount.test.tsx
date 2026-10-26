import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RenderLevel } from '~/lib/device/sceneLevel/sceneLevel';
import { detectWebGL2 } from '~/lib/device/webgl2/webgl2';
import {
  selectSceneLevel,
  setLanguageNoticeOpen,
  turnSceneOff,
  useUiStore,
} from '~/stores/uiStore/uiStore';

import { IDLE_TIMEOUT_MS, NO_GL_CLASS, SCENE_ON_CLASS, SceneMount } from './SceneMount';

/** Lo que hará la escena falsa al montarse, y los niveles con los que se montó. */
interface FakeScene {
  behaviour: 'render' | 'throw' | 'fail' | 'paint';
  levels: string[];
}
const scene = vi.hoisted((): FakeScene => ({ behaviour: 'render', levels: [] }));

// La escena de verdad necesita WebGL: aquí se sustituye por un componente que dice con qué nivel se montó.
vi.mock('~/scene/SceneRoot/SceneRoot', () => ({
  default: function FakeSceneRoot({
    level,
    onFail,
    onPainted,
  }: {
    readonly level: RenderLevel;
    readonly onFail: (reason: string) => void;
    readonly onPainted: () => void;
  }): ReactNode {
    if (scene.behaviour === 'throw') throw new Error('WebGL context could not be created');
    useEffect(() => {
      scene.levels.push(level);
      if (scene.behaviour === 'fail') onFail('shader-error');
      if (scene.behaviour === 'paint') onPainted();
    }, [level, onFail, onPainted]);
    return <div data-testid="scene">{level}</div>;
  },
}));

vi.mock('~/lib/device/webgl2/webgl2', () => ({ detectWebGL2: vi.fn(() => 'hardware') }));

const NOTICE_TEXT = "Your browser can't show the 3D universe, but everything else is here.";

function renderMount(path = '/'): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <p>The page</p>
      <SceneMount />
    </MemoryRouter>,
  );
}

/** Deja correr la espera de «navegador libre» (sin `requestIdleCallback` en jsdom, un `setTimeout`). */
async function idle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

const sceneLevel = (): string | null => selectSceneLevel(useUiStore.getState());

beforeEach(() => {
  vi.stubGlobal('innerWidth', 1440);
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }));
  vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(8);
});

afterEach(() => {
  // Desmontar antes de quitar los globales falsos (`cancelIdleCallback`).
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.mocked(detectWebGL2).mockReturnValue('hardware');
  useUiStore.setState(useUiStore.getInitialState(), true);
  document.documentElement.classList.remove(NO_GL_CLASS, SCENE_ON_CLASS);
  scene.behaviour = 'render';
  scene.levels = [];
});

describe('SceneMount', () => {
  it('paints nothing before the browser is idle: only the empty notice region', () => {
    renderMount();
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(sceneLevel()).toBeNull();
    expect(detectWebGL2).not.toHaveBeenCalled();
  });

  it('with WebGL2, mounts the scene at the level the browser signals pick', async () => {
    renderMount();
    await idle();
    expect(await screen.findByTestId('scene')).toHaveTextContent('high');
    expect(sceneLevel()).toBe('high');
    expect(document.documentElement).not.toHaveClass(NO_GL_CLASS);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('marks the page while the scene paints particles (the hero dot hands over), and not after a failure', async () => {
    scene.behaviour = 'paint';
    renderMount();
    await idle();
    await screen.findByTestId('scene');
    expect(document.documentElement).toHaveClass(SCENE_ON_CLASS);
    act(() => {
      turnSceneOff();
    });
    expect(document.documentElement).not.toHaveClass(SCENE_ON_CLASS);
    expect(document.documentElement).toHaveClass(NO_GL_CLASS);
  });

  it('a mounted scene that has not painted yet leaves the hero dot alone', async () => {
    renderMount();
    await idle();
    await screen.findByTestId('scene');
    expect(document.documentElement).not.toHaveClass(SCENE_ON_CLASS);
  });

  it('WebGL2 painted by the CPU (software rendering) starts at the low level', async () => {
    vi.mocked(detectWebGL2).mockReturnValue('software');
    renderMount();
    await idle();
    expect(await screen.findByTestId('scene')).toHaveTextContent('low');
    expect(sceneLevel()).toBe('low');
    expect(document.documentElement).not.toHaveClass(NO_GL_CLASS);
  });

  it('a narrow window starts at the low level', async () => {
    vi.stubGlobal('innerWidth', 390);
    renderMount();
    await idle();
    expect(await screen.findByTestId('scene')).toHaveTextContent('low');
  });

  it('waits for requestIdleCallback where it exists, with a deadline', async () => {
    const requestIdleCallback = vi.fn((task: () => void) => setTimeout(task, 0));
    vi.stubGlobal('requestIdleCallback', requestIdleCallback);
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    renderMount();
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: IDLE_TIMEOUT_MS,
    });
    await idle();
    expect(sceneLevel()).toBe('high');
  });

  it('without WebGL2: no scene, the no-gl class and the notice, in the page language', async () => {
    vi.mocked(detectWebGL2).mockReturnValue('none');
    renderMount('/es');
    await idle();
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();
    expect(sceneLevel()).toBe('off');
    expect(document.documentElement).toHaveClass(NO_GL_CLASS);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tu navegador no puede mostrar el universo 3D, pero todo lo demás está aquí.',
    );
    expect(screen.getByRole('button', { name: 'Entendido' })).toBeInTheDocument();
  });

  it('the notice shows once per visit: «Got it» hides it for good', async () => {
    vi.mocked(detectWebGL2).mockReturnValue('none');
    renderMount();
    await userEvent.click(await screen.findByRole('button', { name: 'Got it' }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    // Que el aviso vuelva a tener turno (la sugerencia de idioma sale y se contesta) no lo hace volver:
    // descartarlo manda sobre el turno.
    act(() => {
      setLanguageNoticeOpen(true);
    });
    act(() => {
      setLanguageNoticeOpen(false);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(document.documentElement).toHaveClass(NO_GL_CLASS);
  });

  it('waits for the language suggestion to be answered: they never cover each other', async () => {
    vi.mocked(detectWebGL2).mockReturnValue('none');
    setLanguageNoticeOpen(true);
    renderMount();
    await idle();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    act(() => {
      setLanguageNoticeOpen(false);
    });
    expect(screen.getByRole('status')).toHaveTextContent(NOTICE_TEXT);
  });

  it('a scene that throws is logged and contained: the page stays, without WebGL', async () => {
    scene.behaviour = 'throw';
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderMount();
    await idle();
    expect(consoleError).toHaveBeenCalledWith(
      '[scene] The 3D scene failed; continuing without WebGL',
      expect.objectContaining({ message: 'WebGL context could not be created' }),
      expect.any(String),
    );
    expect(sceneLevel()).toBe('off');
    expect(screen.getByText('The page')).toBeInTheDocument();
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();
    expect(document.documentElement).toHaveClass(NO_GL_CLASS);
    expect(screen.getByRole('status')).toHaveTextContent(NOTICE_TEXT);
  });

  it('a scene that gives up (context lost, shader) is unmounted and the visit goes on without WebGL', async () => {
    scene.behaviour = 'fail';
    renderMount();
    await idle();
    expect(scene.levels).toEqual(['high']);
    expect(sceneLevel()).toBe('off');
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(NOTICE_TEXT);
  });

  it('unmounted before the browser is idle, it decides nothing', async () => {
    const { unmount } = render(
      <MemoryRouter>
        <SceneMount />
      </MemoryRouter>,
    );
    unmount();
    await idle();
    expect(detectWebGL2).not.toHaveBeenCalled();
    expect(sceneLevel()).toBeNull();
  });
});
