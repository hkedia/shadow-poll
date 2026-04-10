/**
 * Tests for metadata-handler.ts
 * 
 * Verifies the poll metadata API endpoints.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Hono } from 'hono';
import { metadataRoutes } from './metadata-handler';

vi.mock('@/lib/db/client', () => ({
  sql: vi.fn(),
}));

vi.mock('@/lib/db/migrations', () => ({
  runMigrations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/midnight/metadata-store', () => ({
  validatePollMetadata: vi.fn().mockReturnValue(null),
  validateMetadataHash: vi.fn().mockResolvedValue(true),
}));

import { sql } from '@/lib/db/client';
import { runMigrations } from '@/lib/db/migrations';
import { validatePollMetadata, validateMetadataHash } from '@/lib/midnight/metadata-store';

describe('metadata-handler', () => {
  const app = new Hono();
  app.route('/', metadataRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/polls/metadata', () => {
    it('should return metadata for specific poll', async () => {
      const mockMetadata = {
        poll_id: 'poll123',
        title: 'Test Poll',
        description: 'Test Description',
        options: ['Option 1', 'Option 2'],
        metadata_hash: 'hash123',
        created_at: new Date().toISOString(),
      };

      (sql as unknown as Mock).mockResolvedValue([mockMetadata]);

      const res = await app.request('/api/polls/metadata?pollId=poll123');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('pollId', 'poll123');
      expect(body.metadata).toHaveProperty('title', 'Test Poll');
    });

    it('should return 404 for non-existent poll', async () => {
      (sql as unknown as Mock).mockResolvedValue([]);

      const res = await app.request('/api/polls/metadata?pollId=nonexistent');
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid pollId format', async () => {
      const res = await app.request('/api/polls/metadata?pollId=invalid-format');
      expect(res.status).toBe(400);
    });

    it('should return all polls when no pollId provided', async () => {
      const mockPolls = [
        { poll_id: 'poll1', title: 'Poll 1', options: ['A'], metadata_hash: 'hash1', created_at: '2024-01-01' },
        { poll_id: 'poll2', title: 'Poll 2', options: ['B'], metadata_hash: 'hash2', created_at: '2024-01-02' },
      ];

      (sql as unknown as Mock).mockResolvedValue(mockPolls);

      const res = await app.request('/api/polls/metadata');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
    });

    it('should handle database errors', async () => {
      (runMigrations as Mock).mockRejectedValue(new Error('DB unavailable'));

      const res = await app.request('/api/polls/metadata');
      expect(res.status).toBe(503);
    });
  });

  describe('POST /api/polls/metadata', () => {
    it('should create new metadata', async () => {
      (sql as unknown as Mock).mockResolvedValue([{ poll_id: 'newpoll' }]);

      const res = await app.request('/api/polls/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: 'newpoll',
          metadata: {
            title: 'New Poll',
            description: 'Description',
            options: ['A', 'B', 'C'],
            createdAt: new Date().toISOString(),
          },
          metadataHash: 'hashnew',
        }),
      });

      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body).toHaveProperty('success', true);
    });

    it('should update existing metadata (idempotent)', async () => {
      (sql as unknown as Mock)
        .mockResolvedValueOnce([{ poll_id: 'existing' }]) // Conflict check
        .mockResolvedValueOnce([{ poll_id: 'existing' }]); // Update

      const res = await app.request('/api/polls/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: 'existing',
          metadata: {
            title: 'Updated Title',
            description: 'Updated Description',
            options: ['X', 'Y'],
            createdAt: new Date().toISOString(),
          },
          metadataHash: 'hashupdated',
        }),
      });

      expect(res.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const res = await app.request('/api/polls/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Missing pollId' }),
      });

      expect(res.status).toBe(400);
    });

    it('should validate pollId format', async () => {
      const res = await app.request('/api/polls/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: 'invalid',
          metadata: { title: 'Test', description: 'Test', options: ['A'], createdAt: new Date().toISOString() },
          metadataHash: 'hash',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should validate metadata content', async () => {
      (validatePollMetadata as Mock).mockReturnValue('Title is too long');

      const res = await app.request('/api/polls/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: 'abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd',
          metadata: {
            title: '',
            description: 'Test',
            options: ['A'],
            createdAt: new Date().toISOString(),
          },
          metadataHash: 'hash',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should validate metadata hash', async () => {
      (validateMetadataHash as Mock).mockResolvedValue(false);

      const res = await app.request('/api/polls/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: 'abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd',
          metadata: {
            title: 'Test',
            description: 'Test',
            options: ['A'],
            createdAt: new Date().toISOString(),
          },
          metadataHash: 'wronghash',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should handle invalid JSON', async () => {
      const res = await app.request('/api/polls/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      expect(res.status).toBe(400);
    });

    it('should handle database errors', async () => {
      (sql as unknown as Mock).mockRejectedValue(new Error('DB error'));

      const res = await app.request('/api/polls/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: 'abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd',
          metadata: {
            title: 'Test',
            description: 'Test',
            options: ['A'],
            createdAt: new Date().toISOString(),
          },
          metadataHash: 'hash',
        }),
      });

      expect(res.status).toBe(503);
    });
  });
});
