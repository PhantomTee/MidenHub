'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Compass, PlusCircle, LayoutDashboard, User, LogIn, LogOut } from 'lucide-react';

export default function MobileNavbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const links = [
    { href: user ? '#' : '/login', label: user ? 'Logout' : 'Login', icon: user ? <LogOut className="w-6 h-6" /> : <LogIn className="w-6 h-6" />, protected: false, onClick: user ? () => signOut(auth) : undefined },
    { href: '/explore', label: 'Explore', icon: <Compass className="w-6 h-6" />, protected: false },
    { href: '/submit', label: 'Submit', icon: <PlusCircle className="w-6 h-6" />, protected: true },
    { href: '/profile', label: 'Profile', icon: <User className="w-6 h-6" />, protected: true },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-6 h-6" />, protected: true },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t-2 border-white/20 z-50">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          if (link.protected && !user) return null;
          const isActive = link.href !== '#' && (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)));
          
          if (link.onClick) {
            return (
              <button 
                key={link.label} 
                onClick={link.onClick}
                className={`p-2 transition-colors flex flex-col items-center justify-center text-white/50 hover:text-white`}
              >
                {link.icon}
                <span className="text-[10px] mt-1 font-bold uppercase">{link.label}</span>
              </button>
            );
          }

          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`p-2 transition-colors flex flex-col items-center justify-center ${isActive ? 'text-[#ff6a00]' : 'text-white/50 hover:text-white'}`}
            >
              {link.icon}
              <span className="text-[10px] mt-1 font-bold uppercase">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
