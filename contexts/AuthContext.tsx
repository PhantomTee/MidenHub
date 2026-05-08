'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInAnonymously, TwitterAuthProvider, GithubAuthProvider, linkWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

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
  loginWithMiden: () => Promise<void>;
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
  loginWithMiden: async () => {},
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

  // Restore account ID from local storage
  useEffect(() => {
    const storedAccountId = localStorage.getItem("miden_account_id");
    if (storedAccountId) {
      setAccountId(storedAccountId);
    }
  }, []);

  const fetchProfile = async (uid: string, mId: string) => {
    try {
      const docRef = doc(db, 'users', mId); // The user says: "Use the accountId as the document ID"
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as MidenUserProfile);
      } else {
        const defaultProfile: MidenUserProfile = {
          username: `Builder_${mId.slice(0, 6)}`,
          walletAddress: mId,
          avatarUrl: '',
          bio: '',
          githubUrl: '',
          twitterUrl: '',
          isAdmin: false,
          isProfileComplete: false,
        };
        await setDoc(docRef, defaultProfile);
        setProfile(defaultProfile);
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

  const loginWithMiden = async () => {
    try {
      setLoading(true);
      // 1. Init Miden WebClient
      const { MidenClient, AccountStorageMode } = await import('@miden-sdk/miden-sdk');
      const client = await MidenClient.createTestnet();

      let addr = localStorage.getItem("miden_account_id");

      if (!addr) {
        // Generating a new Wallet
        const newAccount = await client.accounts.create({
          storage: 'private'
        });
        addr = newAccount.id().toString();
      } else {
        // In reality, this would just fetch the account to ensure it's still accessible.
        // E.g. getAccount(addr) but since local storage serves as our local ID cache...
      }

      // Proving control can involve signing a transaction or requesting unauthenticated note (placeholder comment for now)
      // await client.syncState(); 

      // Terminate client
      client.terminate();

      // Store in local storage
      localStorage.setItem("miden_account_id", addr as string);
      setAccountId(addr as string);

      // Sign in to Firebase Auth (Anonymously) so we have standard Firebase capabilities
      const userCred = await signInAnonymously(auth);
      
      // The profile fetch will be triggered by onAuthStateChanged listener above, 
      // but ensure we try to get or create document instantly
      await fetchProfile(userCred.user.uid, addr as string);

    } catch (error) {
      console.error("Miden Login Failed", error);
      alert("Failed to connect Miden Wallet");
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
      const docRef = doc(db, 'users', accountId);
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
      
      const docRef = doc(db, 'users', accountId);
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
    </MidenAuthContext.Provider>
  );
}

export const useAuth = () => useContext(MidenAuthContext);
