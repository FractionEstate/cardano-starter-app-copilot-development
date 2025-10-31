import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './header/Header';

describe('Header', () => {
  it('renders connect wallet button and opens modal with QR option', async () => {
    const user = userEvent.setup();
    render(<Header />);

    // Button present
    const btn = screen.getByRole('button', { name: /connect wallet/i });
    expect(btn).toBeInTheDocument();

    // Open modal
    await user.click(btn);
    expect(screen.getByRole('dialog', { name: /connect wallet/i })).toBeInTheDocument();

    // Switch to QR mode
    const qrTab = screen.getByRole('button', { name: /connect via qr/i });
    await user.click(qrTab);

    // Expect QR element present (rendered as svg)
    const qr = screen.getByTestId('qr-code');
    expect(qr.tagName.toLowerCase()).toBe('svg');
  });
});
