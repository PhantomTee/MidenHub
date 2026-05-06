import { Loader2 } from 'lucide-react';

export default function Preloader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="w-12 h-12 text-[#ff6a00] animate-spin" />
      <p className="text-sm font-bold uppercase tracking-widest text-[#ff6a00] animate-pulse">
        {message}
      </p>
    </div>
  );
}
