import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Home from './page';

describe('Home', () => {
  it('shows the three product workspaces with correct availability', async () => {
    render(await Home());

    expect(
      screen.getByRole('link', { name: /AI development loop/i }),
    ).toHaveAttribute('href', '/development-loop');
    expect(
      screen.getByRole('link', { name: /Tax operations mapper/i }),
    ).toHaveAttribute('href', '/workflow');
    expect(screen.getByText('Creative generation')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: /Creative generation/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Next')).toBeVisible();
  });
});
