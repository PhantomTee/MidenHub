'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import Link from 'next/link';
import { ExternalLink, Code, ArrowLeft, Trash2, Edit } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  githubUrl: string;
  demoUrl: string;
  imageUrl: string;
  ownerId: string;
  status: string;
  createdAt: number;
}

export default function ProjectDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, isAdmin, profile } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [ownerUsername, setOwnerUsername] = useState('Unknown Developer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const pData = { id: docSnap.id, ...docSnap.data() } as Project;
          setProject(pData);
          
          // fetch owner info
          try {
            const ownerDoc = await getDoc(doc(db, 'users', pData.ownerId));
            if (ownerDoc.exists()) {
              const uData = ownerDoc.data();
              if (uData.username) setOwnerUsername(uData.username);
            }
          } catch (e) {
            console.error(e);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `projects/${id}`, auth);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-white font-bold uppercase tracking-widest">Loading project...</div>;
  if (!project) return <div className="p-12 text-center text-white font-bold uppercase tracking-widest">Project not found</div>;

  const isOwner = user?.uid === project.ownerId;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      router.push('/dashboard');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `projects/${id}`, auth);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link href="/explore" className="inline-flex items-center text-[#ff6a00] hover:text-white mb-8 font-bold text-sm tracking-widest uppercase transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Ecosystem
      </Link>

      {(isOwner || isAdmin) && project.status !== 'approved' && (
        <div className={`mb-8 p-4 border font-bold uppercase tracking-widest text-sm
          ${project.status === 'pending' ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}
        `}>
          Status: {project.status} {project.status === 'pending' ? '— Pending Review' : '— Action Required'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-white/20 pt-12">
        <div className="lg:col-span-2">
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={project.title} className="w-full h-[400px] object-cover border border-white/20 mb-8" />
          ) : (
            <div className="w-full h-[400px] border border-white/20 bg-white/5 flex items-center justify-center mb-8">
              <span className="text-white/40 uppercase tracking-widest font-bold">No Image Provided</span>
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">{project.title}</h1>
          <div className="flex items-center space-x-4 mb-8">
            <span className="bg-[#ff6a00] text-black px-3 py-1 text-xs font-bold uppercase tracking-widest">{project.category}</span>
            <span className="text-white/50 text-sm">By {ownerUsername}</span>
          </div>

          <div className="prose prose-invert prose-orange max-w-none">
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-white/20 p-6 bg-white/5">
            <h3 className="font-bold uppercase tracking-widest text-sm text-[#ff6a00] mb-4 border-b border-white/20 pb-2">Links</h3>
            <div className="space-y-4">
              {project.demoUrl ? (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-white hover:text-[#ff6a00] transition-colors font-bold text-sm tracking-widest uppercase">
                  <ExternalLink className="w-4 h-4 mr-3" />
                  Live Demo
                </a>
              ) : <span className="text-white/30 text-sm font-bold uppercase tracking-widest flex items-center"><ExternalLink className="w-4 h-4 mr-3"/>No Demo URL</span>}

              {project.githubUrl ? (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-white hover:text-[#ff6a00] transition-colors font-bold text-sm tracking-widest uppercase">
                  <Code className="w-4 h-4 mr-3" />
                  Source Code
                </a>
              ) : <span className="text-white/30 text-sm font-bold uppercase tracking-widest flex items-center"><Code className="w-4 h-4 mr-3"/>No GitHub URL</span>}
            </div>
          </div>

          {(isOwner || isAdmin) && (
            <div className="border border-white/20 p-6 bg-white/5 space-y-4">
              <h3 className="font-bold uppercase tracking-widest text-sm text-[#ff6a00] mb-4 border-b border-white/20 pb-2">Management</h3>
              <button onClick={() => alert('Editing not implemented in this demo')} className="w-full flex justify-center items-center py-3 bg-white text-black font-bold uppercase text-xs tracking-widest hover:bg-[#ff6a00] hover:text-white transition-colors border-2 border-white hover:border-[#ff6a00]">
                <Edit className="w-4 h-4 mr-2" /> Edit Project
              </button>
              <button onClick={handleDelete} className="w-full flex justify-center items-center py-3 bg-red-500/10 text-red-500 font-bold uppercase text-xs tracking-widest hover:bg-red-500 hover:text-black transition-colors border-2 border-red-500/50 hover:border-red-500">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
