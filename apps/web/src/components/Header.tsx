"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authHeaders, clearToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const NAV_LINKS = [
  { href: "/organizations", label: "Organizations" },
  { href: "/jobs", label: "Jobs" },
  { href: "/interviews", label: "Interviews" },
  { href: "/candidates", label: "Candidates" },
  { href: "/users", label: "Users" },
];

interface CurrentUser {
  name: string | null;
  username: string | null;
}

function getInitials(user: CurrentUser): string {
  const source = user.name ?? user.username ?? "";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
  return initials || "?";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/users/me`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch current user");
        return res.json();
      })
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

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
            {currentUser ? getInitials(currentUser) : "…"}
          </button>
          {menuOpen && (
            <div style={styles.dropdown}>
              <Link
                href="/my_profile"
                style={{ ...styles.dropdownItem, textDecoration: "none" }}
                onClick={() => setMenuOpen(false)}
              >
                My Profile
              </Link>
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
