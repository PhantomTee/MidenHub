import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Shield, Zap } from 'lucide-react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export default function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    onConnect();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#111] border-2 border-white/10 z-[101] shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold uppercase tracking-widest text-[#ff6a00]">Miden Wallet</h2>
                <button 
                  onClick={onClose}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!connecting ? (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <div className="w-20 h-20 bg-[#ff6a00]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#ff6a00]/30">
                      <Shield className="w-10 h-10 text-[#ff6a00]" />
                    </div>
                    <p className="text-white/70 text-sm font-medium">Create or connect your secure Polygon Miden testnet account.</p>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={handleConnect}
                      className="w-full relative overflow-hidden group bg-white text-black font-bold uppercase tracking-widest text-sm py-4 px-4 transition-all hover:bg-[#ff6a00]"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        <Key className="w-4 h-4 mr-2" />
                        Create / Connect ID
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#ff6a00]/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#ff6a00] border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-[#ff6a00] animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2 uppercase tracking-wide">Waiting for Wallet...</h3>
                    <p className="text-white/50 text-xs font-mono">Please approve the connection in the Miden Wallet popup.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-black/50 p-4 border-t border-white/5 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Zero-Knowledge L2 • Privacy Preserving
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
