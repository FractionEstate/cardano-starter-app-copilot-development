import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { WalletModal } from '../components/wallet/WalletModal';
import { CardanoProvider } from '../contexts/CardanoContext';

describe('WalletModal', () => {
  afterEach(() => {
    if ((global as any).window && (global as any).window.cardano) {
      delete (global as any).window.cardano;
    }
    cleanup();
  });

  function renderWithProvider(ui: React.ReactElement): void {
    render(
      <CardanoProvider>
        {ui}
      </CardanoProvider>
    );
  }

  it('shows message when no wallets detected', () => {
    // No window.cardano
    renderWithProvider(<WalletModal open />);
    expect(screen.getByText(/No compatible wallets detected/i)).toBeInTheDocument();
  });

  it('lists detected wallets and connects on click', async () => {
    // Mock balance fetch to avoid errors during connect
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ success: true, lovelace: '0' }) })) as unknown as typeof fetch;

    // Stub CIP-30 for nami
    (global as any).window = (global as any).window || {};
    (global as any).window.cardano = {
      nami: {
        enable: jest.fn(async () => ({
          getUsedAddresses: async () => [],
          getChangeAddress: async () => 'addr_test1qpxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        })),
      },
    };

    // Listen for modal close event
    const closed = { count: 0 };
    const handler = () => { closed.count += 1; };
    window.addEventListener('wallet:modal:close', handler);
    renderWithProvider(<WalletModal open />);

    // Button for Nami should appear
    const btn = await screen.findByRole('button', { name: /nami/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(closed.count).toBeGreaterThan(0);
    });

    // Verify enable was called
    expect(((global as any).window.cardano.nami.enable as jest.Mock)).toHaveBeenCalled();

    window.removeEventListener('wallet:modal:close', handler);
  });
});
