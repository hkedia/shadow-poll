/**
 * Tests for health-handler.ts
 * 
 * Verifies the health check endpoint behavior.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Hono } from 'hono';
import { healthRoutes } from '@/lib/api/health-handler';

vi.mock('@/lib/db/client', () => ({
  sql: vi.fn(),
}));

import { sql } from '@/lib/db/client';

describe('health-handler', () => {
  const app = new Hono();
  app.route('/', healthRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 when database is healthy', async () => {
    (sql as unknown as Mock).mockResolvedValue([{ now: new Date() }]);

    const res = await app.request('/api/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('status', 'healthy');
    expect(body).toHaveProperty('timestamp');
  });

  it('should return 503 when database is unreachable', async () => {
    (sql as unknown as Mock).mockRejectedValue(new Error('Connection failed'));

    const res = await app.request('/api/health');
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body).toHaveProperty('status', 'degraded');
    expect(body).toHaveProperty('timestamp');
  });

  it('should include CORS headers', async () => {
    (sql as unknown as Mock).mockResolvedValue([{ now: new Date() }]);

    const res = await app.request('/api/health');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should call database health check', async () => {
    (sql as unknown as Mock).mockResolvedValue([{ now: new Date() }]);

    await app.request('/api/health');

    expect(sql).toHaveBeenCalledWith(['SELECT 1']);
  });
});
