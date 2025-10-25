import React, { useState } from 'react';
import { InfoIcon, TrashIcon } from './Icons';

const ManifestoContent: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div 
    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div 
      className="bg-[#0F2D27] rounded-2xl max-w-2xl w-full p-6 md:p-8 text-[#F0EAD6] max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-2xl font-bold text-white mb-4">✨ The Pasteboard Manifesto</h2>
      <div className="space-y-4 prose prose-invert prose-p:text-[#F0EAD6] prose-h3:text-[#FFD166] max-w-none">
        <p>We believe in tools that are small, human‑scaled, and transparent. In a world where every keystroke and every file is siphoned into distant servers, we choose to keep our words, images, and sketches close — shared only with those in the same room, the same network, the same moment.</p>
        
        <h3 className="font-semibold">🌐 Local First</h3>
        <p>The network in your home, your café, your studio is enough. We don’t need the cloud to pass a line of text or a photo from one device to another. By keeping data local, we reclaim autonomy and reduce dependence on invisible intermediaries.</p>

        <h3 className="font-semibold">🧩 Simplicity as Power</h3>
        <p>One page, one drop-zone, one action: drag, paste, or share. No accounts, no logins, no labyrinth of features. The simplest possible tool often becomes the most liberating.</p>

        <h3 className="font-semibold">🤝 Shared Space</h3>
        <p>This pasteboard is not private property — it is a commons. Anyone connected can drop a file, a snippet, a sketch; anyone can browse. It is a reminder that technology can dissolve walls rather than build them.</p>

        <h3 className="font-semibold">🔍 Transparency and Trust</h3>
        <p>When you can read the entire system in a single glance, you know what it does and what it doesn’t. There are no hidden agendas, no secret harvesting. Trust is born from clarity.</p>

        <h3 className="font-semibold">🕊️ Ephemeral by Design</h3>
        <p>What is pasted today — text or file — may vanish tomorrow. This impermanence is not a flaw but a feature: it keeps the space light, uncluttered, and alive in the present.</p>
      </div>
       <button 
        onClick={onClose} 
        className="mt-6 bg-[#FF6B6B] text-black font-bold py-2 px-4 rounded-lg hover:bg-[#E55A5A] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A1D1A] focus:ring-[#FFD166]"
      >
        Close
      </button>
    </div>
  </div>
);

interface HeaderProps {
    serverAddress: string;
    onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ serverAddress, onReset }) => {
    const [showManifesto, setShowManifesto] = useState(false);

    return (
        <>
            <header className="p-4 sm:p-6 w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            Pasteboard
                        </h1>
                         {serverAddress && (
                            <div className="hidden sm:flex items-center gap-2 bg-[#0F2D27] px-3 py-1.5 rounded-full">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-sm font-mono text-[#4ECDC4]">{serverAddress}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowManifesto(true)}
                            className="p-2 rounded-full text-[#F0EAD6] hover:bg-[#0F2D27] hover:text-white transition-colors"
                            aria-label="Show Manifesto"
                        >
                            <InfoIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={onReset}
                            className="p-2 rounded-full text-[#FF6B6B] hover:bg-[#FF6B6B]/20 hover:text-[#FFAAAA] transition-colors"
                            aria-label="Reset Pasteboard"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>
            {showManifesto && <ManifestoContent onClose={() => setShowManifesto(false)} />}
        </>
    );
};

export default Header;