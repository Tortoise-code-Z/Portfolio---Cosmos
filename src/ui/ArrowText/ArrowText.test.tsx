import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArrowText } from './ArrowText';

describe('ArrowText', () => {
  it('pinta cada «→» con el icono y la deja para el lector', () => {
    const { container } = render(
      <p>
        <ArrowText text="Go to Courses → All courses → First" />
      </p>,
    );
    const paragraph = container.querySelector('p');
    expect(paragraph?.querySelectorAll('svg')).toHaveLength(2);
    // El texto completo, flechas incluidas, sigue en el DOM (lo lee el lector de pantalla).
    expect(paragraph).toHaveTextContent('Go to Courses → All courses → First');
  });

  it('un texto sin flechas sale tal cual, sin iconos', () => {
    const { container } = render(
      <p>
        <ArrowText text="Log in with the demo account." />
      </p>,
    );
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('p')).toHaveTextContent('Log in with the demo account.');
  });

  it('la flecha visible es solo el icono: el carácter va oculto a la vista', () => {
    const { container } = render(<ArrowText text="A → B" />);
    const hidden = [...container.querySelectorAll('span')].filter((s) => s.textContent === '→');
    expect(hidden).toHaveLength(1);
    expect(hidden[0]?.className).toMatch(/hidden/);
  });
});
