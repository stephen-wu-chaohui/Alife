"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { auth } from "@/firebase";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, profile, isAuthReady } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isAuthReady && !user) {
      router.push("/login");
    }
  }, [user, isAuthReady, router]);

  if (!isAuthReady || (isAuthReady && !user)) return null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold">
          {profile?.realName?.[0] || "U"}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile?.realName || "User"}</h1>
          <p className="text-sm text-zinc-500">{profile?.phoneNumber}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <button 
          onClick={() => auth.signOut()}
          className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left flex items-center justify-between"
        >
          <span className="font-medium">Sign Out</span>
          <LogOut size={18} className="text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
