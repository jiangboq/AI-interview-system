"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/organizations", label: "Organizations" },
  { href: "/jobs", label: "Jobs" },
  { href: "/interviews", label: "Interviews" },
  { href: "/candidates", label: "Candidates" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <Link href="/interviews" style={styles.brand}>
          AI Interview System
        </Link>
        <nav style={styles.nav}>
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{ ...styles.link, ...(active ? styles.linkActive : {}) }}
              >
                {link.label}
              </Link>
            );
          })}
          <button style={styles.logoutLink} onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    background: "#fff",
    borderBottom: "1px solid #e9ecef",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0.85rem 2rem",
    display: "flex",
    alignItems: "center",
    gap: "2rem",
  },
  brand: {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#1a1a2e",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
  },
  link: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#6c757d",
    textDecoration: "none",
    padding: "0.35rem 0",
  },
  linkActive: {
    color: "#4f46e5",
    fontWeight: 600,
  },
  logoutLink: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#6c757d",
    background: "none",
    border: "none",
    padding: "0.35rem 0",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
