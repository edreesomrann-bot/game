import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Film, RotateCcw, ArrowRight, Home } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface DirectorCutModalProps {
  winner: 'heroes' | 'boss';
  sceneTitle: string;
  stats: {
    totalDamage: number;
    crits: number;
    duration: number;
  };
  budgetEarned: number;
  onReplayTake: () => void;
  onNextScene: () => void;
  onReturnToStudio: () => void;
  hasNextScene: boolean;
}

export const DirectorCutModal: React.FC<DirectorCutModalProps> = ({
  winner,
  sceneTitle,
  stats,
  budgetEarned,
  onReplayTake,
  onNextScene,
  onReturnToStudio,
  hasNextScene,
}) => {
  const isVictory = winner === 'heroes';

  useEffect(() => {
    if (isVictory) {
      sound.playVictoryFanfare();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#06b6d4', '#ec4899', '#fbbf24'],
      });
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center relative overflow-hidden animate-scale-up">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Title */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 mb-4 text-amber-400">
          {isVictory ? <Trophy className="w-8 h-8" /> : <Film className="w-8 h-8" />}
        </div>

        <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
          {isVictory ? "DIRECTOR'S CUT: THAT'S A WRAP!" : 'SCENE FAILED · TAKE SCRAPPED'}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-2">
          {isVictory ? 'BLOCKBUSTER SUCCESS!' : 'DIRECTOR CALLED CUT!'}
        </h2>

        <p className="text-xs text-slate-300 font-mono mb-6">
          SCENE: <span className="text-amber-400 font-bold">{sceneTitle}</span>
        </p>

        {/* Rating & Review */}
        {isVictory && (
          <div className="bg-black/40 border border-amber-500/30 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
                98% CERTIFIED FRESH
              </span>
            </div>
            <p className="text-xs text-slate-300 italic">
              &ldquo;A breathtaking exhibition of speed-ramped combat cinematography! The stunt coordination on the boss finisher was pure summer tentpole magic.&rdquo;
            </p>
            <div className="text-[10px] text-slate-500 font-mono mt-1 text-right">
              — Variety Film Review
            </div>
          </div>
        )}

        {/* Performance Numbers */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center mb-6 font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">BOX OFFICE GROSS</div>
            <div className="text-sm sm:text-base font-black text-emerald-400">
              ${(budgetEarned / 1000000).toFixed(1)}M
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">STUNT CRITS</div>
            <div className="text-sm sm:text-base font-black text-amber-400">
              {stats.crits} HITS
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">TAKE DURATION</div>
            <div className="text-sm sm:text-base font-black text-cyan-400">
              {stats.duration}s
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              sound.playCameraSwitch();
              onReplayTake();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs tracking-wider transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REPLAY TAKE</span>
          </button>

          {isVictory && hasNextScene && (
            <button
              onClick={() => {
                sound.playClapperboard();
                onNextScene();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs tracking-widest shadow-lg shadow-amber-500/30 hover:brightness-110 transition cursor-pointer"
            >
              <span>NEXT SCENE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              sound.playCameraSwitch();
              onReturnToStudio();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs tracking-wider transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>STUDIO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
