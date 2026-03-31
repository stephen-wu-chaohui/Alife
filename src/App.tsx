import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useParams } from "react-router-dom";
import { onAuthStateChanged, User, signInWithPhoneNumber } from "firebase/auth";
import { collection, doc, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { auth, db } from "./firebase";
import { Home, Calendar, Search, User as UserIcon, Menu, Plus, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { cn } from "./lib/utils";

import { RegisterPage } from "./RegisterPage";

// ===============================================================
// Auth Context
// ===============================================================
interface MemberProfile {
  realName: string;
  phoneNumber: string;
  memberships: Record<string, { role: string; joinedAt: any }>;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: MemberProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, isAdmin: false, isAuthReady: false });

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribeProfile = onSnapshot(doc(db, "members", user.uid), (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as MemberProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Profile fetch error:", error);
        setLoading(false);
      });
      return () => unsubscribeProfile();
    }
  }, [user]);

  const isAdmin = profile?.phoneNumber === "+6402102591292";

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

// ===============================================================
// Protected Route
// ===============================================================
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!profile && location.pathname !== "/register") return <Navigate to="/register" replace />;

  return <>{children}</>;
};

// ===============================================================
// Layout Components
// ===============================================================
const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: Search, label: "Church", path: "/church" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around md:hidden z-50">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            location.pathname === item.path ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"
          )}
        >
          <item.icon size={20} />
          <span className="text-[10px] mt-1 font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: Search, label: "Church", path: "/church" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-4">
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold tracking-tighter">ALIFE</h1>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center px-4 py-2 rounded-lg transition-colors",
              location.pathname === item.path 
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" 
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            )}
          >
            <item.icon size={20} className="mr-3" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

const NavigationDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { profile, isAdmin } = useAuth();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-zinc-50 dark:bg-zinc-950 z-[70] p-6 md:hidden shadow-xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold">Management</h2>
            </div>
            
            <div className="space-y-6">
              {profile?.memberships && Object.entries(profile.memberships).map(([groupId, data]) => (
                <div key={groupId} className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{groupId}</h3>
                  <div className="space-y-1">
                    {data.role === "leader" && (
                      <>
                        <button className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                          <Plus size={16} className="mr-2" /> Create Event
                        </button>
                        <button className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                          <Settings size={16} className="mr-2" /> Manage Members
                        </button>
                      </>
                    )}
                    <button className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900">
                      <Plus size={16} className="mr-2" /> New Prayer
                    </button>
                  </div>
                </div>
              ))}
              
              {isAdmin && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                   <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">System</h3>
                   <button className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-red-500">
                      <LogOut size={16} className="mr-2" /> Admin Console
                   </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ===============================================================
// Pages
// ===============================================================
const HomePage = () => {
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
                {/* Simplified preview of Novel JSON */}
                {post.body?.content?.[0]?.content?.[0]?.text || "No content preview available."}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

import { useGroupEvents } from "./hooks/useGroupEvents";
import { DynamicForm } from "./components/DynamicForm";

// ... inside EventsPage ...
const EventsPage = () => {
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
            to={`/events/${event.id}`}
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
};

const EventDetailsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
};

const ChurchPage = () => {
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
            <Link key={sermon.id} to={`/sermons/${sermon.id}`} className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors">
              <h3 className="font-semibold">{sermon.title}</h3>
              <p className="text-xs text-zinc-500 mt-1">{new Date(sermon.publishedAt?.toDate()).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

const SermonDetailsPage = () => {
  const { id } = useParams();
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
};
const ProfilePage = () => {
  const { user, profile } = useAuth();
  
  if (!user) return <Navigate to="/login" />;

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
};

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [confirmResult, setConfirmResult] = useState<any>(null);

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
      
      // Set session cookie
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

  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      import("./firebase").then(({ setupRecaptcha }) => {
        (window as any).recaptchaVerifier = setupRecaptcha("recaptcha-container");
      });
    }
  }, []);

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
};

// ===============================================================
// Main App
// ===============================================================
import { ThemeProvider } from "next-themes";

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <Router>
          <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
            <Sidebar />
            
            <main className="flex-1 pb-20 md:pb-0 max-w-4xl mx-auto w-full">
              <header className="h-16 flex items-center justify-between px-6 md:hidden sticky top-0 bg-background/80 backdrop-blur-md z-40">
                <h1 className="text-xl font-bold tracking-tighter">ALIFE</h1>
                <button 
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
              </header>

              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<ProtectedRoute><EventDetailsPage /></ProtectedRoute>} />
                <Route path="/sermons/:id" element={<SermonDetailsPage />} />
                <Route path="/church" element={<ChurchPage />} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<ProtectedRoute><RegisterPage /></ProtectedRoute>} />
              </Routes>
            </main>

            <BottomNav />
            <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
            <Toaster position="top-center" />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
