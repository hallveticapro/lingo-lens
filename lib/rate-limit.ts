import { createHmac } from "node:crypto";
import { authSecret } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const maxLoginFailures = 5;
const loginWindowMs = 15 * 60 * 1000;
const loginLockMs = 15 * 60 * 1000;

export type LoginThrottleSnapshot = {
  failedCount: number;
  windowStartedAt: Date;
  lockedUntil: Date | null;
};

export function loginThrottleDecision(snapshot: LoginThrottleSnapshot | null, now = new Date()) {
  if (snapshot?.lockedUntil && snapshot.lockedUntil > now) {
    return { allowed: false, retryAt: snapshot.lockedUntil };
  }
  return { allowed: true, retryAt: null };
}

export function nextLoginFailureSnapshot(snapshot: LoginThrottleSnapshot | null, now = new Date()) {
  const windowExpired = !snapshot || now.getTime() - snapshot.windowStartedAt.getTime() > loginWindowMs;
  const failedCount = windowExpired ? 1 : snapshot.failedCount + 1;
  return {
    failedCount,
    windowStartedAt: windowExpired ? now : snapshot.windowStartedAt,
    lastAttemptAt: now,
    lockedUntil: failedCount >= maxLoginFailures ? new Date(now.getTime() + loginLockMs) : null
  };
}

export function clientIpFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function ipHash(ip: string) {
  return createHmac("sha256", authSecret()).update(ip).digest("hex");
}

export async function checkAdminLoginThrottle(email: string, ip: string) {
  const record = await prisma.adminLoginThrottle.findUnique({
    where: {
      email_ipHash: {
        email: normalizedEmail(email),
        ipHash: ipHash(ip)
      }
    }
  });

  return loginThrottleDecision(record);
}

export async function recordAdminLoginFailure(email: string, ip: string) {
  const key = {
    email: normalizedEmail(email),
    ipHash: ipHash(ip)
  };
  const current = await prisma.adminLoginThrottle.findUnique({
    where: { email_ipHash: key }
  });
  const next = nextLoginFailureSnapshot(current);

  await prisma.adminLoginThrottle.upsert({
    where: { email_ipHash: key },
    create: {
      ...key,
      failedCount: next.failedCount,
      windowStartedAt: next.windowStartedAt,
      lastAttemptAt: next.lastAttemptAt,
      lockedUntil: next.lockedUntil
    },
    update: {
      failedCount: next.failedCount,
      windowStartedAt: next.windowStartedAt,
      lastAttemptAt: next.lastAttemptAt,
      lockedUntil: next.lockedUntil
    }
  });

  return loginThrottleDecision(next);
}

export async function recordAdminLoginSuccess(email: string, ip: string) {
  await prisma.adminLoginThrottle.deleteMany({
    where: {
      email: normalizedEmail(email),
      ipHash: ipHash(ip)
    }
  });
}
