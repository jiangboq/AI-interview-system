"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/organizations", label: "Organizations" },
  { href: "/jobs", label: "Jobs" },
  { href: "/interviews", label: "Interviews" },
  { href: "/candidates", label: "Candidates" },
];

const CURRENT_USER = {
  name: "Jane Doe",
  initials: "JD",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    clearToken();
    router.push("/login");
  }

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.leftGroup}>
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
          </nav>
        </div>
        <div style={styles.profile} ref={menuRef}>
          <button
            style={styles.avatarButton}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            {CURRENT_USER.initials}
          </button>
          {menuOpen && (
            <div style={styles.dropdown}>
              <button style={styles.dropdownItem} onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
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
    justifyContent: "space-between",
    gap: "2rem",
  },
  leftGroup: {
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
  profile: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  avatarButton: {
    width: "2rem",
    height: "2rem",
    borderRadius: "50%",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 0.5rem)",
    right: 0,
    background: "#fff",
    border: "1px solid #e9ecef",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    minWidth: "140px",
    overflow: "hidden",
    zIndex: 10,
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    padding: "0.6rem 1rem",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#6c757d",
    background: "none",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
