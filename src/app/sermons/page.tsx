"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";
import { Video } from "lucide-react";

export default function SermonsPage() {
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "sermons"), orderBy("publishedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSermons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tighter mb-6">Sermons</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))
        ) : sermons.length === 0 ? (
          <div className="col-span-full p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
             <p className="text-zinc-500 text-sm">No sermons found.</p>
          </div>
        ) : sermons.map(sermon => {
          const videoId = sermon.youtubeUrl?.split("v=")[1]?.split("&")[0] || sermon.id;
          return (
            <Link key={sermon.id} href={`/sermons/${sermon.id}`} className="block group">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-3 relative">
                 <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt={sermon.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl">
                      <Video className="w-5 h-5 text-black ml-0.5" />
                    </div>
                 </div>
              </div>
              <h3 className="font-semibold text-lg line-clamp-2 leading-snug">{sermon.title}</h3>
              <p className="text-sm text-zinc-500 mt-1">{new Date(sermon.publishedAt?.toDate()).toLocaleDateString()}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
