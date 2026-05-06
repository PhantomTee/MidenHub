'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      
      const docRef = doc(db, 'users', userCred.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          username: userCred.user.displayName || userCred.user.email?.split('@')[0] || 'User',
          walletAddress: '',
          avatarUrl: userCred.user.photoURL || '',
          bio: '',
          githubUrl: '',
          twitterUrl: '',
          isAdmin: false,
        });
        router.push('/profile');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await setDoc(doc(db, 'users', userCred.user.uid), {
            username: username || email.split('@')[0],
            walletAddress: '',
            avatarUrl: '',
            bio: '',
            githubUrl: '',
            twitterUrl: '',
            isAdmin: false,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userCred.user.uid}`, auth);
        }
        router.push('/profile');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)] px-4">
      <div className="w-full max-w-md border border-white/20 p-8 bg-[#0a0a0a]">
        <h1 className="text-2xl font-bold mb-6 text-white uppercase tracking-tight">
          {isLogin ? 'Login to MidenHub' : 'Create Account'}
        </h1>
        {error && <div className="bg-red-500/10 text-red-500 p-3 mb-6 text-sm border border-red-500/50">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full border border-white/20 bg-transparent p-3 focus:outline-none focus:border-[#ff6a00]"
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full border border-white/20 bg-transparent p-3 focus:outline-none focus:border-[#ff6a00]"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-white/20 bg-transparent p-3 focus:outline-none focus:border-[#ff6a00]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest text-sm transition-colors hover:bg-[#ff6a00] hover:text-white disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 border-t border-white/20 pt-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-transparent border border-[#ff6a00] text-[#ff6a00] py-4 font-bold uppercase tracking-widest text-sm transition-colors hover:bg-[#ff6a00] hover:text-black disabled:opacity-50 flex justify-center items-center"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        <p className="mt-6 text-sm text-center text-white/50">
          {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#ff6a00] hover:underline font-bold"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
