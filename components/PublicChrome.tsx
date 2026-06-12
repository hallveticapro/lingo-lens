import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, Rss } from "lucide-react";
import { PublicNavLinks } from "@/components/PublicNavLinks";

export function PublicHeader() {
  return (
    <header className="top-nav">
      <div className="container top-nav-inner">
        <Link className="brand" href="/">
          <Image src="/brand/logo-mark.webp" alt="" width={32} height={32} aria-hidden="true" />
          LingoLens
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <PublicNavLinks />
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand">
            <Image src="/brand/logo-mark.webp" alt="" width={32} height={32} aria-hidden="true" />
            LingoLens
          </div>
          <p className="muted">Real-world reading, leveled for language learners.</p>
          <p className="muted">© 2026 LingoLens. All rights reserved.</p>
        </div>
        <div>
          <p className="kicker">Platform</p>
          <p>
            <Link href="/articles">
              <BookOpen size={14} /> Articles
            </Link>
          </p>
          <p>
            <Link href="/feeds">
              <Rss size={14} /> RSS Feed
            </Link>
          </p>
        </div>
        <div>
          <p className="kicker">Legal</p>
          <p className="muted">Privacy Policy</p>
          <p className="muted">Contact</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
