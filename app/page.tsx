import Link from "next/link";
import { Compass, PlusCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6 py-20 text-center">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
          <span className="text-white">Discover</span><br/>
          <span className="text-[#ff6a00]">The Miden</span><br/>
          <span className="text-white">Ecosystem</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-medium">
          The ultimate directory for projects, games, and infrastructure building on Polygon Miden.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8">
          <Link
            href="/explore"
            className="flex items-center space-x-2 bg-[#ff6a00] text-black px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors w-full sm:w-auto justify-center"
          >
            <Compass className="w-5 h-5" />
            <span>Explore Projects</span>
          </Link>
          <Link
            href="/submit"
            className="flex items-center space-x-2 bg-transparent text-white border-2 border-white/20 px-8 py-4 font-bold uppercase tracking-widest text-sm hover:border-[#ff6a00] hover:text-[#ff6a00] transition-colors w-full sm:w-auto justify-center"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Submit Yours</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
