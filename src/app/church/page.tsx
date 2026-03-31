"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";

export default function ChurchPage() {
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sermons"), (snapshot) => {
      setSermons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 space-y-12">
      <header>
        <h1 className="text-4xl font-bold tracking-tighter">Discover</h1>
        <p className="text-zinc-500 mt-4 text-lg">Explore our community, join a group, or catch up on the latest sermons.</p>
      </header>
      
      <section className="grid grid-cols-2 gap-4">
        <div className="aspect-[4/3] rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-6 flex flex-col justify-end group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          <span className="font-bold text-lg">Groups</span>
          <p className="text-xs text-zinc-500 mt-1">Find your tribe</p>
        </div>
        <div className="aspect-[4/3] rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-6 flex flex-col justify-end group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          <span className="font-bold text-lg">Giving</span>
          <p className="text-xs text-zinc-500 mt-1">Support the mission</p>
        </div>
      </section>

      <section>
        <div className="p-8 rounded-3xl bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
          <h2 className="text-2xl font-bold mb-4">New to Alife?</h2>
          <p className="text-zinc-400 dark:text-zinc-500 mb-6">We'd love to meet you. Join us for a welcome lunch next Sunday after the service.</p>
          <button className="px-6 py-2 rounded-full bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 font-bold text-sm">
            Learn More
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Latest Sermons</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ) : sermons.length === 0 ? (
            <p className="text-zinc-500 text-sm">No sermons found.</p>
          ) : sermons.map(sermon => (
            <Link key={sermon.id} href={`/sermons/${sermon.id}`} className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors">
              <h3 className="font-semibold">{sermon.title}</h3>
              <p className="text-xs text-zinc-500 mt-1">{new Date(sermon.publishedAt?.toDate()).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
