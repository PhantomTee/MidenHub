'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Preloader from '@/components/Preloader';
import { Trophy, Star, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface Developer {
  id: string;
  username: string;
  walletAddress: string;
  avatarUrl: string;
  totalUpvotes: number;
  approvedProjects: number;
}

export default function Leaderboard() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      // 1. Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // 2. Fetch all approved projects
      const q = query(collection(db, 'projects'), where('status', '==', 'approved'));
      const projectsSnapshot = await getDocs(q);
      const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // 3. Aggregate stats per user
      const userStats: Record<string, Developer> = {};
      
      users.forEach(u => {
        userStats[u.id] = {
          id: u.id,
          username: u.username || `User_${u.id.substring(0, 4)}`,
          walletAddress: u.walletAddress || '',
          avatarUrl: u.avatarUrl || '',
          totalUpvotes: 0,
          approvedProjects: 0,
        };
      });

      projects.forEach(p => {
        if (userStats[p.ownerId]) {
          userStats[p.ownerId].approvedProjects += 1;
          userStats[p.ownerId].totalUpvotes += (p.upvotesCount || 0);
        }
      });

      // Filter and sort
      const ranked = Object.values(userStats)
        .filter(d => d.approvedProjects > 0 || d.totalUpvotes > 0)
        .sort((a, b) => b.totalUpvotes - a.totalUpvotes || b.approvedProjects - a.approvedProjects);

      setDevelopers(ranked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Preloader message="Loading Leaderboard..." />;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ff6a00]/10 rounded-full mb-4">
          <Trophy className="w-8 h-8 text-[#ff6a00]" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-[#ff6a00]">Global Leaderboard</h1>
        <p className="text-white/50 text-sm max-w-lg mx-auto leading-relaxed font-bold tracking-widest uppercase">
          Top Miden Developers ranked by community upvotes and approved submissions
        </p>
      </div>

      <div className="border border-white/20 bg-black">
        {developers.length === 0 ? (
          <div className="p-12 text-center text-white/50 text-sm font-bold uppercase tracking-widest">
            No developers found.
          </div>
        ) : (
          <div className="divide-y divide-white/20">
            {developers.map((dev, index) => (
              <div key={dev.id} className="p-6 flex items-center gap-6 hover:bg-white/5 transition-colors">
                <div className="font-black text-3xl text-white/20 w-8 text-center shrink-0">
                  #{index + 1}
                </div>
                <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden bg-black shrink-0 relative">
                  {dev.avatarUrl ? (
                    <img src={dev.avatarUrl} alt={dev.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg uppercase bg-white/5 text-white/50">
                      {dev.username.charAt(0)}
                    </div>
                  )}
                  {index === 0 && <div className="absolute inset-0 border-2 border-yellow-500 rounded-full"></div>}
                  {index === 1 && <div className="absolute inset-0 border-2 border-gray-400 rounded-full"></div>}
                  {index === 2 && <div className="absolute inset-0 border-2 border-amber-700 rounded-full"></div>}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{dev.username}</h3>
                  <div className="text-[10px] uppercase font-mono text-white/40 tracking-widest">
                    {dev.walletAddress ? `${dev.walletAddress.slice(0, 6)}...${dev.walletAddress.slice(-4)}` : 'No Wallet'}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm font-bold shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-[#ff6a00] flex items-center gap-1"><Star className="w-4 h-4 fill-[#ff6a00]" /> {dev.totalUpvotes}</span>
                    <span className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Upvotes</span>
                  </div>
                  <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-green-400 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {dev.approvedProjects}</span>
                    <span className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Projects</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
