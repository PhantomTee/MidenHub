'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, increment, getDoc, getDocs, where, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Star, MessageSquare, Trash2, Send } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  createdAt: number;
}

export default function ProjectInteractions({ projectId, initialUpvotes = 0 }: { projectId: string; initialUpvotes?: number }) {
  const { user, profile, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvotesCount, setUpvotesCount] = useState(initialUpvotes);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    // Listen to comments
    const qComments = query(collection(db, `projects/${projectId}/comments`), orderBy('createdAt', 'desc'));
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      const comms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
      setComments(comms);
    }, (error) => {
      console.error(error);
    });

    // Handle initial upvote state if user logged in
    if (user) {
      const checkUpvote = async () => {
        const docRef = doc(db, `projects/${projectId}/upvotes`, user.uid);
        const docSnap = await getDoc(docRef);
        setHasUpvoted(docSnap.exists());
      };
      checkUpvote();
    }
    
    // Listen to upvotes document on the project itself to get the count
    const unsubscribeProject = onSnapshot(doc(db, 'projects', projectId), (docSnap) => {
      if (docSnap.exists()) {
        setUpvotesCount(docSnap.data().upvotesCount || 0);
      }
    });

    return () => {
      unsubscribeComments();
      unsubscribeProject();
    };
  }, [projectId, user]);

  const toggleUpvote = async () => {
    if (!user) {
      alert("Please connect your wallet to upvote.");
      return;
    }
    if (!profile?.walletAddress) {
      alert("You need a Miden wallet to upvote.");
      return;
    }

    try {
      const upvoteRef = doc(db, `projects/${projectId}/upvotes`, user.uid);
      const projectRef = doc(db, 'projects', projectId);

      if (hasUpvoted) {
        // Remove upvote
        await deleteDoc(upvoteRef);
        await updateDoc(projectRef, { upvotesCount: increment(-1) });
        setHasUpvoted(false);
      } else {
        // Add upvote
        await updateDoc(projectRef, { upvotesCount: increment(1) });
        await setDoc(upvoteRef, {
          userId: user.uid,
          createdAt: Date.now()
        });
        setHasUpvoted(true);
      }
    } catch (e: any) {
      console.error(e);
      alert('Failed to upvote: ' + e.message);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setSubmittingComment(true);

    try {
      await addDoc(collection(db, `projects/${projectId}/comments`), {
        text: newComment.trim(),
        authorId: user.uid,
        createdAt: Date.now()
      });
      setNewComment('');
    } catch (err: any) {
      console.error(err);
      alert('Failed to post comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete comment?')) return;
    try {
      await deleteDoc(doc(db, `projects/${projectId}/comments`, commentId));
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="mt-12 pt-12 border-t border-white/20">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center">
          <MessageSquare className="w-5 h-5 mr-3 text-[#ff6a00]" />
          Discussion & Feedback
        </h3>
        <button 
          onClick={toggleUpvote}
          className={`flex items-center gap-2 border px-4 py-2 font-bold uppercase tracking-widest text-xs transition-colors ${
            hasUpvoted 
              ? 'bg-[#ff6a00]/10 border-[#ff6a00] text-[#ff6a00] hover:bg-transparent' 
              : 'border-white/20 hover:border-[#ff6a00] hover:text-[#ff6a00]'
          }`}
        >
          <Star className={`w-4 h-4 ${hasUpvoted ? 'fill-[#ff6a00]' : ''}`} />
          {hasUpvoted ? 'Upvoted' : 'Upvote'}
          <span className="ml-2 bg-white/10 px-2 py-0.5 rounded text-white">{upvotesCount}</span>
        </button>
      </div>

      <div className="space-y-8">
        {/* Comment Form */}
        {user ? (
          <form onSubmit={handlePostComment} className="flex gap-4">
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ask a technical question or leave feedback..."
              maxLength={1000}
              className="flex-1 bg-white/5 border border-white/20 p-4 focus:outline-none focus:border-[#ff6a00] transition-colors"
            />
            <button 
              type="submit" 
              disabled={submittingComment || !newComment.trim()}
              className="bg-[#ff6a00] text-black px-6 font-bold uppercase tracking-widest text-xs disabled:opacity-50 hover:bg-white transition-colors"
            >
              {submittingComment ? '...' : <Send className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <div className="p-4 border border-white/20 bg-white/5 text-center">
            <span className="text-xs uppercase tracking-widest text-white/50 font-bold">Connect your Miden wallet to comment</span>
          </div>
        )}

        {/* Comment List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 border border-white/10 bg-black/50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#ff6a00]">User_{comment.authorId.substring(0, 4)}</span>
                  <span className="text-[10px] uppercase font-mono text-white/40">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                {(isAdmin || user?.uid === comment.authorId) && (
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-white/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="py-8 text-center text-white/30 text-xs font-bold uppercase tracking-widest">
              No comments yet. Be the first!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
