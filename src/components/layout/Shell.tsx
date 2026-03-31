"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { NavigationDrawer } from "./NavigationDrawer";
import { Menu } from "lucide-react";
import { Toaster } from "sonner";

export const Shell = ({ children }: { children: React.ReactNode }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground text-zinc-900 dark:text-zinc-50">
      <Sidebar />
      
      <main className="flex-1 pb-20 md:pb-0 max-w-4xl mx-auto w-full">
        <header className="h-16 flex items-center justify-between px-6 md:hidden sticky top-0 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md z-40">
          <h1 className="text-xl font-bold tracking-tighter">ALIFE</h1>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        {children}
      </main>

      <BottomNav />
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <Toaster position="top-center" />
    </div>
  );
};
