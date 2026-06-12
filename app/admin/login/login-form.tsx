"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

type LoginFormProps = {
  defaultEmail: string;
};

export function LoginForm({ defaultEmail }: LoginFormProps) {
  const initialState: LoginState = { email: defaultEmail, error: "" };
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form className="panel-card login-card" action={action}>
      <div className="brand">LingoLens</div>
      <h1 className="section-title" style={{ marginTop: 18 }}>
        Admin Login
      </h1>
      <p className="muted">Use the credentials configured in the server environment.</p>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" defaultValue={state.email || defaultEmail} />
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" />
      </div>
      {state.error ? (
        <p className="form-error" role="alert" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      <button className="btn btn-primary" style={{ width: "100%", marginTop: 22 }} disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
