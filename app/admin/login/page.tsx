import { LoginForm } from "@/app/admin/login/login-form";
import { adminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="login-page">
      <LoginForm defaultEmail={adminEmail()} />
    </main>
  );
}
