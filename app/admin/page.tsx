'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import Preloader from '@/components/Preloader';

interface Project {
  id: string;
  title: string;
  category: string;
  ownerId: string;
  status: string;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        router.push('/');
      } else {
        fetchProjects();
      }
    }
  }, [user, isAdmin, loading, router]);

  const fetchProjects = async () => {
    try {
      const q = query(collection(db, 'projects'));
      const snapshot = await getDocs(q);
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
      try {
        handleFirestoreError(err, OperationType.GET, 'projects', auth);
      } catch (e) {}
    } finally {
      setFetching(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'projects', id), { status: newStatus });
      setProjects(projects.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (e: any) {
      alert(e.message);
      try {
        handleFirestoreError(e, OperationType.UPDATE, `projects/${id}`, auth);
      } catch (err) {}
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjects(projects.filter(p => p.id !== id));
    } catch (e: any) {
      alert(e.message);
      try {
        handleFirestoreError(e, OperationType.DELETE, `projects/${id}`, auth);
      } catch (err) {}
    }
  };

  if (loading || fetching) return <Preloader message="Loading Admin Dashboard..." />;
  if (error) return <div className="p-12 text-center text-red-500 bg-red-500/10 border border-red-500/50 m-6">{error}</div>;
  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-8 text-[#ff6a00]">Admin Dashboard</h1>

      <div className="border border-white/20">
        <table className="w-full text-left border-collapse disabled:opacity-50">
          <thead>
            <tr className="bg-white/5 border-b border-white/20">
              <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Project</th>
              <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Category</th>
              <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Status</th>
              <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold">{p.title}</td>
                <td className="p-4 text-sm text-white/70">{p.category}</td>
                <td className="p-4">
                  <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 ${
                    p.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    p.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {p.status !== 'approved' && (
                    <button onClick={() => handleUpdateStatus(p.id, 'approved')} className="text-xs bg-green-500 text-black px-3 py-1 font-bold uppercase tracking-widest hover:bg-white transition-colors">Approve</button>
                  )}
                  {p.status !== 'rejected' && (
                    <button onClick={() => handleUpdateStatus(p.id, 'rejected')} className="text-xs bg-red-500 text-black px-3 py-1 font-bold uppercase tracking-widest hover:bg-white transition-colors">Reject</button>
                  )}
                  <button onClick={() => handleDelete(p.id)} className="text-xs border border-red-500 text-red-500 px-3 py-1 font-bold uppercase tracking-widest hover:bg-red-500 hover:text-black transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && <div className="p-12 text-center text-white/50 text-sm font-bold uppercase tracking-widest">No projects in database.</div>}
      </div>
    </div>
  );
}
