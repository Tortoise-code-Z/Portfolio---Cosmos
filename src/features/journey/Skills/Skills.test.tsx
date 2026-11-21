import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { skillGroups } from '~/content/skills';
import type { SkillGroupId } from '~/content/types';
import { localize } from '~/lib/i18n/localize/localize';
import {
  selectActiveSkillGroup,
  setActiveSkillGroup,
  setSceneLevel,
  turnSceneOff,
  useUiStore,
} from '~/stores/uiStore/uiStore';

import { Skills } from './Skills';

function renderAt(path: string): () => void {
  const { unmount } = render(
    <MemoryRouter initialEntries={[path]}>
      <Skills />
    </MemoryRouter>,
  );
  return unmount;
}

/** El `<li>` de un grupo del panel (lo nombra su título cuando la escena está encendida). */
function groupItem(id: SkillGroupId): HTMLElement {
  const title = document.getElementById(`skills-group-${id}`);
  const item = title?.closest('li');
  if (item === null || item === undefined) throw new Error(`no group ${id}`);
  return item;
}

function lit(): SkillGroupId | null {
  return selectActiveSkillGroup(useUiStore.getState());
}

/**
 * jsdom no sabe de dónde viene el foco (`:focus-visible` no distingue teclado de puntero): el test lo dice. Lo de
 * verdad (clic, otra pestaña y volver) lo prueba `constellations.spec.ts` en el navegador.
 */
function focusFromKeyboard(fromKeyboard: boolean): void {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- el original, para llamarlo con su `this` (`call`)
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector) {
    return selector === ':focus-visible' ? fromKeyboard : matches.call(this, selector);
  });
}

/** El CSS del capítulo, tal cual (jsdom no aplica `@media` ni `:hover`). */
function styles(): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Skills.module.css'), 'utf8');
}

afterEach(() => {
  vi.restoreAllMocks();
  useUiStore.setState(useUiStore.getInitialState(), true);
});

