'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { uploadImageToStorage } from '@/lib/storage';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import Link from 'next/link';
import Preloader from '@/components/Preloader';
import { Edit2, ExternalLink, Save, X, Code, Link2, Wallet, User as UserIcon } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  status: string;
  createdAt: number;
}

export default function Dashboard() {
  const { user, profile, isAdmin, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    walletAddress: '',
    bio: '',
    githubUrl: '',
    twitterUrl: '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && (!user || !profile?.walletAddress)) {
      router.push('/');
    } else if (user && profile) {
      fetchProjects();
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        walletAddress: profile.walletAddress || '',
        bio: profile.bio || '',
        githubUrl: profile.githubUrl || '',
        twitterUrl: profile.twitterUrl || '',
      });
    }
  }, [profile]);

  async function fetchProjects() {
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');

    try {
      const docRef = doc(db, 'users', user.uid);
      const updates: any = { ...formData };
      
      if (avatar) {
        try {
          const avatarUrl = await uploadImageToStorage(avatar, `avatars/${user.uid}_${Date.now()}`);
          updates.avatarUrl = avatarUrl;
        } catch (uploadError: any) {
          console.error("Upload error falling back to base64", uploadError);
          const base64Avatar = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(avatar);
          });
          updates.avatarUrl = base64Avatar;
        }
      }

      await updateDoc(docRef, updates);
      await refreshProfile();
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
      setMessage('Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || dataLoading) return <Preloader message="Loading User Dashboard..." />;
  if (error) return <div className="p-12 text-center text-red-500 bg-red-500/10 border border-red-500/50 m-6">{error.includes('index') ? 'A Firestore composite index is missing. Check the console for the creation link.' : error}</div>;
  if (!user || !profile) return null;

  const approved = projects.filter(p => p.status === 'approved').length;
  const pending = projects.filter(p => p.status === 'pending').length;
  const rejected = projects.filter(p => p.status === 'rejected').length;

  let completion = 0;
  if (profile.username && profile.username !== `Builder_${profile.walletAddress.substring(0,6)}`) completion += 20;
  if (profile.walletAddress) completion += 20;
  if (profile.bio) completion += 20;
  if (profile.isProfileComplete) completion += 20;
  if (profile.avatarUrl || avatar) completion += 20;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="relative border border-white/20 p-8 mb-8 bg-black/40 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6a00]/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full border border-white/20 overflow-hidden bg-black flex -shrink-0 items-center justify-center">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-white/50" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter uppercase mb-1">
                {profile.username || 'Anonymous User'}
              </h1>
              {profile.walletAddress && (
                <div className="flex items-center space-x-2 text-[#ff6a00] text-xs font-mono mb-2 bg-[#ff6a00]/10 px-2 py-1 rounded">
                  <Wallet className="w-4 h-4" />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]" title={profile.walletAddress}>
                    {profile.walletAddress}
                  </span>
                </div>
              )}
              <div className="flex space-x-4">
                {profile.twitterUrl && (
                  <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#ff6a00] transition-colors flex items-center space-x-1 uppercase tracking-widest text-[10px] font-bold">
                    <Link2 className="w-3 h-3" />
                    <span>Twitter</span>
                  </a>
                )}
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#ff6a00] transition-colors flex items-center space-x-1 uppercase tracking-widest text-[10px] font-bold">
                    <Code className="w-3 h-3" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {isAdmin && <span className="bg-[#ff6a00] text-black text-xs font-bold uppercase tracking-widest px-3 py-1">Admin Mode</span>}
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-[#ff6a00] hover:text-[#ff6a00] transition-all"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {profile.bio && !isEditing && (
          <div className="mt-6 pt-6 border-t border-white/10 text-sm text-white/80 max-w-2xl leading-relaxed relative z-10">
            {profile.bio}
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 mb-8 text-sm font-bold border uppercase tracking-widest ${message.includes('Error') ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-green-500/50 text-green-500 bg-green-500/10'}`}>
          {message}
        </div>
      )}

      {isEditing && (
        <div className="mb-12 border border-[#ff6a00]/30 bg-[#ff6a00]/5 p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-widest text-[#ff6a00]">Edit Profile Details</h2>
            <button onClick={() => setIsEditing(false)} className="text-white/50 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Profile Completion</span>
              <span className="text-sm font-bold font-mono text-[#ff6a00]">{completion}%</span>
            </div>
            <div className="flex-1 h-2 bg-black border border-white/20">
              <div 
                className="h-full bg-[#ff6a00] transition-all duration-500" 
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6 flex flex-col items-stretch">
            <div className="w-full">
              <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-white/80">Avatar</label>
              <div className="flex items-center space-x-4">
                {profile.avatarUrl && !avatar && (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-16 h-16 object-cover border border-white/20" />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                  className="text-sm border border-white/20 p-2 w-full bg-black/50 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer h-[58px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-white/80">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full border border-white/20 bg-black/50 p-4 focus:outline-none focus:border-[#ff6a00] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-white/80">Miden Wallet Address</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formData.walletAddress}
                    disabled={true}
                    className="w-full border border-white/20 bg-black/50 p-4 focus:outline-none transition-colors font-mono text-sm disabled:opacity-50 text-[#ff6a00]"
                  />
                </div>
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-white/80">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full border border-white/20 bg-black/50 p-4 focus:outline-none focus:border-[#ff6a00] transition-colors h-32"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-white/80">GitHub URL</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="url"
                    value={formData.githubUrl}
                    disabled
                    className="flex-1 w-full border border-white/20 bg-black/50 p-4 focus:outline-none transition-colors disabled:opacity-50"
                  />
                  <Link href="/profile" className="text-xs uppercase font-bold tracking-widest text-[#ff6a00] hover:text-white transition-colors">Manage &rarr;</Link>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-white/80">Twitter / X URL</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="url"
                    value={formData.twitterUrl}
                    disabled
                    className="flex-1 w-full border border-white/20 bg-black/50 p-4 focus:outline-none transition-colors disabled:opacity-50"
                  />
                  <Link href="/profile" className="text-xs uppercase font-bold tracking-widest text-[#ff6a00] hover:text-white transition-colors">Manage &rarr;</Link>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center items-center space-x-2 bg-white text-black py-4 font-bold uppercase tracking-widest transition-colors hover:bg-[#ff6a00] hover:text-white disabled:opacity-50 mt-4 border border-white hover:border-[#ff6a00]"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </form>
        </div>
      )}

      <h2 className="text-xl font-bold uppercase tracking-tighter mb-6 relative inline-block">
        Dashboard Stats
        <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-[#ff6a00]" />
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <div className="border border-white/20 p-6 flex flex-col justify-center items-center bg-white/5">
          <span className="text-4xl font-mono text-white">{projects.length}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-white/50 mt-2">Total</span>
        </div>
        <div className="border border-green-500/20 p-6 flex flex-col justify-center items-center bg-green-500/5">
          <span className="text-4xl font-mono text-green-400">{approved}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-green-500/70 mt-2">Approved</span>
        </div>
        <div className="border border-orange-500/20 p-6 flex flex-col justify-center items-center bg-orange-500/5">
          <span className="text-4xl font-mono text-orange-400">{pending}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500/70 mt-2">Pending</span>
        </div>
        <div className="border border-red-500/20 p-6 flex flex-col justify-center items-center bg-red-500/5">
          <span className="text-4xl font-mono text-red-400">{rejected}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-red-500/70 mt-2">Rejected</span>
        </div>
      </div>

      <h2 className="text-xl font-bold uppercase tracking-tighter mb-6 relative inline-block">
        Your Submissions
        <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-[#ff6a00]" />
      </h2>
      <div className="border border-white/20 bg-black">
        {projects.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">No submissions yet.</p>
            <Link href="/submit" className="border border-[#ff6a00] text-[#ff6a00] px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-[#ff6a00] hover:text-black transition-colors">
              Submit Your First Project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/20">
            {projects.map(p => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center bg-transparent transition-colors hover:bg-white/5 gap-4">
                <Link href={`/projects/${p.id}`} className="font-bold hover:text-[#ff6a00] transition-colors text-lg flex items-center space-x-2">
                  <span>{p.title}</span>
                  <ExternalLink className="w-4 h-4 text-white/30" />
                </Link>
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${
                    p.status === 'approved' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                    p.status === 'rejected' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                    'border-orange-500/50 text-orange-400 bg-orange-500/10'
                  }`}>
                    {p.status}
                  </span>
                  <span className="text-xs text-white/50 font-mono flex items-center gap-1">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  {isAdmin && (
                    <Link href={`/admin?project=${p.id}`} className="text-[10px] font-bold text-[#ff6a00] uppercase hover:underline border border-[#ff6a00]/30 px-2 py-1">Manage</Link>
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
