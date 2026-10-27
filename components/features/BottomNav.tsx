"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/today", label: "Today", icon: HomeIcon },
  { href: "/attendance", label: "Attend", icon: ClockIcon },
  { href: "/timetable", label: "Timetable", icon: GridIcon },
  { href: "/marks", label: "Marks", icon: StarIcon },
  { href: "/more", label: "More", icon: MenuIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="rc-nav" aria-label="Primary">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}>
            <Icon />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* Original line icons (stroke = currentColor) */
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 11l8-7 8 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path
        d="M12 4l2.3 4.7 5.2.8-3.8 3.7.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.7 5.2-.8z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
