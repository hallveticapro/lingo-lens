"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });

  return (
    <main className="login-page">
      <form className="panel-card login-card" action={action}>
        <div className="brand">LingoLens</div>
        <h1 className="section-title" style={{ marginTop: 18 }}>
          Admin Login
        </h1>
        <p className="muted">Use the credentials configured in the server environment.</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" defaultValue="admin@example.com" />
        </div>
        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" />
        </div>
        {state.error ? <p style={{ color: "var(--error)" }}>{state.error}</p> : null}
        <button className="btn btn-primary" style={{ width: "100%", marginTop: 22 }} disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
