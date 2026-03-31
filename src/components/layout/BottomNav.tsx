"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Search, User as UserIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const pathname = usePathname();
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Video, label: "Sermons", path: "/sermons" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: Search, label: "Church", path: "/church" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around md:hidden z-50 transition-colors">
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            pathname === item.path ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"
          )}
        >
          <item.icon size={20} />
          <span className="text-[10px] mt-1 font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};
