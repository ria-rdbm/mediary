import { createResilientFetch } from '@/lib/resilientFetch';

const ok = () => new Response('ok');

function setup(baseFetch: jest.Mock, startAt = 0) {
  let clock = startAt;
  const fetchWithRetry = createResilientFetch({
    baseFetch: baseFetch as unknown as typeof fetch,
    warmUpUrl: 'https://example.test/health',
    idleMs: 20_000,
    now: () => clock,
  });
  return { fetchWithRetry, advance: (ms: number) => (clock += ms) };
}

describe('createResilientFetch', () => {
  it('sends requests straight through while traffic is recent', async () => {
    const baseFetch = jest.fn().mockResolvedValue(ok());
    const { fetchWithRetry, advance } = setup(baseFetch);
    advance(5_000);
    await fetchWithRetry('https://example.test/rest/v1/a', { method: 'POST' });
    expect(baseFetch).toHaveBeenCalledTimes(1);
  });

  it('warms up the connection first after a quiet spell, and survives a failed warm-up', async () => {
    const baseFetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('The network connection was lost.'))
      .mockResolvedValue(ok());
    const { fetchWithRetry, advance } = setup(baseFetch);
    advance(60_000);
    await expect(fetchWithRetry('https://example.test/rest/v1/a', { method: 'POST' })).resolves.toBeDefined();
    expect(baseFetch).toHaveBeenCalledTimes(2);
    expect(baseFetch.mock.calls[0][0]).toBe('https://example.test/health');
    expect(baseFetch.mock.calls[1][0]).toBe('https://example.test/rest/v1/a');
  });

  it('retries a failed read once', async () => {
    const baseFetch = jest.fn().mockRejectedValueOnce(new Error('lost')).mockResolvedValue(ok());
    const { fetchWithRetry } = setup(baseFetch);
    await expect(fetchWithRetry('https://example.test/rest/v1/a')).resolves.toBeDefined();
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it('never retries a failed write', async () => {
    const baseFetch = jest.fn().mockRejectedValue(new Error('lost'));
    const { fetchWithRetry } = setup(baseFetch);
    await expect(fetchWithRetry('https://example.test/rest/v1/a', { method: 'POST' })).rejects.toThrow('lost');
    expect(baseFetch).toHaveBeenCalledTimes(1);
  });
});
