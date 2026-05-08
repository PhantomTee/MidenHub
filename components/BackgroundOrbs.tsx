'use client';

import { useEffect, useState } from 'react';

export default function BackgroundOrbs() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      <div className="absolute top-[20%] left-[10%] w-[15vw] h-[15vw] bg-[#ff6a00] rounded-full blur-[100px] animate-blob mix-blend-screen" />
      <div className="absolute top-[50%] right-[15%] w-[20vw] h-[20vw] bg-[#ff6a00] rounded-full blur-[120px] animate-blob mix-blend-screen" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[10%] left-[30%] w-[25vw] h-[25vw] bg-[#ff6a00] rounded-full blur-[150px] animate-blob mix-blend-screen" style={{ animationDelay: '4s' }} />
      <div className="absolute top-[10%] right-[40%] w-[10vw] h-[10vw] bg-[#ff6a00] rounded-full blur-[80px] animate-blob mix-blend-screen" style={{ animationDelay: '6s' }} />
    </div>
  );
}
