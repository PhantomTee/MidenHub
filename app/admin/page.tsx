'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
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
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

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

  const handleUpdateStatus = async (id: string, newStatus: string, ownerId: string, title: string) => {
    try {
      await updateDoc(doc(db, 'projects', id), { status: newStatus });
      setProjects(projects.map(p => p.id === id ? { ...p, status: newStatus } : p));
      
      // Send notification
      await addDoc(collection(db, `users/${ownerId}/notifications`), {
        title: `Project ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your project "${title}" has been ${newStatus}.`,
        read: false,
        createdAt: Date.now()
      });
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
      setSelectedProjects(prev => prev.filter(projectId => projectId !== id));
    } catch (e: any) {
      alert(e.message);
      try {
        handleFirestoreError(e, OperationType.DELETE, `projects/${id}`, auth);
      } catch (err) {}
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProjects(projects.map(p => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const handleSelectProject = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, id]);
    } else {
      setSelectedProjects(prev => prev.filter(projectId => projectId !== id));
    }
  };

  const handleBulkAction = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to mark ${selectedProjects.length} projects as ${newStatus}?`)) return;
    
    try {
      const now = Date.now();
      await Promise.all(selectedProjects.map(async id => {
        const project = projects.find(p => p.id === id);
        if (project) {
          await updateDoc(doc(db, 'projects', id), { status: newStatus, updatedAt: now });
          await addDoc(collection(db, `users/${project.ownerId}/notifications`), {
            title: `Project ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
            message: `Your project "${project.title}" has been ${newStatus}.`,
            read: false,
            createdAt: now
          });
        }
      }));
      setProjects(projects.map(p => selectedProjects.includes(p.id) ? { ...p, status: newStatus } : p));
      setSelectedProjects([]);
    } catch (e: any) {
      alert('Bulk action failed: ' + e.message);
    }
  };

  if (loading || fetching) return <Preloader message="Loading Admin Dashboard..." />;
  if (error) return <div className="p-12 text-center text-red-500 bg-red-500/10 border border-red-500/50 m-6">{error}</div>;
  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-8 text-[#ff6a00]">Admin Dashboard</h1>

      {selectedProjects.length > 0 && (
        <div className="mb-4 flex items-center gap-4 bg-white/5 p-4 border border-white/20">
          <span className="text-sm font-bold uppercase tracking-widest text-[#ff6a00]">
            {selectedProjects.length} selected
          </span>
          <button 
            onClick={() => handleBulkAction('approved')}
            className="text-xs bg-green-500 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white transition-colors"
          >
            Approve Selected
          </button>
          <button 
            onClick={() => handleBulkAction('rejected')}
            className="text-xs bg-red-500 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white transition-colors"
          >
            Reject Selected
          </button>
        </div>
      )}

      <div className="border border-white/20">
        <table className="w-full text-left border-collapse disabled:opacity-50">
          <thead>
            <tr className="bg-white/5 border-b border-white/20">
              <th className="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="accent-[#ff6a00] w-4 h-4 cursor-pointer"
                  checked={selectedProjects.length === projects.length && projects.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Project</th>
              <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Category</th>
              <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Status</th>
              <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="p-4 text-center">
                  <input 
                    type="checkbox" 
                    className="accent-[#ff6a00] w-4 h-4 cursor-pointer"
                    checked={selectedProjects.includes(p.id)}
                    onChange={(e) => handleSelectProject(p.id, e.target.checked)}
                  />
                </td>
                <td className="p-4 font-bold">
                  <Link href={`/projects/${p.id}`} className="hover:text-[#ff6a00] hover:underline transition-colors block">
                    {p.title}
                  </Link>
                </td>
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
                    <button onClick={() => handleUpdateStatus(p.id, 'approved', p.ownerId, p.title)} className="text-xs bg-green-500 text-black px-3 py-1 font-bold uppercase tracking-widest hover:bg-white transition-colors">Approve</button>
                  )}
                  {p.status !== 'rejected' && (
                    <button onClick={() => handleUpdateStatus(p.id, 'rejected', p.ownerId, p.title)} className="text-xs bg-red-500 text-black px-3 py-1 font-bold uppercase tracking-widest hover:bg-white transition-colors">Reject</button>
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
