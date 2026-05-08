'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { uploadImageToStorage } from '@/lib/storage';
import Link from 'next/link';
import Preloader from '@/components/Preloader';
import { ExternalLink, Code, ArrowLeft, Trash2, Edit, Save, X } from 'lucide-react';
import ProjectInteractions from '@/components/ProjectInteractions';

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
  upvotesCount?: number;
}

export default function ProjectDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, isAdmin, profile } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [ownerUsername, setOwnerUsername] = useState('Unknown Developer');
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    githubUrl: '',
    demoUrl: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const pData = { id: docSnap.id, ...docSnap.data() } as Project;
          setProject(pData);
          setFormData({
            title: pData.title || '',
            description: pData.description || '',
            category: pData.category || '',
            githubUrl: pData.githubUrl || '',
            demoUrl: pData.demoUrl || '',
          });
          
          if (pData.ownerId) {
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
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `projects/${id}`, auth);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) return <Preloader message="Loading Project Details..." />;
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    try {
      if (formData.githubUrl) new URL(formData.githubUrl);
      if (formData.demoUrl) new URL(formData.demoUrl);
    } catch (_) {
      setErrorMessage('Validation Error: Please provide valid URLs for GitHub and Demo links (e.g., https://...).');
      return;
    }

    if (image && image.size > 5 * 1024 * 1024) {
      setErrorMessage('File Error: The uploaded image must be less than 5MB.');
      return;
    }

    setSaving(true);

    try {
      let imageUrl = project.imageUrl;
      if (image && user) {
        try {
          imageUrl = await uploadImageToStorage(image, `projects/${user.uid}_${Date.now()}`);
        } catch (uploadError: any) {
          console.error("Upload error falling back to base64", uploadError);
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(image);
          });
        }
      }

      const updates = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        githubUrl: formData.githubUrl,
        demoUrl: formData.demoUrl,
        imageUrl: imageUrl,
        updatedAt: Date.now(),
      };

      await updateDoc(doc(db, 'projects', id), updates);
      setProject({ ...project, ...updates });
      setIsEditing(false);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`, auth);
      setErrorMessage(error.message || 'Error saving project');
    } finally {
      setSaving(false);
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

      {isEditing ? (
        <div className="border border-[#ff6a00]/50 bg-[#ff6a00]/5 p-6 md:p-8 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold uppercase tracking-widest text-[#ff6a00]">Edit Project</h2>
            <button onClick={() => setIsEditing(false)} className="text-white/50 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {errorMessage && (
            <div className="border border-red-500/50 bg-red-500/10 text-red-500 font-bold p-4 mb-6 text-sm uppercase tracking-widest">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Project Title</label>
              <input
                type="text"
                required
                maxLength={100}
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-white/20 bg-black/50 p-4 focus:outline-none focus:border-[#ff6a00]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Description</label>
              <textarea
                required
                maxLength={2000}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full h-40 border border-white/20 bg-black/50 p-4 focus:outline-none focus:border-[#ff6a00]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-white/20 bg-black/50 p-4 focus:outline-none focus:border-[#ff6a00] appearance-none"
                >
                  <option value="" disabled className="text-black">Select Category</option>
                  <option value="DeFi" className="text-black">DeFi</option>
                  <option value="NFT" className="text-black">NFT</option>
                  <option value="Infrastructure" className="text-black">Infrastructure</option>
                  <option value="Gaming" className="text-black">Gaming</option>
                  <option value="DAO" className="text-black">DAO</option>
                  <option value="Other" className="text-black">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Update Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="text-sm border border-white/20 p-2 w-full bg-black/50 h-[58px] file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-bold file:uppercase file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">GitHub URL</label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                  className="w-full border border-white/20 bg-black/50 p-4 focus:outline-none focus:border-[#ff6a00]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Demo / Live URL</label>
                <input
                  type="url"
                  value={formData.demoUrl}
                  onChange={(e) => setFormData({...formData, demoUrl: e.target.value})}
                  className="w-full border border-white/20 bg-black/50 p-4 focus:outline-none focus:border-[#ff6a00]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center items-center bg-white text-black py-4 font-bold uppercase tracking-widest transition-colors hover:bg-[#ff6a00] hover:text-white disabled:opacity-50 mt-8"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      ) : (
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
            
            <ProjectInteractions projectId={id} initialUpvotes={project.upvotesCount || 0} />
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
                <button onClick={() => setIsEditing(true)} className="w-full flex justify-center items-center py-3 bg-white text-black font-bold uppercase text-xs tracking-widest hover:bg-[#ff6a00] hover:text-white transition-colors border-2 border-white hover:border-[#ff6a00]">
                  <Edit className="w-4 h-4 mr-2" /> Edit Project
                </button>
                <button onClick={handleDelete} className="w-full flex justify-center items-center py-3 bg-red-500/10 text-red-500 font-bold uppercase text-xs tracking-widest hover:bg-red-500 hover:text-black transition-colors border-2 border-red-500/50 hover:border-red-500">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
