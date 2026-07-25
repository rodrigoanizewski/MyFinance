"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bitcoin,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  CalendarSync,
  Target,
  Settings,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Bitcoin,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  CalendarSync,
  Target,
  Settings,
};

const NAV_ITEMS = [
  { href: "/", label: "Visão Geral", icon: "LayoutDashboard" },
  { href: "/crypto", label: "Cripto", icon: "Bitcoin" },
  { href: "/transactions", label: "Transações", icon: "ArrowLeftRight" },
  { href: "/patrimonio", label: "Patrimônio", icon: "Landmark" },
  { href: "/debts", label: "Dívidas", icon: "CreditCard" },
  { href: "/subscriptions", label: "Assinaturas", icon: "CalendarSync" },
  { href: "/goals", label: "Objetivos", icon: "Target" },
];

const SECONDARY_ITEMS = [
  { href: "/config", label: "Configurações", icon: "Settings" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950 lg:hidden">
      <div className="flex items-center justify-around px-1 py-2">
        {[...NAV_ITEMS, ...SECONDARY_ITEMS].map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon size={18} />
              <span className="truncate max-w-[48px] text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
