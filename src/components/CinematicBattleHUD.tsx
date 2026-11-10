import React, { useState, useEffect } from 'react';
import { HeroData, BossData, CameraPreset, CombatAction, DirectorStyle } from '../types/game';
import { Camera, Volume2, VolumeX, Clapperboard, ChevronDown, ChevronUp, Zap, Shield, Sparkles, Clock, Pause, Play, Film } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface CinematicBattleHUDProps {
  heroes: HeroData[];
  heroHp: { [id: string]: number };
  boss: BossData;
  bossHp: number;
  sceneTitle: string;
  directorStyle: DirectorStyle;
  cameraPreset: CameraPreset;
  onSelectCamera: (preset: CameraPreset) => void;
  timeScale: number;
  onSetTimeScale: (scale: number) => void;
  onTriggerCue: (cue: 'stunt_double' | 'fortress_block' | 'celestial_strike' | 'bullet_time' | 'finisher') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  recentAction: CombatAction | null;
  onReturnToStudio: () => void;
}

export const CinematicBattleHUD: React.FC<CinematicBattleHUDProps> = ({
  heroes,
  heroHp,
  boss,
  bossHp,
  sceneTitle,
  directorStyle,
  cameraPreset,
  onSelectCamera,
  timeScale,
  onSetTimeScale,
  onTriggerCue,
  isMuted,
  onToggleMute,
  recentAction,
  onReturnToStudio,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [elapsedFrames, setElapsedFrames] = useState(0);
  const [showFilmGrain, setShowFilmGrain] = useState(false);

  // Timecode counter simulation: 00:02:14:18
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedFrames((f) => f + 1);
    }, 1000 / 24); // 24 fps cinematic frame counter
    return () => clearInterval(timer);
  }, []);

  const totalSeconds = Math.floor(elapsedFrames / 24);
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  const frames = String(elapsedFrames % 24).padStart(2, '0');
  const timecodeString = `00:${mins}:${secs}:${frames}`;

  // Keyboard shortcut triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1') {
        e.preventDefault();
        onTriggerCue('stunt_double');
      } else if (e.key === '2') {
        e.preventDefault();
        onTriggerCue('fortress_block');
      } else if (e.key === '3') {
        e.preventDefault();
        onTriggerCue('celestial_strike');
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        onTriggerCue('bullet_time');
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onTriggerCue('finisher');
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const presets: CameraPreset[] = ['director_auto', 'wide_intro', 'boss_attack', 'tank_block', 'dps_action', 'orbit_drone'];
        const nextIdx = (presets.indexOf(cameraPreset) + 1) % presets.length;
        onSelectCamera(presets[nextIdx]);
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsDockCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cameraPreset, onSelectCamera, onTriggerCue]);

  const bossHpPercent = Math.max(0, Math.min(100, (bossHp / boss.maxHp) * 100));

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between select-none">
      {/* 1. Anamorphic Cinemascope 2.39:1 Letterbox Bars */}
      <div className="w-full h-8 sm:h-12 bg-black/95 border-b border-amber-500/20 flex items-center justify-between px-4 sm:px-8 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-red-500 font-bold tracking-widest uppercase">REC</span>
          <span className="text-amber-400 font-bold tabular-nums">TC {timecodeString}</span>
          <span className="text-slate-400 hidden md:inline">· 2.39:1 ANAMORPHIC</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-400 hidden sm:inline uppercase">DIRECTOR: {directorStyle.replace('_', ' ')}</span>
          <button
            onClick={() => setShowFilmGrain((g) => !g)}
            className="pointer-events-auto px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-amber-400 text-[10px] cursor-pointer"
          >
            {showFilmGrain ? '35MM GRAIN: ON' : 'GRAIN: OFF'}
          </button>
        </div>
      </div>

      {/* Film Grain Shader Simulation Overlay */}
      {showFilmGrain && (
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:3px_3px]" />
      )}

      {/* 2. Top Perimeter Status Cluster */}
      <div className="px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Scene & Director Badge */}
        <div className="flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Clapperboard className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold">SCENE:</span>
          <span className="text-white truncate max-w-xs">{sceneTitle}</span>
        </div>

        {/* Camera Selector Pills */}
        <div className="pointer-events-auto flex items-center gap-1 bg-black/80 border border-slate-800 p-1 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 px-2 flex items-center gap-1">
            <Camera className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">CAM (C):</span>
          </span>
          {(
            [
              { id: 'director_auto', label: 'Auto Cut' },
              { id: 'wide_intro', label: 'Wide' },
              { id: 'boss_attack', label: 'Boss' },
              { id: 'tank_block', label: 'Shield' },
              { id: 'dps_action', label: 'Flank' },
              { id: 'orbit_drone', label: 'Orbit' },
            ] as const
          ).map((c) => {
            const isActive = cameraPreset === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCamera(c.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Speed & Mute */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Speed Ramping pills */}
          <div className="flex items-center gap-1 bg-black/80 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => onSetTimeScale(0.25)}
              className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                timeScale < 0.5 ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
              title="Bullet-Time Slow-Mo"
            >
              0.25x
            </button>
            <button
              onClick={() => onSetTimeScale(1.0)}
              className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                timeScale >= 0.9 && timeScale <= 1.1 ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              1.0x
            </button>
            <button
              onClick={() => onSetTimeScale(2.0)}
              className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                timeScale > 1.5 ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2.0x
            </button>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-black/80 border border-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. Middle Arena Status Clusters (Left Squad / Right Boss) */}
      <div className="px-4 sm:px-8 flex items-start justify-between pointer-events-none my-auto">
        {/* Left Flank: Hero Squad Health */}
        <div className="flex flex-col gap-2 max-w-xs">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
            LEAD CAST STATUS
          </div>
          {heroes.map((hero) => {
            const currentHp = heroHp[hero.id] !== undefined ? heroHp[hero.id] : hero.maxHp;
            const pct = Math.max(0, Math.min(100, (currentHp / hero.maxHp) * 100));
            const isCritical = pct < 25;
            return (
              <div key={hero.id} className="p-2 rounded-xl bg-black/75 border border-slate-800/90 w-48 sm:w-56">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-white truncate">{hero.name}</span>
                  <span className="font-mono text-slate-300 tabular-nums">
                    {Math.round(currentHp)} / {hero.maxHp}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCritical ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Flank: Boss Health */}
        <div className="flex flex-col items-end gap-1 max-w-sm text-right">
          <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">
            ENEMY BOSS
          </span>
          <div className="p-3 rounded-xl bg-black/80 border border-red-950/80 w-56 sm:w-72">
            <div className="flex items-center justify-between text-xs font-black text-white mb-1">
              <span className="truncate">{boss.name}</span>
              <span className="font-mono text-red-400 tabular-nums">
                {Math.round(bossHp)} / {boss.maxHp}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-red-900/40">
              <div
                className="h-full bg-gradient-to-l from-red-600 via-orange-500 to-amber-500 transition-all duration-300"
                style={{ width: `${bossHpPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>SPECIAL: {boss.specialMove}</span>
              <span className="text-amber-400 font-bold">{Math.round(bossHpPercent)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Banner */}
      {recentAction && (
        <div className="self-center mb-2 px-4 py-2 rounded-xl bg-black/85 border border-amber-500/50 shadow-xl text-center pointer-events-none animate-pulse">
          <div className="text-xs font-mono font-bold tracking-wide text-amber-400 flex items-center justify-center gap-2">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>{recentAction.message}</span>
          </div>
        </div>
      )}

      {/* 4. Collapsible Bottom Control Dock (Consolidated, Zero Occlusion) */}
      <div className="pointer-events-auto pb-8 sm:pb-12 flex flex-col items-center">
        {/* Collapse / Expand Tab */}
        <button
          onClick={() => setIsDockCollapsed((c) => !c)}
          className="flex items-center gap-1.5 px-4 py-1 rounded-t-xl bg-black/85 border-t border-x border-slate-800 text-xs font-mono text-slate-400 hover:text-amber-400 transition cursor-pointer mb-[-1px]"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isDockCollapsed ? '▴ SHOW DIRECTOR CONSOLE (H)' : '▾ HIDE CONSOLE (H)'}</span>
        </button>

        {!isDockCollapsed && (
          <div className="w-full max-w-4xl px-4">
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3">
              {/* Cue Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold px-2">
                  DIRECTOR CUES:
                </span>

                {/* Cue 1: Viper Dash */}
                <button
                  onClick={() => onTriggerCue('stunt_double')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-600/30 to-purple-600/30 border border-pink-500/50 hover:border-pink-400 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-pink-400" />
                  <div className="text-left">
                    <div className="leading-tight">[1] Viper Stunt Dash</div>
                    <div className="text-[9px] text-pink-300 font-mono font-normal">CRIT FLANK</div>
                  </div>
                </button>

                {/* Cue 2: Titan Bastion */}
                <button
                  onClick={() => onTriggerCue('fortress_block')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/50 hover:border-blue-400 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  <div className="text-left">
                    <div className="leading-tight">[2] Titan Bastion</div>
                    <div className="text-[9px] text-blue-300 font-mono font-normal">BARRIER SHIELD</div>
                  </div>
                </button>

                {/* Cue 3: Aether Celestial Nova */}
                <button
                  onClick={() => onTriggerCue('celestial_strike')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-teal-600/30 border border-cyan-500/50 hover:border-cyan-400 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <div className="text-left">
                    <div className="leading-tight">[3] Celestial Nova</div>
                    <div className="text-[9px] text-cyan-300 font-mono font-normal">SQUAD REGEN</div>
                  </div>
                </button>

                {/* Bullet Time */}
                <button
                  onClick={() => onTriggerCue('bullet_time')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600/30 to-yellow-600/30 border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div className="text-left">
                    <div className="leading-tight">[T] Bullet-Time</div>
                    <div className="text-[9px] text-amber-400/80 font-mono font-normal">SLOW-MO 0.15x</div>
                  </div>
                </button>

                {/* Climax Finisher */}
                <button
                  onClick={() => onTriggerCue('finisher')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600/30 to-rose-600/30 border border-red-500/50 hover:border-red-400 text-red-300 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  <Film className="w-4 h-4 text-red-400" />
                  <div className="text-left">
                    <div className="leading-tight">[F] Climax Finisher</div>
                    <div className="text-[9px] text-red-400/80 font-mono font-normal">EXECUTE BOSS</div>
                  </div>
                </button>
              </div>

              {/* End/Studio Button */}
              <button
                onClick={onReturnToStudio}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                WRAP SCENE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Letterbox Bar */}
      <div className="w-full h-8 sm:h-12 bg-black/95 border-t border-amber-500/20 flex items-center justify-between px-4 sm:px-8 text-xs font-mono text-slate-500">
        <div>35MM CINEMASCOPE · HOLLYWOOD CHOREOGRAPHY SYSTEM</div>
        <div className="tracking-widest">FPS: 60 · SOUND: SURROUND PBR</div>
      </div>
    </div>
  );
};
