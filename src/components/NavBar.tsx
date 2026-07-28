"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tasks", label: "Tasks" },
  { href: "/research", label: "Research & Setup" },
  { href: "/scaled", label: "Scaled Apps" },
  { href: "/apps", label: "App Management" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-semibold">PO Mobile App Tracker</span>
        <div className="flex gap-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm px-2 py-1 rounded ${
                pathname.startsWith(link.href)
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
