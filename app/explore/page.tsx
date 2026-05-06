'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  status: string;
  createdAt: number;
}

export default function Explore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'DeFi', 'NFT', 'Infrastructure', 'Gaming', 'DAO', 'Other'];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(
          collection(db, 'projects'),
          where('status', '==', 'approved')
        );
        const querySnapshot = await getDocs(q);
        const fetchedProjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        
        // Sort locally to avoid needing a Firestore composite index
        fetchedProjects.sort((a, b) => b.createdAt - a.createdAt);
        
        setProjects(fetchedProjects);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching projects:", err);
        setError(err.message || 'An error occurred while fetching projects.');
        try {
          handleFirestoreError(err, OperationType.GET, 'projects', auth);
        } catch (e) {
          // ignore the throw from handleFirestoreError
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filtered = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  if (loading) return <div className="flex justify-center items-center h-64 text-white">Loading ecosystem...</div>;
  if (error) return <div className="flex flex-col justify-center items-center h-64 text-red-500 bg-red-500/10 p-6 border border-red-500/50">
    <p className="font-bold mb-2">Error loading ecosystem:</p>
    <p className="text-sm">{error.includes('index') ? 'A Firestore composite index is missing. Check the console for the creation link.' : error}</p>
  </div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold uppercase tracking-tighter mb-8">Explore Ecosystem</h1>
      
      <div className="flex flex-wrap gap-3 mb-10 border-b border-white/20 pb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 text-sm font-bold uppercase tracking-widest border border-white/20 transition-colors ${filter === cat ? 'bg-[#ff6a00] text-black border-[#ff6a00]' : 'hover:bg-white/10'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
          <div key={p.id} className="border border-white/20 flex flex-col group hover:border-[#ff6a00] transition-colors">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.title} className="w-full h-48 object-cover border-b border-white/20" />
            ) : (
              <div className="w-full h-48 bg-white/5 flex items-center justify-center border-b border-white/20">
                <span className="text-white/40 font-bold uppercase tracking-widest text-xs">No Image</span>
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-2">{p.category}</span>
              <h2 className="text-xl font-bold tracking-tight mb-3 line-clamp-1">{p.title}</h2>
              <p className="text-sm text-white/50 line-clamp-3 mb-6 flex-1">{p.description}</p>
              
              <Link href={`/projects/${p.id}`} className="mt-auto block text-center bg-white text-black py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#ff6a00] hover:text-black transition-colors">
                View Project
              </Link>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full py-12 text-center text-sm font-bold uppercase tracking-widest text-white/50">No projects found for {filter} category.</div>}
      </div>
    </div>
  );
}