describe('Skills', () => {
  it.each(['en', 'es'] as const)('%s: every skill appears exactly once, in its group', (locale) => {
    renderAt(locale === 'en' ? '/' : '/es');
    for (const group of skillGroups) {
      const list = screen.getByRole('list', { name: localize(locale, group.title) });
      const items = within(list).getAllByRole('listitem');
      expect(items.map((item) => item.textContent)).toEqual(
        group.skills.map((skill) => localize(locale, skill.label)),
      );
    }
    const total = skillGroups.reduce((sum, group) => sum + group.skills.length, 0);
    const allSkills = skillGroups.flatMap((group) =>
      group.skills.map((skill) => localize(locale, skill.label)),
    );
    expect(new Set(allSkills).size).toBe(total);
  });

  it('region #skills with the lead and both instructions in the HTML (CSS picks one, or none without the scene)', () => {
    renderAt('/');
    const region = screen.getByRole('region', { name: 'My galaxy of tools' });
    expect(region).toHaveAttribute('id', 'skills');
    const lead = within(region).getByText(/^Each star is a technology I use\./);
    expect(lead.tagName).toBe('P');
    expect(
      within(lead).getByText('Hover a group to light up its constellation.'),
    ).toBeInTheDocument();
    expect(
      within(lead).getByText('Tap a group to light up its constellation.'),
    ).toBeInTheDocument();
    expect(styles()).toMatch(
      /:global\(\.no-gl\) \.leadPointer,\n:global\(\.no-gl\) \.leadTouch \{\n {2}display: none;/,
    );
  });

  it('group titles are h3 in reading order', () => {
    renderAt('/');
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(
      skillGroups.map((group) => group.title.en),
    );
  });

  it('amber means lit: with the scene, only `data-hot` paints it (the keyboard focus shows its ring); without it, hover (CSS)', () => {
    const css = styles();
    expect(css).not.toContain('.group:focus-visible');
    expect(css).toContain('\n.group[data-hot] {\n  border-color: var(--color-star);');
    expect(css).not.toMatch(/\n\.group:hover/);
    // El `:hover` sin escena, solo donde se puede pasar por encima: en táctil se queda pegado tras el toque.
    const hover = css.indexOf('.group:not([tabindex]):hover');
    expect(css.lastIndexOf('@media (hover: hover) {', hover)).toBeGreaterThan(
      css.lastIndexOf('}\n}', hover),
    );
    expect(css.match(/\.group:not\(\[tabindex\]\):hover/g)).toHaveLength(2);
  });

  it('in Windows high contrast, the lit group is painted with Highlight (the system evens out its colours)', () => {
    expect(styles()).toContain(
      '@media (forced-colors: active) {\n  .group[data-hot] {\n    border-color: Highlight;\n  }\n\n  .group[data-hot] .groupTitle {\n    color: Highlight;',
    );
  });

  it('lets the mouse through to the scene labels: the panel is the only child of the chapter (the only one that takes it)', () => {
    renderAt('/');
    const region = screen.getByRole('region', { name: 'My galaxy of tools' });
    expect(region.children).toHaveLength(1);
  });

  describe('without the scene (no level yet, or no WebGL)', () => {
    it.each([
      ['no level yet', (): void => undefined],
      ['no WebGL', turnSceneOff],
    ] as const)('%s: groups are not focusable and no gesture lights anything', (_, setUp) => {
      setUp();
      renderAt('/');
      for (const group of skillGroups) {
        const item = groupItem(group.id);
        expect(item).not.toHaveAttribute('tabindex');
        expect(item).not.toHaveAttribute('aria-labelledby');
        fireEvent.pointerEnter(item, { pointerType: 'mouse' });
        fireEvent.focus(item);
        fireEvent.click(item);
        expect(item).not.toHaveAttribute('data-hot');
      }
      expect(lit()).toBeNull();
    });
  });

  describe('with the scene on', () => {
    it('every group is focusable and named by its title', () => {
      setSceneLevel('high');
      renderAt('/');
      for (const group of skillGroups) {
        const item = groupItem(group.id);
        expect(item).toHaveAttribute('tabindex', '0');
        expect(item).toHaveAccessibleName(group.title.en);
      }
    });

    it('the mouse lights a group on entering and lets it go on leaving (touch and pen enter nothing)', () => {
      setSceneLevel('high');
      renderAt('/');
      const web = groupItem('web');
      fireEvent.pointerEnter(web, { pointerType: 'touch' });
      fireEvent.pointerEnter(web, { pointerType: 'pen' });
      expect(lit()).toBeNull();
      fireEvent.pointerEnter(web, { pointerType: 'mouse' });
      expect(lit()).toBe('web');
      expect(web).toHaveAttribute('data-hot', '');
      fireEvent.pointerLeave(web, { pointerType: 'touch' });
      expect(lit()).toBe('web');
      fireEvent.pointerLeave(web, { pointerType: 'mouse' });
      expect(lit()).toBeNull();
      expect(web).not.toHaveAttribute('data-hot');
    });

    it('the last gesture wins: leaving a group that is no longer lit keeps the other one', () => {
      setSceneLevel('high');
      focusFromKeyboard(true);
      renderAt('/');
      fireEvent.focus(groupItem('tools'));
      fireEvent.pointerEnter(groupItem('ai'), { pointerType: 'mouse' });
      expect(lit()).toBe('ai');
      fireEvent.blur(groupItem('tools'));
      expect(lit()).toBe('ai');
      expect(groupItem('ai')).toHaveAttribute('data-hot', '');
      expect(groupItem('tools')).not.toHaveAttribute('data-hot');
    });

    it('the last gesture wins: the mouse leaving a group lets only that one go, not the one the keyboard lit after', () => {
      setSceneLevel('high');
      focusFromKeyboard(true);
      renderAt('/');
      fireEvent.pointerEnter(groupItem('ai'), { pointerType: 'mouse' });
      expect(lit()).toBe('ai');
      fireEvent.focus(groupItem('tools'));
      expect(lit()).toBe('tools');
      fireEvent.pointerLeave(groupItem('ai'), { pointerType: 'mouse' });
      expect(lit()).toBe('tools');
    });

    it('focus lights a group and losing it lets it go', () => {
      setSceneLevel('medium');
      focusFromKeyboard(true);
      // En jsdom, `blur()` deja el documento «sin foco»; en un navegador sigue teniéndolo (la ventana no se ha ido).
      vi.spyOn(document, 'hasFocus').mockReturnValue(true);
      renderAt('/');
      const libraries = groupItem('libraries');
      act(() => {
        libraries.focus();
      });
      expect(lit()).toBe('libraries');
      act(() => {
        groupItem('tools').focus();
      });
      expect(lit()).toBe('tools');
      act(() => {
        groupItem('tools').blur();
      });
      expect(lit()).toBeNull();
    });

    it('focus moving inside the group does not let it go', () => {
      setSceneLevel('high');
      focusFromKeyboard(true);
      renderAt('/');
      const web = groupItem('web');
      fireEvent.focus(web);
      fireEvent.blur(web, { relatedTarget: within(web).getByRole('heading', { level: 3 }) });
      expect(lit()).toBe('web');
    });

    it('only the keyboard focus lights: the pointer focus, or the one the browser gives back on returning to the tab, does not', () => {
      setSceneLevel('high');
      focusFromKeyboard(false);
      renderAt('/');
      act(() => {
        groupItem('web').focus();
      });
      expect(lit()).toBeNull();
    });

    it('leaving the window is not letting go: a blur while the document has no focus keeps the group', () => {
      setSceneLevel('high');
      focusFromKeyboard(true);
      renderAt('/');
      const tools = groupItem('tools');
      act(() => {
        tools.focus();
      });
      expect(lit()).toBe('tools');
      vi.spyOn(document, 'hasFocus').mockReturnValue(false);
      fireEvent.blur(tools);
      expect(lit()).toBe('tools');
    });

    it('a tap lights a group, another tap switches, a tap outside turns it off', () => {
      setSceneLevel('low');
      renderAt('/');
      fireEvent.click(groupItem('web'));
      expect(lit()).toBe('web');
      fireEvent.click(within(groupItem('ai')).getAllByRole('listitem')[0] ?? groupItem('ai'));
      expect(lit()).toBe('ai');
      fireEvent.click(groupItem('ai'));
      expect(lit()).toBe('ai');
      fireEvent.click(screen.getByRole('heading', { level: 2 }));
      expect(lit()).toBeNull();
      fireEvent.click(groupItem('tools'));
      fireEvent.click(document.body);
      expect(lit()).toBeNull();
    });

    it('a swipe (no click) does not turn it off', () => {
      setSceneLevel('low');
      renderAt('/');
      fireEvent.click(groupItem('web'));
      fireEvent.pointerDown(document.body, { pointerType: 'touch' });
      fireEvent.pointerMove(document.body, { pointerType: 'touch' });
      fireEvent.pointerUp(document.body, { pointerType: 'touch' });
      fireEvent.scroll(window);
      expect(lit()).toBe('web');
    });

    it('a group lit from the scene (a label) is marked in the panel', () => {
      setSceneLevel('high');
      renderAt('/');
      act(() => {
        setActiveSkillGroup('libraries');
      });
      expect(groupItem('libraries')).toHaveAttribute('data-hot', '');
    });

    it('turns the group off when the journey goes away (a project page) or the scene turns off', () => {
      setSceneLevel('high');
      const unmount = renderAt('/');
      fireEvent.click(groupItem('web'));
      unmount();
      expect(lit()).toBeNull();

      renderAt('/');
      fireEvent.click(groupItem('ai'));
      expect(lit()).toBe('ai');
      act(() => {
        turnSceneOff();
      });
      expect(lit()).toBeNull();
      expect(groupItem('ai')).not.toHaveAttribute('tabindex');
      fireEvent.click(groupItem('ai'));
      expect(lit()).toBeNull();
    });

    it('if the scene turns off with the focus on a group, the focus goes to the chapter title (not to body)', () => {
      setSceneLevel('high');
      renderAt('/');
      act(() => {
        groupItem('tools').focus();
      });
      act(() => {
        turnSceneOff();
      });
      expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }));
    });

    it('leaving the journey with the focus on a group does not move it (the new page places it)', () => {
      setSceneLevel('high');
      const unmount = renderAt('/');
      const tools = groupItem('tools');
      act(() => {
        tools.focus();
      });
      const focus = vi.spyOn(HTMLElement.prototype, 'focus');
      unmount();
      expect(focus).not.toHaveBeenCalled();
    });
  });
});
