import React, { useEffect } from 'react';
import { Volume2, VolumeX, Play, Clapperboard, Sparkles } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, isMuted, onToggleMute }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        sound.playClapperboard();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 sm:p-12 pointer-events-auto bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 bg-black/60 border border-amber-500/30 backdrop-blur-none px-4 py-2 rounded-lg text-xs font-mono tracking-widest text-amber-400">
          <Clapperboard className="w-4 h-4 text-amber-400" />
          <span>PRODUCTION: PARAMOUNT HOLLYWOOD STUDIOS</span>
          <span className="text-slate-400 hidden sm:inline">| DIRECTORS CUT 4K</span>
        </div>

        <button
          onClick={onToggleMute}
          className="p-3 rounded-lg bg-black/60 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition cursor-pointer"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Hero Title Lockup */}
      <div className="max-w-2xl my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Cinematic 3D Auto-Battler & Director Studio
        </div>

        {/* Bespoke SVG Title Lockup */}
        <div className="mb-4">
          <svg viewBox="0 0 760 140" className="w-full max-w-xl h-auto filter drop-shadow-[0_4px_24px_rgba(245,158,11,0.35)]">
            <defs>
              <linearGradient id="hollywoodGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="80%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="battlerCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <text
              x="0"
              y="68"
              fill="url(#hollywoodGold)"
              fontFamily="Impact, sans-serif"
              fontSize="76"
              letterSpacing="4"
              fontWeight="900"
            >
              HOLLYWOOD
            </text>
            <text
              x="0"
              y="130"
              fill="url(#battlerCyan)"
              fontFamily="Impact, sans-serif"
              fontSize="68"
              letterSpacing="6"
              fontWeight="900"
            >
              BATTLER
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-base sm:text-lg font-light leading-relaxed mb-8 max-w-lg">
          Take the director&apos;s chair in spectacular 3D choreographies. Command stunt heroes, trigger bullet-time speed ramping, dynamic camera cuts, and deliver summer blockbuster finishers.
        </p>

        {/* Primary Start CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={() => {
              sound.playClapperboard();
              onStart();
            }}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black tracking-widest text-lg rounded-xl shadow-[0_0_35px_rgba(245,158,11,0.5)] active:scale-95 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>ENTER PRODUCTION STUDIO</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hints */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800 text-xs text-slate-400 font-mono">
        <div>
          <span className="text-amber-400 font-semibold">SPACE / ENTER</span> Start Production · <span className="text-cyan-400 font-semibold">C</span> Camera Cut · <span className="text-cyan-400 font-semibold">T</span> Bullet-Time · <span className="text-amber-400 font-semibold">1-3</span> Stunt Cues
        </div>
        <div className="tracking-widest">
          STATUS: <span className="text-emerald-400">CAMERAS READY (60 FPS)</span>
        </div>
      </div>
    </div>
  );
};
