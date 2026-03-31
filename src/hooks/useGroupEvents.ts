import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export const useGroupEvents = (groupId?: string) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "events"),
      where("groupId", "==", groupId),
      orderBy("eventDate", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("useGroupEvents error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  return { events, loading };
};
