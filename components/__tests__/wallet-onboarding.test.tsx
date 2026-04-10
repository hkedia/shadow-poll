import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WalletOnboarding } from "@/components/wallet-onboarding";
import type { WalletContextValue } from "@/lib/midnight/types";

// Mock the wallet context
const mockConnect = vi.fn();
let mockWalletContext: Partial<WalletContextValue>;

vi.mock("@/lib/midnight/wallet-context", () => ({
  useWalletContext: () => mockWalletContext,
}));

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

function renderOnboarding(overrides: Partial<WalletContextValue> = {}) {
  mockWalletContext = {
    status: "not_detected",
    error: null,
    address: null,
    truncatedAddress: null,
    shieldedAddresses: null,
    providers: null,
    isDetected: false,
    connect: mockConnect,
    disconnect: vi.fn(),
    ...overrides,
  };
  return render(<WalletOnboarding />);
}

describe("WalletOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
  });

  it("renders install prompt when status is not_detected", () => {
    renderOnboarding({ status: "not_detected" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("1am.xyz Wallet Required")).toBeInTheDocument();
    expect(screen.getByText("Install 1am.xyz")).toBeInTheDocument();
    // Dismiss button with X icon
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });

  it("renders error message when status is error", () => {
    renderOnboarding({ status: "error", error: "Connection timed out" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    expect(screen.getByText("Connection timed out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });

  it("renders connect wallet prompt when status is disconnected", () => {
    renderOnboarding({ status: "disconnected" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Connect Your Wallet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });

  it("renders nothing when status is connected", () => {
    renderOnboarding({ status: "connected" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders nothing when status is idle", () => {
    renderOnboarding({ status: "idle" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hides banner after dismissing and persists per-state in sessionStorage", () => {
    renderOnboarding({ status: "not_detected" });
    // Banner visible initially
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Click dismiss
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    // Banner gone
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Check sessionStorage was set
    expect(sessionStorageMock.getItem("wallet-banner-dismissed-not_detected")).toBe("true");

    // Re-render with same state — still hidden
    renderOnboarding({ status: "not_detected" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows banner for new wallet state after dismissing previous state", () => {
    // Start with not_detected
    renderOnboarding({ status: "not_detected" });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Dismiss it
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // State changes to disconnected — new banner should appear
    renderOnboarding({ status: "disconnected" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Connect Your Wallet")).toBeInTheDocument();
  });
});