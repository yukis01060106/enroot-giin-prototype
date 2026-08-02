"use client";

import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import type { PersonModel } from "@/types/models";

export function PersonTile({
  person,
  subtitle,
  accentColor = "text-primary-blue",
  accentBg = "bg-primary-blue/15",
}: {
  person: PersonModel;
  subtitle?: string;
  accentColor?: string;
  accentBg?: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-card bg-white p-3 shadow-card">
      <Link href={`/contacts?id=${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold ${accentBg} ${accentColor}`}
        >
          {person.name.slice(0, 1) || "?"}
        </span>
        <span className="min-w-0">
          <p className="truncate">{person.name}</p>
          <p className="truncate text-sm text-text-secondary">
            {subtitle ?? person.organization ?? ""}
          </p>
        </span>
      </Link>
      {person.phone && (
        <a
          href={`tel:${person.phone}`}
          aria-label="電話"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green"
        >
          <Phone size={18} />
        </a>
      )}
      {person.email && (
        <a
          href={`mailto:${person.email}`}
          aria-label="メール"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-blue/10 text-primary-blue"
        >
          <Mail size={18} />
        </a>
      )}
    </div>
  );
}
