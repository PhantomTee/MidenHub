'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  status: string;
  createdAt: number;
}

export default function Dashboard() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchProjects();
    }
  }, [user, loading, router]);

  const fetchProjects = async () => {
    try {
      let q;
      if (isAdmin) {
        q = query(collection(db, 'projects'));
      } else {
        q = query(collection(db, 'projects'), where('ownerId', '==', user?.uid));
      }
      const querySnapshot = await getDocs(q);
      const fetchedProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      
      fetchedProjects.sort((a, b) => b.createdAt - a.createdAt);
      setProjects(fetchedProjects);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
      try {
        handleFirestoreError(err, OperationType.GET, 'projects', auth);
      } catch(e) {}
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) return <div className="p-12 text-center text-white">Loading dashboard...</div>;
  if (error) return <div className="p-12 text-center text-red-500 bg-red-500/10 border border-red-500/50 m-6">{error.includes('index') ? 'A Firestore composite index is missing. Check the console for the creation link.' : error}</div>;
  if (!user) return null;

  const approved = projects.filter(p => p.status === 'approved').length;
  const pending = projects.filter(p => p.status === 'pending').length;
  const rejected = projects.filter(p => p.status === 'rejected').length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tighter">Your Dashboard</h1>
        {isAdmin && <span className="bg-[#ff6a00] text-black text-xs font-bold uppercase px-3 py-1">Admin Mode</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <div className="border border-white/20 p-6 flex flex-col justify-center items-center">
          <span className="text-4xl font-bold text-[#ff6a00]">{projects.length}</span>
          <span className="text-xs uppercase tracking-widest text-white/50 mt-2">Total</span>
        </div>
        <div className="border border-white/20 p-6 flex flex-col justify-center items-center">
          <span className="text-4xl font-bold text-green-500">{approved}</span>
          <span className="text-xs uppercase tracking-widest text-white/50 mt-2">Approved</span>
        </div>
        <div className="border border-white/20 p-6 flex flex-col justify-center items-center">
          <span className="text-4xl font-bold text-orange-500">{pending}</span>
          <span className="text-xs uppercase tracking-widest text-white/50 mt-2">Pending</span>
        </div>
        <div className="border border-white/20 p-6 flex flex-col justify-center items-center">
          <span className="text-4xl font-bold text-red-500">{rejected}</span>
          <span className="text-xs uppercase tracking-widest text-white/50 mt-2">Rejected</span>
        </div>
      </div>

      <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Project Submissions</h2>
      <div className="border border-white/20">
        {projects.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-white/50 uppercase tracking-widest">No submissions yet</div>
        ) : (
          <div className="divide-y divide-white/20">
            {projects.map(p => (
              <div key={p.id} className="p-4 flex justify-between items-center bg-transparent transition-colors hover:bg-white/5">
                <Link href={`/projects/${p.id}`} className="font-bold hover:text-[#ff6a00] transition-colors">{p.title}</Link>
                <div className="flex items-center space-x-4">
                  <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 ${
                    p.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    p.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {p.status}
                  </span>
                  <span className="text-xs text-white/50 font-mono">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  {isAdmin && (
                    <Link href={`/admin?project=${p.id}`} className="text-xs uppercase hover:underline">Manage</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
