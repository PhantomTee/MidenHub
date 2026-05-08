'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadNotifications = notifications.filter(n => !n.read);
    for (const notif of unreadNotifications) {
      await updateDoc(doc(db, `users/${user.uid}/notifications`, notif.id), { read: true });
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => {
          setOpen(!open);
          if (!open) markAllAsRead();
        }} 
        className="w-10 h-10 flex items-center justify-center border border-white/20 hover:bg-[#ff6a00]/10 hover:border-[#ff6a00] hover:text-[#ff6a00] transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-black border border-white/20 shadow-xl z-50">
          <div className="p-4 border-b border-white/20 flex justify-between items-center bg-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-white/50 text-xs font-bold uppercase tracking-widest">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`p-4 border-b border-white/10 ${!notif.read ? 'bg-[#ff6a00]/5' : ''}`}>
                  <h4 className="font-bold text-sm mb-1">{notif.title}</h4>
                  <p className="text-xs text-white/70 mb-2">{notif.message}</p>
                  <span className="text-[10px] font-mono text-white/40">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
