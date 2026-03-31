"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

export default function SermonDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [sermon, setSermon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, "sermons", id), (snapshot) => {
      if (snapshot.exists()) setSermon({ id: snapshot.id, ...snapshot.data() });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!sermon) return <div className="p-6">Sermon not found</div>;

  // Extract YouTube ID from URL
  const videoId = sermon.youtubeUrl?.split("v=")[1]?.split("&")[0] || sermon.id;

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tighter">{sermon.title}</h1>
        <p className="text-zinc-500 mt-2">{new Date(sermon.publishedAt?.toDate()).toLocaleDateString()}</p>
      </header>

      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={sermon.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
