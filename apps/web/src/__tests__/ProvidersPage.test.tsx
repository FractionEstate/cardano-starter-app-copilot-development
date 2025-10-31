import { render, screen, waitFor } from '@testing-library/react';
import ProvidersPage from '../app/providers/page';

describe('ProvidersPage', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders status and readiness JSON blocks', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      if (url.includes('/cardano/status')) {
        return { ok: true, json: async () => ({ success: true, ready: false }) } as any;
      }
      if (url.includes('/cardano/readiness')) {
        return { ok: true, json: async () => ({ success: false, ready: false }) } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    }) as unknown as typeof fetch;

    render(<ProvidersPage />);
    await waitFor(() => {
      expect(screen.getByText(/Providers/i)).toBeInTheDocument();
      expect(screen.getByLabelText('status-json')).toBeInTheDocument();
      expect(screen.getByLabelText('readiness-json')).toBeInTheDocument();
    });
  });
});
