"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const NavigationDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
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
