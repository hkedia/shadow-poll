import { vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia for component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage with actual storage
const localStorageStore = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => localStorageStore.set(key, value)),
  removeItem: vi.fn((key: string) => localStorageStore.delete(key)),
  clear: vi.fn(() => localStorageStore.clear()),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Clear localStorage before each test
beforeEach(() => {
  localStorageStore.clear();
});

// Mock crypto.getRandomValues for invite code generation
// In jsdom, global.crypto exists but we need to mock getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    ...global.crypto,
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    subtle: {
      digest: async (algorithm: string, data: Uint8Array) => {
        // Simple mock SHA-256 - returns deterministic hash for testing
        const hash = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          hash[i] = (data[i % data.length] + i) % 256;
        }
        return hash;
      },
    },
  },
});
