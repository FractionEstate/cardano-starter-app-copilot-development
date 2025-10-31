import { render, screen, waitFor } from '@testing-library/react';
import { StatusBanner } from '../components/common/StatusBanner';

describe('StatusBanner', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('shows banner when not ready', async () => {
    jest.useFakeTimers();
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({ ready: false, ogmiosReachable: false, kupoReachable: false, dolosRestHealthy: false }) })) as unknown as typeof fetch;
    render(<StatusBanner />);
    // allow effect to run
    await waitFor(() => expect(screen.getByText(/Not Ready/i)).toBeInTheDocument());
    expect(screen.getByText(/Cardano providers are not fully ready/i)).toBeInTheDocument();
  });

  it('renders nothing when ready', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ ready: true }) })) as unknown as typeof fetch;
    const { container } = render(<StatusBanner />);
    await waitFor(() => {
      // no banner role rendered
      expect(container.querySelector('[role="status"]')).toBeNull();
    });
  });
});
