"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, FilePlus2, LayoutDashboard } from "lucide-react";

function currentFor(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/content/new") return pathname === href;
  if (href === "/admin/content") return pathname === href || (pathname.startsWith("/admin/content/") && pathname !== "/admin/content/new");
  return pathname === href;
}

export function AdminNavLinks() {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/content", label: "Content List", icon: BookOpenText },
    { href: "/admin/content/new", label: "New Content", icon: FilePlus2 }
  ];

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href} aria-current={currentFor(pathname, link.href) ? "page" : undefined}>
            <Icon size={20} /> {link.label}
          </Link>
        );
      })}
    </>
  );
}
