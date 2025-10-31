import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../components/header/Header';
import { CardanoProvider } from '../contexts/CardanoContext';

describe('Header', () => {
  it('renders connect wallet and QR tab', async () => {
    const user = userEvent.setup();
    render(
      <CardanoProvider>
        <Header />
      </CardanoProvider>
    );

    const btn = screen.getByRole('button', { name: /connect wallet/i });
    expect(btn).toBeInTheDocument();

    await user.click(btn);
    expect(screen.getByRole('dialog', { name: /connect wallet/i })).toBeInTheDocument();

    const qrTab = screen.getByRole('button', { name: /connect via qr/i });
    await user.click(qrTab);

    const qr = screen.getByTestId('qr-code');
    expect(qr.tagName.toLowerCase()).toBe('svg');
  });

  it('closes the modal on Escape key', async () => {
    const user = userEvent.setup();
    render(
      <CardanoProvider>
        <Header />
      </CardanoProvider>
    );

    await user.click(screen.getByRole('button', { name: /connect wallet/i }));
    expect(screen.getByRole('dialog', { name: /connect wallet/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /connect wallet/i })).not.toBeInTheDocument();
  });
});
