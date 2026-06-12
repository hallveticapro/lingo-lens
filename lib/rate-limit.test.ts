import { describe, expect, it } from "vitest";
import { loginThrottleDecision, nextLoginFailureSnapshot, type LoginThrottleSnapshot } from "@/lib/rate-limit";

describe("login throttle state", () => {
  const start = new Date("2026-06-12T12:00:00.000Z");

  it("allows attempts when no lock is active", () => {
    expect(loginThrottleDecision(null, start)).toEqual({ allowed: true, retryAt: null });
  });

  it("blocks attempts until the lock window expires", () => {
    const lockedUntil = new Date(start.getTime() + 60_000);
    const state: LoginThrottleSnapshot = {
      failedCount: 5,
      windowStartedAt: start,
      lockedUntil
    };

    expect(loginThrottleDecision(state, start)).toEqual({ allowed: false, retryAt: lockedUntil });
    expect(loginThrottleDecision(state, new Date(lockedUntil.getTime() + 1))).toEqual({
      allowed: true,
      retryAt: null
    });
  });

  it("locks on the fifth failed attempt inside the window", () => {
    const state: LoginThrottleSnapshot = {
      failedCount: 4,
      windowStartedAt: start,
      lockedUntil: null
    };
    const next = nextLoginFailureSnapshot(state, new Date(start.getTime() + 1000));

    expect(next.failedCount).toBe(5);
    expect(next.lockedUntil).toBeInstanceOf(Date);
  });

  it("resets the failed count after the throttle window", () => {
    const state: LoginThrottleSnapshot = {
      failedCount: 4,
      windowStartedAt: start,
      lockedUntil: null
    };
    const next = nextLoginFailureSnapshot(state, new Date(start.getTime() + 16 * 60 * 1000));

    expect(next.failedCount).toBe(1);
    expect(next.lockedUntil).toBeNull();
  });
});
