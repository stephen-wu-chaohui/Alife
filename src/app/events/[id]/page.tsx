"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { DynamicForm } from "@/components/DynamicForm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !user) {
      router.push("/login");
    }
  }, [user, isAuthReady, router]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, "events", id), (snapshot) => {
      if (snapshot.exists()) setEvent({ id: snapshot.id, ...snapshot.data() });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const handleRegister = async (responses: any) => {
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, responses }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success("Registration successful!");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!isAuthReady || (isAuthReady && !user)) return null;

  if (loading) return <div className="p-6">Loading...</div>;
  if (!event) return <div className="p-6">Event not found</div>;

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tighter">{event.title}</h1>
        <p className="text-zinc-500 mt-2">
          {new Date(event.eventDate?.toDate()).toLocaleString()}
        </p>
      </header>

      <section className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h2 className="text-xl font-bold mb-6">Register for Event</h2>
        <DynamicForm 
          schema={event.formSchema || []} 
          onSubmit={handleRegister} 
          submitLabel={event.isPaid ? `Pay $${event.priceNzd} & Register` : "Register for Free"}
        />
      </section>
    </div>
  );
}
