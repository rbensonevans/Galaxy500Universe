// Made during the XRP LEDGER HACKATHON

import Link from "next/link";
import Avatar from "@/app/components/Avatar";
import { personName, type Person } from "./relations";

// One member in a list: avatar, name and @handle linking to their profile,
// with optional controls on the right.
export default function PersonRow({
  person,
  href,
  children,
}: {
  person: Person;
  href: string;
  children?: React.ReactNode;
}) {
  const name = personName(person);
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <Link href={href} className="flex min-w-0 items-center gap-3">
        <Avatar path={person.avatar_path} name={name} className="h-10 w-10 text-sm" verification={person} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">
            {name}
          </span>
          {person.username && person.display_name && (
            <span className="block truncate font-mono text-xs text-violet-200/70">
              @{person.username}
            </span>
          )}
        </span>
      </Link>
      {children}
    </li>
  );
}
