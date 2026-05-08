'use client';

import { useAuth } from '@/contexts/AuthContext';
import Preloader from '@/components/Preloader';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Link2, Code, CheckCircle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { GithubAuthProvider, TwitterAuthProvider, signInWithPopup } from 'firebase/auth';

export default function ProfileSetup() {
  const { user, profile, accountId, loading, refreshProfile } = useAuth();
  const router = useRouter();
  
  const [socials, setSocials] = useState<{ twitter: string | null, github: string | null }>({ 
    twitter: null, 
    github: null 
  });
  
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !accountId)) {
      router.push('/');
    }
  }, [user, accountId, loading, router]);
  
  // If the user already has a profile linked in the DB (i.e. we fetched it), we can prepopulate socials
  useEffect(() => {
    if (profile) {
      setSocials({
        twitter: profile.twitterUrl ? profile.twitterUrl.split('/').pop() || 'Linked' : null,
        github: profile.githubUrl ? profile.githubUrl.split('/').pop() || 'Linked' : null,
      });
    }
  }, [profile]);

  // 1. Handle Social Connections
  const connectSocial = async (providerName: 'github' | 'twitter') => {
    const provider = providerName === 'github' 
      ? new GithubAuthProvider() 
      : new TwitterAuthProvider();
      
    try {
      const result = await signInWithPopup(auth, provider);
      const connectedUser = result.user;
      
      const userInfo: any = (connectedUser as any).reloadUserInfo;
      setSocials(prev => ({
        ...prev,
        [providerName]: userInfo.screenName || connectedUser.displayName || `${providerName}_linked`
      }));
    } catch (error) {
      console.error(`Failed to link ${providerName}`, error);
      alert(`Could not connect ${providerName}`);
    }
  };

  // 2. The Final Submission (Sending everything to Firebase)
  const saveHubAccount = async () => {
    if (!accountId || !socials.github || !socials.twitter) {
      alert("Please connect your Miden Wallet and BOTH social accounts first!");
      return;
    }

    setLinking(true);
    try {
      // Using the Miden Address as the document ID
      await setDoc(doc(db, "users", accountId), {
        username: `Builder_${accountId.slice(0, 6)}`,
        walletAddress: accountId,
        githubUrl: `https://github.com/${socials.github}`,
        twitterUrl: `https://twitter.com/${socials.twitter}`,
        bio: '',
        avatarUrl: '',
        updatedAt: Date.now(),
        isProfileComplete: true,
        isAdmin: false
      });
      alert("Profile Linked to Miden Hub!");
      await refreshProfile();
    } catch (e) {
      console.error("Link Error", e);
      alert("Uh oh! Failed to link profile.");
    } finally {
      setLinking(false);
    }
  };

  if (loading) return <Preloader message="Loading Profile..." />;
  if (!user || !accountId) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-8 text-[#ff6a00]">Profile Setup</h1>
      
      <div className="bg-white/5 border border-white/20 p-8 space-y-8">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Miden Identity</h2>
          <div className="flex items-center space-x-2 text-[#ff6a00] font-mono text-sm bg-[#ff6a00]/10 p-4 border border-[#ff6a00]/30">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{accountId}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Social Connections</h2>
          <p className="text-sm text-white/70 mb-4">
            Link your social accounts to complete your developer profile. Both Twitter and GitHub are required to submit projects to MidenHub.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => connectSocial('twitter')}
              disabled={!!socials.twitter || !!profile?.twitterUrl}
              className={`flex items-center justify-center p-4 border-2 transition-colors font-bold uppercase tracking-widest text-xs ${
                socials.twitter || profile?.twitterUrl 
                ? 'border-green-500/50 bg-green-500/10 text-green-500 cursor-not-allowed'
                : 'border-white/20 hover:border-[#1DA1F2] hover:text-[#1DA1F2]'
              }`}
            >
              <Link2 className="w-5 h-5 mr-3" />
              {socials.twitter ? `Linked: ${socials.twitter}` : 'Connect Twitter'}
            </button>

            <button
              onClick={() => connectSocial('github')}
              disabled={!!socials.github || !!profile?.githubUrl}
              className={`flex items-center justify-center p-4 border-2 transition-colors font-bold uppercase tracking-widest text-xs ${
                socials.github || profile?.githubUrl 
                ? 'border-green-500/50 bg-green-500/10 text-green-500 cursor-not-allowed'
                : 'border-white/20 hover:border-white hover:text-white'
              }`}
            >
              <Code className="w-5 h-5 mr-3" />
              {socials.github ? `Linked: ${socials.github}` : 'Connect GitHub'}
            </button>
          </div>
        </div>
        
        {(!profile || !profile.isProfileComplete) && (
          <button 
            className="w-full mt-10 bg-[#ff6a00] text-black font-black uppercase tracking-widest p-4 rounded hover:bg-[#ff8c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={saveHubAccount}
            disabled={!socials.github || !socials.twitter || linking}
          >
            {linking ? 'Linking...' : 'Complete Hub Registration'}
          </button>
        )}

        {profile?.isProfileComplete && (
          <div className="mt-8 p-4 bg-green-500/10 border border-green-500/50 text-green-500 text-sm font-bold flex items-center">
            <CheckCircle className="w-5 h-5 mr-3" />
            Profile Complete! You can now submit projects.
          </div>
        )}
      </div>
    </div>
  );
}
