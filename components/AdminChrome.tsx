import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { AdminNavLinks } from "@/components/AdminNavLinks";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="brand">Admin Panel</div>
          <p className="muted" style={{ marginTop: 4 }}>
            Management
          </p>
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <AdminNavLinks />
        </nav>
        <div className="admin-nav" style={{ marginTop: "auto" }}>
          <Link href="/">
            <Settings size={20} /> Public Site
          </Link>
          <form action={logoutAction}>
            <button type="submit">
              <LogOut size={20} /> Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
