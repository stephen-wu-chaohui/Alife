"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase";

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "content"),
      where("type", "==", "page"),
      where("visibility", "==", "CHURCH_LEVEL"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 space-y-12">
      <header className="text-center md:text-left">
        <h1 className="text-5xl font-bold tracking-tighter">ALIFE</h1>
        <p className="text-zinc-500 mt-4 text-lg max-w-md">The digital home for Abundant Life Church. Connect, grow, and serve together.</p>
      </header>
      
      <section>
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Announcements</h2>
        <div className="grid gap-6">
          {loading ? (
            <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          ) : announcements.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
              <p className="text-zinc-400 text-sm">No recent announcements.</p>
            </div>
          ) : announcements.map(post => (
            <div key={post.id} className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <h3 className="text-xl font-bold mb-2">{post.title}</h3>
              <div className="text-zinc-500 text-sm line-clamp-3">
                {post.body?.content?.[0]?.content?.[0]?.text || "No content preview available."}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
