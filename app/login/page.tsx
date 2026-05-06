'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
