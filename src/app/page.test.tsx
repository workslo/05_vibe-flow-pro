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
      screen.getByRole('link', { name: /Creative generation/i }),
    ).toHaveAttribute('href', '/workflow');
    expect(
      screen.getByRole('link', { name: /Tax operations mapper/i }),
    ).toHaveAttribute('href', '/tax-ops-mapper');
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });
});
