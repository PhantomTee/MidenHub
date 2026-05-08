import { ExternalLink, BookOpen, Code, MessageCircle } from 'lucide-react';

export default function Resources() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-[#ff6a00]">Miden Resources</h1>
        <p className="text-white/80 leading-relaxed text-lg mb-8 max-w-2xl">
          Everything you need to learn about, build on, and engage with Polygon Miden, a zero-knowledge rollup leveraging the Miden VM to provide high throughput and privacy-preserving smart contracts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Resource Card 1 */}
        <a href="https://docs.polygon.technology/miden/" target="_blank" rel="noopener noreferrer" className="block border border-white/20 bg-black/50 p-6 hover:border-[#ff6a00] hover:bg-white/5 transition-all group">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="w-6 h-6 text-[#ff6a00]" />
            <h2 className="text-xl font-bold uppercase tracking-widest group-hover:text-[#ff6a00] transition-colors">Documentation</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            The official Polygon Miden documentation. Learn about Miden assembly, the Miden Client, account abstraction, and more.
          </p>
          <div className="flex items-center text-[#ff6a00] text-xs font-bold uppercase tracking-widest">
            <span>Read Docs</span>
            <ExternalLink className="w-3 h-3 ml-2" />
          </div>
        </a>

        {/* Resource Card 2 */}
        <a href="https://github.com/0xPolygonMiden" target="_blank" rel="noopener noreferrer" className="block border border-white/20 bg-black/50 p-6 hover:border-[#ff6a00] hover:bg-white/5 transition-all group">
          <div className="flex items-center space-x-3 mb-4">
            <Code className="w-6 h-6 text-[#ff6a00]" />
            <h2 className="text-xl font-bold uppercase tracking-widest group-hover:text-[#ff6a00] transition-colors">GitHub</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            Explore the source code of the Miden VM, the Miden Node, and the standard library. Contribute to the ecosystem directly.
          </p>
          <div className="flex items-center text-[#ff6a00] text-xs font-bold uppercase tracking-widest">
            <span>View GitHub</span>
            <ExternalLink className="w-3 h-3 ml-2" />
          </div>
        </a>

        {/* Resource Card 3 */}
        <a href="https://discord.com/invite/0xPolygon" target="_blank" rel="noopener noreferrer" className="block border border-white/20 bg-black/50 p-6 hover:border-[#ff6a00] hover:bg-white/5 transition-all group">
          <div className="flex items-center space-x-3 mb-4">
            <MessageCircle className="w-6 h-6 text-[#ff6a00]" />
            <h2 className="text-xl font-bold uppercase tracking-widest group-hover:text-[#ff6a00] transition-colors">Discord Community</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            Join the developer ecosystem. Ask questions, share your Miden projects, and stay up to date with the protocol developments.
          </p>
          <div className="flex items-center text-[#ff6a00] text-xs font-bold uppercase tracking-widest">
            <span>Join Discord</span>
            <ExternalLink className="w-3 h-3 ml-2" />
          </div>
        </a>

        {/* Resource Card 4 */}
        <a href="https://play.miden.network" target="_blank" rel="noopener noreferrer" className="block border border-white/20 bg-black/50 p-6 hover:border-[#ff6a00] hover:bg-white/5 transition-all group">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-6 h-6 border-2 border-[#ff6a00] rounded flex items-center justify-center">
              <span className="w-2 h-2 bg-[#ff6a00] rounded-full"></span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest group-hover:text-[#ff6a00] transition-colors">Miden Playground</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            Experiment with Miden's novel architecture in our very own training environment.
          </p>
          <div className="flex items-center text-[#ff6a00] text-xs font-bold uppercase tracking-widest">
            <span>Visit Playground</span>
            <ExternalLink className="w-3 h-3 ml-2" />
          </div>
        </a>
      </div>
    </div>
  );
}
