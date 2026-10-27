import Link from "next/link";
import { AccountActions } from "@/components/features/AccountActions";

const links = [
  { href: "/whatif", label: "Can I skip?", sub: "Plan which days you can miss" },
  { href: "/calendar", label: "Attendance calendar", sub: "Month view with your marks" },
  { href: "/subjects", label: "Subjects", sub: "Add or edit your subjects" },
  { href: "/timetable", label: "Timetable", sub: "Your weekly class schedule" },
];

export default function MorePage() {
  return (
    <>
      <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 10px" }}>
        More
      </h1>
      <div className="rc-card">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rc-rowbtn" style={{ textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              <span style={{ display: "block", fontWeight: 600 }}>{l.label}</span>
              <span className="rc-tag">{l.sub}</span>
            </span>
            <span style={{ color: "var(--color-ink-muted)" }}>→</span>
          </Link>
        ))}
      </div>
      <AccountActions />
    </>
  );
}
