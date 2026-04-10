/**
 * Tests for lib/utils.ts
 * 
 * Verifies utility functions including class name merging, date formatting,
 * address truncation, and block number formatting.
 */

import { describe, it, expect } from 'vitest';
import {
  cn,
  blockToApproximateDate,
  formatExpirationDate,
  formatRelativeTime,
} from '@/lib/utils';

describe('utils', () => {
  describe('cn (classNames utility)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'active', false && 'inactive');
      expect(result).toBe('base active');
    });

    it('should handle object syntax', () => {
      const result = cn('base', { active: true, disabled: false });
      expect(result).toBe('base active');
    });

    it('should filter out falsy values', () => {
      const result = cn('base', null, undefined, '', 'valid');
      expect(result).toBe('base valid');
    });

    it('should merge tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      // tailwind-merge should deduplicate padding classes
      expect(result).toContain('px-4');
      expect(result).not.toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle single class', () => {
      const result = cn('only-class');
      expect(result).toBe('only-class');
    });

    it('should handle complex class merging', () => {
      const result = cn(
        'bg-blue-500 text-white',
        'hover:bg-blue-600',
        { 'opacity-50': true, 'cursor-not-allowed': true }
      );
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
      expect(result).toContain('hover:bg-blue-600');
      expect(result).toContain('opacity-50');
      expect(result).toContain('cursor-not-allowed');
    });
  });

  describe('blockToApproximateDate', () => {
    it('should convert block number to future date', () => {
      const currentBlock = 1000n;
      const targetBlock = 2000n;
      
      const date = blockToApproximateDate(targetBlock, currentBlock);
      
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle same block number', () => {
      const block = 1000n;
      
      const date = blockToApproximateDate(block, block);
      
      // Should be approximately now (within 1 second)
      expect(date.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('should calculate correct duration', () => {
      // Assuming 10 seconds per block
      const currentBlock = 100n;
      const targetBlock = 106n; // 1 minute = 6 blocks * 10 seconds
      
      const date = blockToApproximateDate(targetBlock, currentBlock);
      const expectedMs = 6 * 10 * 1000; // 6 blocks * 10 seconds * 1000ms
      
      // Allow for some timing variance
      expect(date.getTime() - Date.now()).toBeGreaterThan(expectedMs - 100);
      expect(date.getTime() - Date.now()).toBeLessThan(expectedMs + 1000);
    });

    it('should handle past blocks', () => {
      const currentBlock = 2000n;
      const targetBlock = 1000n; // Already passed
      
      const date = blockToApproximateDate(targetBlock, currentBlock);
      
      // Should be in the past
      expect(date.getTime()).toBeLessThan(Date.now());
    });

    it('should handle large block numbers', () => {
      const currentBlock = 1000000n;
      const targetBlock = 2000000n;
      
      const date = blockToApproximateDate(targetBlock, currentBlock);
      
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });

  describe('formatExpirationDate', () => {
    it('should format date to readable string', () => {
      const date = new Date('2026-04-10T12:00:00Z');
      const result = formatExpirationDate(date);
      
      expect(result).toContain('Apr');
      expect(result).toContain('10');
    });

    it('should include year for different year', () => {
      const nextYear = new Date().getFullYear() + 1;
      const date = new Date(`${nextYear}-04-10T12:00:00Z`);
      const result = formatExpirationDate(date);
      
      expect(result).toContain(nextYear.toString());
    });

    it('should not include year for current year', () => {
      const currentYear = new Date().getFullYear();
      const date = new Date(`${currentYear}-04-10T12:00:00Z`);
      const result = formatExpirationDate(date);
      
      // Should be format like "Apr 10"
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
    });

    it('should return empty string for invalid date', () => {
      const invalidDate = new Date(NaN);
      const result = formatExpirationDate(invalidDate);
      
      expect(result).toBe('');
    });

    it('should handle epoch date', () => {
      const epoch = new Date(0);
      const result = formatExpirationDate(epoch);
      
      expect(result).toContain('Jan');
      expect(result).toContain('1');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format days', () => {
      const result = formatRelativeTime(86400); // 1 day
      expect(result).toBe('~1 day left');
    });

    it('should format multiple days', () => {
      const result = formatRelativeTime(172800); // 2 days
      expect(result).toBe('~2 days left');
    });

    it('should format hours', () => {
      const result = formatRelativeTime(3600); // 1 hour
      expect(result).toBe('~1 hour left');
    });

    it('should format multiple hours', () => {
      const result = formatRelativeTime(7200); // 2 hours
      expect(result).toBe('~2 hours left');
    });

    it('should format minutes', () => {
      const result = formatRelativeTime(300); // 5 minutes
      expect(result).toBe('~5 min left');
    });

    it('should use minimum 1 minute', () => {
      const result = formatRelativeTime(0);
      expect(result).toBe('~1 min left');
    });

    it('should handle small seconds as 1 minute', () => {
      const result = formatRelativeTime(30); // 30 seconds
      expect(result).toBe('~1 min left');
    });

    it('should prefer days over hours', () => {
      const result = formatRelativeTime(90000); // 25 hours
      expect(result).toBe('~1 day left');
    });

    it('should prefer hours over minutes', () => {
      const result = formatRelativeTime(3660); // 1 hour 1 minute
      expect(result).toBe('~1 hour left');
    });
  });
});
