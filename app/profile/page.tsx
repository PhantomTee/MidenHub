'use client';

import { useAuth } from '@/contexts/AuthContext';
import Preloader from '@/components/Preloader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Link2, Code, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, profile, accountId, loading, linkTwitter, linkGithub } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !accountId)) {
      router.push('/');
    }
  }, [user, accountId, loading, router]);

  if (loading) return <Preloader message="Loading Profile..." />;
  if (!user || !accountId || !profile) return null;

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
              onClick={linkTwitter}
              disabled={!!profile.twitterUrl}
              className={`flex items-center justify-center p-4 border-2 transition-colors font-bold uppercase tracking-widest text-xs ${
                profile.twitterUrl 
                ? 'border-green-500/50 bg-green-500/10 text-green-500 cursor-not-allowed'
                : 'border-white/20 hover:border-[#1DA1F2] hover:text-[#1DA1F2]'
              }`}
            >
              <Link2 className="w-5 h-5 mr-3" />
              {profile.twitterUrl ? 'Twitter Linked' : 'Connect Twitter'}
            </button>

            <button
              onClick={linkGithub}
              disabled={!!profile.githubUrl}
              className={`flex items-center justify-center p-4 border-2 transition-colors font-bold uppercase tracking-widest text-xs ${
                profile.githubUrl 
                ? 'border-green-500/50 bg-green-500/10 text-green-500 cursor-not-allowed'
                : 'border-white/20 hover:border-white hover:text-white'
              }`}
            >
              <Code className="w-5 h-5 mr-3" />
              {profile.githubUrl ? 'GitHub Linked' : 'Connect GitHub'}
            </button>
          </div>
        </div>

        {profile.isProfileComplete && (
          <div className="mt-8 p-4 bg-green-500/10 border border-green-500/50 text-green-500 text-sm font-bold flex items-center">
            <CheckCircle className="w-5 h-5 mr-3" />
            Profile Complete! You can now submit projects.
          </div>
        )}
      </div>
    </div>
  );
}
