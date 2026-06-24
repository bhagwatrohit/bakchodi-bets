"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact clan section nav shown on every clan page. The clan name (with a back
 * arrow) always returns to the clan hub; the tabs switch sections and highlight
 * the active one. This is the consistent "get back / move around" affordance —
 * sub-pages used to be dead-ends.
 */
export function ClanNav({
  clanId,
  clanName,
  isAdmin,
}: {
  clanId: string;
  clanName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const base = `/clans/${clanId}`;
  const tabs = [
    { href: `${base}/matches`, label: "Matches" },
    { href: `${base}/gala`, label: "Grand Gala" },
    { href: `${base}/leaderboard`, label: "Leaderboard" },
    { href: `${base}/bets`, label: "My bets" },
    ...(isAdmin ? [{ href: `${base}/admin`, label: "Admin" }] : []),
  ];
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="-mx-4 mb-4 flex items-center gap-1 overflow-x-auto border-b border-border px-4 py-2 text-sm">
      <Link
        href={base}
        className="flex shrink-0 items-center gap-1 pr-1 font-semibold text-foreground hover:opacity-80"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="max-w-[9rem] truncate">{clanName}</span>
      </Link>
      <span className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden />
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={active(t.href) ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-md px-2.5 py-1 transition-colors",
            active(t.href)
              ? "bg-muted font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
