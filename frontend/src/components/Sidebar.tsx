"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiHome,
  HiUsers,
  HiDocumentText,
  HiCreditCard,
  HiShieldExclamation,
  HiQrCode,
  HiCog6Tooth,
} from "react-icons/hi2";

const navItems = [
  { href: "/", label: "Dashboard", icon: HiHome },
  { href: "/residents", label: "Residents", icon: HiUsers },
  { href: "/invoices", label: "Invoices", icon: HiDocumentText },
  { href: "/payments", label: "Payments", icon: HiCreditCard },
  { href: "/defaulters", label: "Defaulters", icon: HiShieldExclamation },
  { href: "/gate", label: "Gate Entry", icon: HiQrCode },
  { href: "/settings", label: "Settings", icon: HiCog6Tooth },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-emerald-700">SocietySync</h1>
        <p className="text-xs text-gray-500 mt-1">Billing & Recovery Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          SocietySync v1.0
        </p>
      </div>
    </aside>
  );
}
