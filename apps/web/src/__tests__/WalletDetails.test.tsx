import { render, screen } from '@testing-library/react';
import { WalletDetails } from '../components/wallet/WalletDetails';
import { CardanoProvider } from '../contexts/CardanoContext';

describe('WalletDetails', () => {
  it('renders with default empty values and actions', () => {
    render(
      <CardanoProvider>
        <WalletDetails />
      </CardanoProvider>
    );

    expect(screen.getByLabelText(/wallet details/i)).toBeInTheDocument();
  expect(screen.getByText('Payment address')).toBeInTheDocument();
  expect(screen.getByText('Stake address')).toBeInTheDocument();
  expect(screen.getByText('Used addresses')).toBeInTheDocument();
  expect(screen.getByText('Unused addresses')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });
});
