"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Search, User as UserIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const pathname = usePathname();
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Video, label: "Sermons", path: "/sermons" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: Search, label: "Church", path: "/church" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-4 transition-colors">
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold tracking-tighter">ALIFE</h1>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center px-4 py-2 rounded-lg transition-colors",
              pathname === item.path 
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" 
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            )}
          >
            <item.icon size={20} className="mr-3" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};
