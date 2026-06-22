"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutAction } from "@/app/actions";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Wrench,
  LogOut,
  ShieldCheck,
  Inbox,
  Newspaper,
  MessageSquareQuote,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",        label: "Dashboard",   icon: LayoutDashboard },
  { href: "/booking-requests", label: "Bookings",    icon: Inbox           },
  { href: "/customers",        label: "Customers",   icon: Users           },
  { href: "/work-orders",      label: "Work Orders", icon: ClipboardList   },
  { href: "/invoices",         label: "Invoices",    icon: FileText        },
  { href: "/admin/blog",       label: "Blog",        icon: Newspaper       },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
];

function NavContent({ pathname, isAdmin, user, onNavigate }: {
  pathname: string;
  isAdmin: boolean;
  user: { name?: string; email?: string; role?: string } | undefined;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
        <Wrench className="h-5 w-5 text-blue-600" />
        <span className="font-semibold text-gray-900">Shop Manager</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}

          {isAdmin && (
            <li>
              <Link
                href="/admin/users"
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin/users")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Team
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-3">
        {user && (
          <div className="mb-2 px-2">
            <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.role}</p>
          </div>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;
  const isAdmin = user?.role === "ADMIN";
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Shop Manager</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile slide-out drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-gray-50 shadow-lg transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent pathname={pathname} isAdmin={isAdmin} user={user} onNavigate={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar — unchanged */}
      <aside className="hidden md:flex h-screen w-56 flex-col border-r border-gray-200 bg-gray-50">
        <NavContent pathname={pathname} isAdmin={isAdmin} user={user} />
      </aside>
    </>
  );
}
