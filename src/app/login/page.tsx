"use client";

import { useState, useEffect } from "react";
import { signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const router = useRouter();
  const { user, isAuthReady } = useAuth();

  useEffect(() => {
    if (isAuthReady && user) {
      router.push("/");
    }
  }, [user, isAuthReady, router]);

  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      import("@/firebase").then(({ setupRecaptcha }) => {
        (window as any).recaptchaVerifier = setupRecaptcha("recaptcha-container");
      });
    }
  }, []);

  const handleSendCode = async () => {
    try {
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmResult(result);
      setStep("code");
      toast.success("Verification code sent");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleVerifyCode = async () => {
    try {
      const result = await confirmResult.confirm(code);
      const idToken = await result.user.getIdToken();
      
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      
      toast.success("Logged in successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter">ALIFE</h1>
          <p className="text-zinc-500 mt-2">Sign in with your phone number</p>
        </div>
        
        <div className="space-y-4">
          {step === "phone" ? (
            <>
              <input
                type="tel"
                placeholder="+64 21 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-all"
              />
              <button
                onClick={handleSendCode}
                className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-bold transition-transform active:scale-95"
              >
                Send Code
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-all"
              />
              <button
                onClick={handleVerifyCode}
                className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-bold transition-transform active:scale-95"
              >
                Verify Code
              </button>
            </>
          )}
        </div>
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
