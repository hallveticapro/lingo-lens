"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type MouseEvent } from "react";

type LevelLink = {
  href: string;
  id: string;
  isCurrent: boolean;
  label: string;
};

export function ReadingLevelSwitcher({ levels }: { levels: LevelLink[] }) {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.remove("reader-leaving");
  }, []);

  function onNavigate(event: MouseEvent<HTMLAnchorElement>, href: string, isCurrent: boolean) {
    if (isCurrent || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }
    document.documentElement.classList.add("reader-leaving");
    window.setTimeout(() => {
      router.push(href);
    }, 150);
  }

  return (
    <nav className="level-switcher" aria-label="Reading levels">
      {levels.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={item.isCurrent ? "page" : undefined}
          onClick={(event) => onNavigate(event, item.href, item.isCurrent)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
