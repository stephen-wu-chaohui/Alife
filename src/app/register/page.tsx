"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";

export default function RegisterPage() {
  const { user, profile, loading } = useAuth();
  const [realName, setRealName] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (!user) return;
    
    try {
      const response = await fetch("/api/members/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realName,
          phoneNumber: user.phoneNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      toast.success("Profile created!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login first</div>;
  if (profile) return <div>Profile already exists</div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tighter">Complete Profile</h1>
          <p className="text-zinc-500 mt-2">Welcome to Alife, {user.phoneNumber}</p>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Real Name"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-all"
          />
          <button
            onClick={handleRegister}
            className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-bold transition-transform active:scale-95"
          >
            Create Profile
          </button>
        </div>
      </div>
    </div>
  );
}
