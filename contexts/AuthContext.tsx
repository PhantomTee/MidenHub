'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInAnonymously, TwitterAuthProvider, GithubAuthProvider, linkWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import WalletConnectModal from '@/components/WalletConnectModal';

// Add isProfileComplete to the type
export interface MidenUserProfile {
  username: string;
  walletAddress: string;
  avatarUrl: string;
  bio: string;
  githubUrl: string;
  twitterUrl: string;
  isAdmin: boolean;
  isProfileComplete: boolean;
}

interface MidenAuthContextType {
  user: User | null;
  profile: MidenUserProfile | null;
  accountId: string | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithMiden: () => void; // changed from Promise<void> for modal trigger
  linkTwitter: () => Promise<void>;
  linkGithub: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const MidenAuthContext = createContext<MidenAuthContextType>({
  user: null,
  profile: null,
  accountId: null,
  isAdmin: false,
  loading: true,
  loginWithMiden: () => {},
  linkTwitter: async () => {},
  linkGithub: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MidenUserProfile | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Restore account ID from local storage
  useEffect(() => {
    const storedAccountId = localStorage.getItem("miden_account_id");
    if (storedAccountId) {
      setAccountId(storedAccountId);
    }
  }, []);

  const fetchProfile = async (uid: string, mId: string) => {
    try {
      // Use mId (Miden Address) as the document ID to match the new architecture
      const docRef = doc(db, 'users', mId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as MidenUserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${mId}`, auth);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      const mId = localStorage.getItem("miden_account_id");
      if (u && mId) {
        await fetchProfile(u.uid, mId);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [accountId]);

  const loginWithMiden = () => {
    setIsWalletModalOpen(true);
  };

  const actualLoginWithMiden = async () => {
    try {
      setLoading(true);
      
      const provider = typeof window !== 'undefined' ? (window as any).midenWallet : null;
      
      if (!provider) {
        alert("Miden Wallet extension not detected! Please install the Miden Wallet extension.");
        setIsWalletModalOpen(false);
        setLoading(false);
        return;
      }
      
      const accounts = await provider.request({ method: 'miden_requestAccounts' });

      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        
        // Store in local storage
        localStorage.setItem("miden_account_id", addr);
        setAccountId(addr);

        // Sign in to Firebase Auth (Anonymously) so we have standard Firebase capabilities
        const userCred = await signInAnonymously(auth);
        
        // The profile fetch will be triggered by onAuthStateChanged listener above, 
        // but ensure we try to get or create document instantly
        await fetchProfile(userCred.user.uid, addr);

        setIsWalletModalOpen(false); // Close Modal on success
      }
    } catch (error) {
      console.error("Miden Login Failed", error);
      alert("Failed to connect Miden Wallet");
      setIsWalletModalOpen(false); // Close on error
    } finally {
      setLoading(false);
    }
  };

  const linkTwitter = async () => {
    if (!user || !accountId) return;
    try {
      const provider = new TwitterAuthProvider();
      const userCred = await linkWithPopup(user, provider);
      // Update our document
      const docRef = doc(db, 'users', user.uid);
      const twitterHandle = userCred.user.displayName || ""; // Simplified handle fetch
      
      await updateDoc(docRef, { 
        twitterUrl: `https://twitter.com/${twitterHandle}`,
        isProfileComplete: !!(profile?.githubUrl) // if github is already present, profile is complete
      });
      await fetchProfile(user.uid, accountId);
    } catch (e: any) {
      console.error("Failed to link Twitter", e);
      alert("Twitter integration Failed: " + e.message);
    }
  };

  const linkGithub = async () => {
    if (!user || !accountId) return;
    try {
      const provider = new GithubAuthProvider();
      const userCred = await linkWithPopup(user, provider);
      
      const docRef = doc(db, 'users', user.uid);
      // user.providerData can parse GitHub email/displayName
      let ghHandle = "";
      // Normally userCred.user.providerData[...].uid or screenName is available
      if (userCred.user.displayName) {
          ghHandle = userCred.user.displayName.replace(/ /g, '');
      }

      await updateDoc(docRef, { 
        githubUrl: `https://github.com/${ghHandle}`,
        isProfileComplete: !!(profile?.twitterUrl) 
      });
      await fetchProfile(user.uid, accountId);
    } catch (e: any) {
      console.error("Failed to link GitHub", e);
      alert("GitHub integration Failed: " + e.message);
    }
  };

  const logout = async () => {
    localStorage.removeItem("miden_account_id");
    setAccountId(null);
    setProfile(null);
    await auth.signOut();
  };

  return (
    <MidenAuthContext.Provider value={{ user, profile, accountId, isAdmin: profile?.isAdmin || false, loading, loginWithMiden, linkTwitter, linkGithub, logout, refreshProfile: async () => { if (user && accountId) await fetchProfile(user.uid, accountId); } }}>
      {children}
      <WalletConnectModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
        onConnect={actualLoginWithMiden} 
      />
    </MidenAuthContext.Provider>
  );
}

export const useAuth = () => useContext(MidenAuthContext);
