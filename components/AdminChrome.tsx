import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpenText, FilePlus2, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

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
          <Link href="/admin">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin">
            <BookOpenText size={20} /> Content List
          </Link>
          <Link href="/admin/content/new">
            <FilePlus2 size={20} /> New Content
          </Link>
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
