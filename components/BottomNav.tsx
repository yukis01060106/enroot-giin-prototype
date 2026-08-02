"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headset, Home, ClipboardList, Settings } from "lucide-react";

const navItems = [
  { href: "/secretary", icon: Headset, label: "秘書" },
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/council-prep", icon: ClipboardList, label: "議会準備" },
  { href: "/settings", icon: Settings, label: "設定" },
];

/**
 * Flutter版 lib/shared/widgets/main_shell.dart の移植。
 * Flutter版はIndexedStackによるローカルstateタブ切替でURLを持たなかったが、
 * output:'export'では複数の静的ルートを持たせるコストがほぼゼロなので、
 * 4タブそれぞれに実URLを与える（意図的な改善、移行計画で明示済み）。
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-30 flex h-[68px] shrink-0 items-stretch justify-around bg-white shadow-[0_-3px_16px_rgba(21,101,192,0.12)]">
      {navItems.map(({ href, icon: Icon, label }) => {
        const selected = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            <div
              className={`flex h-9 w-14 items-center justify-center rounded-chip transition-colors ${
                selected ? "bg-brand-green/12" : ""
              }`}
            >
              <Icon
                size={22}
                className={selected ? "text-brand-green" : "text-text-secondary"}
              />
            </div>
            <span
              className={`text-xs ${
                selected ? "font-bold text-brand-green" : "text-text-secondary"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
