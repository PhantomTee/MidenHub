'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Compass, PlusCircle, LayoutDashboard, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAdmin } = useAuth();


  const links = [
    { href: '/explore', label: 'Explore', icon: <Compass className="w-5 h-5" />, protected: false },
    { href: '/submit', label: 'Submit', icon: <PlusCircle className="w-5 h-5" />, protected: true },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, protected: true },
    { href: '/profile', label: 'Profile', icon: <User className="w-5 h-5" />, protected: true },
  ];

  return (
    <nav className="hidden md:block sticky top-0 bg-black border-b-2 border-white/20 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#ff6a00]">
            MIDENHUB
          </Link>
          <div className="flex space-x-6 text-sm font-bold uppercase tracking-widest">
            {links.map((link) => {
              if (link.protected && !user) return null;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${isActive ? 'text-[#ff6a00] border-b-2 border-[#ff6a00]' : 'text-white/60 hover:text-[#ff6a00]'}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && profile?.walletAddress && (
            <div className="flex flex-col items-end px-3 border-r border-white/20">
              <span className="text-[10px] uppercase text-white/50">Wallet Connected</span>
              <span className="text-[11px] font-mono">{profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}</span>
            </div>
          )}
          {user ? (
            <button
              onClick={() => signOut(auth)}
              className="bg-white text-black font-bold uppercase text-xs px-6 py-2 border-2 border-white hover:bg-[#ff6a00] hover:border-[#ff6a00] transition-all"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-white text-black font-bold uppercase text-xs px-6 py-2 border-2 border-white hover:bg-[#ff6a00] hover:border-[#ff6a00] transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
