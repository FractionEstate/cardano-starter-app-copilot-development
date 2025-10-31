import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../components/header/Header';
import { CardanoProvider } from '../contexts/CardanoContext';

jest.mock('../lib/lucid', () => ({
  initLucid: async () => ({
    selectWallet: { fromAPI: jest.fn() },
    wallet: {
      address: async () => 'addr_test1qpxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      getUtxos: async () => [
        { assets: { lovelace: 3_000_000n } },
        { assets: { lovelace: 2_500_000n } },
      ],
    },
  }),
}));

describe('Header balance display', () => {
  afterEach(() => {
    // cleanup cardano stub
    // @ts-ignore
    if (global.window) delete (global as any).window.cardano;
  });

  it('shows ADA balance after connecting', async () => {
    // Stub CIP-30 wallet
    (global as any).window = (global as any).window || {};
    (global as any).window.cardano = {
      nami: {
        enable: jest.fn(async () => ({
          getUsedAddresses: async () => [],
          getChangeAddress: async () => 'addr_test1qpxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        })),
      },
    };

    const user = userEvent.setup();
    render(
      <CardanoProvider>
        <Header />
      </CardanoProvider>
    );

    // Open modal
    const connectBtn = screen.getByRole('button', { name: /connect wallet/i });
    await user.click(connectBtn);

    // Click Nami to connect
    const nami = await screen.findByRole('button', { name: /nami/i });
    await user.click(nami);

    // Wait for disconnect button to appear (connected state)
    await waitFor(() => expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument());

    // Balance should be displayed (3.0 + 2.5) ADA = 5.500000 ADA
    expect(screen.getByText(/5\.500000 ADA/)).toBeInTheDocument();
  });
});
