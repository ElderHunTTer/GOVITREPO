import Link from "next/link";
import type { ReactNode } from "react";
import { requireReviewer } from "@/lib/product";
import { signOutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProductLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const { profile } = await requireReviewer();

  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand-mark" href="/dashboard">
          <span className="brand-badge">TTB</span>
          <div>
            <strong>Label Review Console</strong>
            <span>Admin and reviewer operations</span>
          </div>
        </Link>

        <nav className="nav-links">
          <Link className="nav-link" href="/">
            Home
          </Link>
          <Link className="nav-link" href="/dashboard">
            Dashboard
          </Link>
          <Link className="nav-link" href="/reviews/new">
            New review
          </Link>
          <Link className="nav-link" href="/demo-library">
            Demo library
          </Link>
        </nav>

        <div className="account-panel">
          <div>
            <strong>{profile.fullName}</strong>
            <span>
              {profile.role === "admin" ? "Administrator" : "Reviewer"} account
            </span>
          </div>
          <form action={signOutAction}>
            <button className="secondary-button compact-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="content-shell">{children}</div>
    </main>
  );
}
