import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Construction } from 'lucide-react';

interface GenericPageViewProps {
  title: string;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

const GenericPageView: React.FC<GenericPageViewProps> = ({ title, onBack, theme = 'light' }) => {
  const isDark = theme === 'dark';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute inset-0 flex flex-col z-[200] overflow-hidden bg-[#050505] text-white font-mono`}
    >
      {/* Header */}
      <div className="pt-12 pb-4 px-4 flex items-center border-b border-white/10 shrink-0 bg-zinc-900 shadow-lg relative z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="ml-2">
          <h1 className="font-black text-[14px] uppercase tracking-widest">{title}</h1>
          <p className="text-[8px] text-red-500 font-bold uppercase tracking-tighter">ACCESSING LAYER_02 // RESTRICTED</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center relative">
        {/* Background Grids */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="relative mb-12">
          <motion.div 
            animate={{ 
              rotate: [0, 90, 180, 270, 360],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 rounded-full border-4 border-dashed border-red-600/30 flex items-center justify-center"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.3)] border border-white/20">
              <Construction size={40} className="text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-4 max-w-sm">
          <h2 className="text-2xl font-black italic tracking-tight text-white uppercase italic">SYSTEM_UPGRADE_IN_PROGRESS</h2>
          <div className="h-px w-24 bg-red-600 mx-auto" />
          <p className="text-[11px] text-zinc-500 leading-relaxed uppercase tracking-wide">
            The <span className="text-red-500 font-black">{title}</span> sub-module is currently being recalibrated by SHΔDØW CORE developers to ensure maximum operational efficiency and security.
          </p>
        </div>
        
        <div className="mt-12 space-y-3 w-full max-w-xs">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Compiler Progress</span>
            <span className="text-[10px] font-black text-red-500 font-mono">87.4%</span>
          </div>
          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '87.4%' }}
              transition={{ duration: 2, ease: "circOut" }}
              className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
            />
          </div>
          <div className="flex items-center gap-2 justify-center">
             <div className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
             <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Injecting dependencies...</p>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="mt-16 group relative"
        >
          <div className="absolute inset-0 bg-red-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative px-12 py-4 bg-white text-black font-black text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-transform">
            Return to Core
          </div>
        </button>
      </div>

      {/* Footer Status */}
      <div className="p-4 bg-zinc-900 border-t border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Protocol: Secure</span>
        </div>
        <span className="text-[8px] text-zinc-600 font-mono">ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
      </div>
    </motion.div>
  );
};

export default GenericPageView;
