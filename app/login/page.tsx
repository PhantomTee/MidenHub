'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Wallet } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleWalletConnect = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Initialize Miden Wallet (Client-side)
      const { WebClient, AccountStorageMode } = await import('@miden-sdk/miden-sdk');
      const RPC_ENDPOINT = "https://rpc.testnet.miden.io:443";
      
      // @ts-ignore
      const client = await WebClient.createClient(RPC_ENDPOINT);
      
      let addr = localStorage.getItem("account_id");
      
      if (!addr) {
        const newAccount = await client.newWallet(
            AccountStorageMode.private(), 
            true 
        );
        addr = newAccount.id().toBech32();
        localStorage.setItem("account_id", addr as string);
      }
      
      // We don't terminate client here because they might need it, but for auth we just need the address
      client.terminate();

      // 2. Authenticate anonymously with Firebase
      const userCred = await signInAnonymously(auth);
      
      // 3. Create or Fetch User Document
      const docRef = doc(db, 'users', userCred.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          username: `Builder_${addr?.slice(0, 6)}`,
          walletAddress: addr,
          avatarUrl: '',
          bio: '',
          githubUrl: '',
          twitterUrl: '',
          isAdmin: false,
        });
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred connecting your wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)] px-4">
      <div className="w-full max-w-md border border-white/20 p-12 bg-black flex flex-col items-center">
        <div className="w-16 h-16 bg-[#ff6a00]/10 flex items-center justify-center rounded-full mb-6 relative">
            <Wallet className="w-8 h-8 text-[#ff6a00]" />
            <div className="absolute inset-0 border border-[#ff6a00]/50 rounded-full animate-ping"></div>
        </div>
        <h1 className="text-2xl font-black mb-2 text-white uppercase tracking-tighter text-center">
          Connect Identity
        </h1>
        <p className="text-white/50 text-center mb-8 text-sm">
          MidenHub does not use traditional passwords. Connect your Miden testnet wallet to verify your identity natively using Zero-Knowledge proofs.
        </p>

        {error && <div className="w-full bg-red-500/10 text-red-500 p-4 mb-6 text-sm border border-red-500/50 font-mono break-words">{error}</div>}
        
        <button
          onClick={handleWalletConnect}
          disabled={loading}
          className="w-full bg-[#ff6a00] text-black py-4 font-bold uppercase tracking-widest text-sm transition-all hover:bg-white disabled:opacity-50 flex justify-center items-center gap-2 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
          <span className="relative z-10 text-black">
              {loading ? 'Initializing ZK Wallet...' : 'Connect Auto-Wallet'}
          </span>
        </button>
      </div>
    </div>
  );
}

