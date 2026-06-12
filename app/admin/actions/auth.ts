"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearSession, createSession, verifyAdminCredentials } from "@/lib/auth";
import {
  checkAdminLoginThrottle,
  clientIpFromHeaders,
  recordAdminLoginFailure,
  recordAdminLoginSuccess
} from "@/lib/rate-limit";
import { loginSchema, stringFromForm } from "@/lib/validators";

export type LoginState = {
  email?: string;
  error?: string;
};

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = stringFromForm(formData, "email");
  const password = stringFromForm(formData, "password");
  const parsed = loginSchema.safeParse({
    email,
    password
  });

  if (!parsed.success) return { email, error: "Use a valid email and password." };
  const clientIp = clientIpFromHeaders(await headers());
  const throttle = await checkAdminLoginThrottle(parsed.data.email, clientIp);
  if (!throttle.allowed) {
    return {
      email,
      error: `Too many login attempts. Try again after ${throttle.retryAt?.toLocaleTimeString() ?? "a short wait"}.`
    };
  }

  if (!(await verifyAdminCredentials(parsed.data.email, parsed.data.password))) {
    await recordAdminLoginFailure(parsed.data.email, clientIp);
    return { email, error: "Admin credentials were not accepted." };
  }

  await recordAdminLoginSuccess(parsed.data.email, clientIp);
  await createSession(parsed.data.email);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
