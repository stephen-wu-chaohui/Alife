"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tighter mb-6">Events</h1>
      <div className="space-y-4">
        {loading ? (
          <div className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        ) : events.length === 0 ? (
          <p className="text-zinc-500 text-sm">No events found.</p>
        ) : events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="flex gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors"
          >
            <div className="w-16 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                {new Date(event.eventDate?.toDate()).toLocaleString("default", { month: "short" })}
              </span>
              <span className="text-xl font-bold">
                {new Date(event.eventDate?.toDate()).getDate()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{event.title}</h3>
              <p className="text-sm text-zinc-500">
                {new Date(event.eventDate?.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
