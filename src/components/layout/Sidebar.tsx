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
  Upload,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Bitcoin,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  CalendarSync,
  Target,
  Upload,
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
  { href: "/import", label: "Importar", icon: "Upload" },
  { href: "/config", label: "Configurações", icon: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="hidden w-64 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          MyFinance
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-600/10 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
