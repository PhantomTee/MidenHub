'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

export default function Profile() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

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
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');

    try {
      const docRef = doc(db, 'users', user.uid);
      const updates: any = { ...formData };
      
      // if avatar uploaded, handle here (mocked for now)

      await updateDoc(docRef, updates);
      await refreshProfile();
      setMessage('Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
      setMessage('Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-white">Loading profile...</div>;
  if (!user || !profile) return null;

  let completion = 0;
  if (profile.username) completion += 20;
  if (profile.walletAddress) completion += 20;
  if (profile.bio) completion += 20;
  if (profile.githubUrl || profile.twitterUrl) completion += 20;
  if (profile.avatarUrl || avatar) completion += 20; // optimistic

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold uppercase tracking-tighter mb-8">Your Profile</h1>
      
      <div className="mb-8 border border-white/20 p-6">
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Profile Completion</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1 h-2 bg-white/10 border border-white/20">
            <div 
              className="h-full bg-[#ff6a00] transition-all duration-500" 
              style={{ width: `${completion}%` }}
            />
          </div>
          <span className="text-sm font-bold font-mono">{completion}%</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 mb-8 text-sm border font-bold uppercase tracking-widest ${message.includes('Error') ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-[#ff6a00] text-[#ff6a00] bg-[#ff6a00]/10'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center sm:items-stretch">
        <div className="w-full">
          <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Avatar</label>
          <div className="flex items-center space-x-4">
            {profile.avatarUrl && !avatar && (
              <img src={profile.avatarUrl} alt="Avatar" className="w-16 h-16 object-cover border border-white/20" />
            )}
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] || null)}
              className="text-sm border border-white/20 p-2 w-full bg-transparent file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer h-[58px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full border border-white/20 bg-transparent p-4 focus:outline-none focus:border-[#ff6a00]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Wallet Address</label>
            <input
              type="text"
              value={formData.walletAddress}
              onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
              placeholder="0x..."
              className="w-full border border-white/20 bg-transparent p-4 focus:outline-none focus:border-[#ff6a00]"
            />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            className="w-full border border-white/20 bg-transparent p-4 focus:outline-none focus:border-[#ff6a00] h-32"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">GitHub URL</label>
            <input
              type="url"
              value={formData.githubUrl}
              onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
              className="w-full border border-white/20 bg-transparent p-4 focus:outline-none focus:border-[#ff6a00]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-[#ff6a00]">Twitter / X URL</label>
            <input
              type="url"
              value={formData.twitterUrl}
              onChange={(e) => setFormData({...formData, twitterUrl: e.target.value})}
              className="w-full border border-white/20 bg-transparent p-4 focus:outline-none focus:border-[#ff6a00]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest transition-colors hover:bg-[#ff6a00] hover:text-white disabled:opacity-50 mt-4 block"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
