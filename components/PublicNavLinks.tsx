"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function currentFor(pathname: string, href: string) {
  if (href === "/articles") return pathname === href || pathname.startsWith("/articles/");
  if (href === "/feeds") return pathname === href || pathname.startsWith("/feeds/");
  return pathname === href;
}

export function PublicNavLinks() {
  const pathname = usePathname();
  const links = [
    { href: "/articles", label: "Articles" },
    { href: "/feeds", label: "RSS" }
  ];

  return (
    <>
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={currentFor(pathname, link.href) ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
    </>
  );
}
