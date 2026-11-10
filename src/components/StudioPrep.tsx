import React, { useState } from 'react';
import { HeroData, MovieScene, DirectorStyle } from '../types/game';
import { DIRECTOR_STYLES } from '../game/initialData';
import { Clapperboard, Shield, Zap, Sparkles, Film, ArrowRight, Smartphone, Monitor } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface StudioPrepProps {
  heroes: HeroData[];
  onUpdateHero: (heroId: string, updates: Partial<HeroData>) => void;
  scenes: MovieScene[];
  currentScene: MovieScene;
  onSelectScene: (scene: MovieScene) => void;
  directorStyle: DirectorStyle;
  onSelectDirectorStyle: (style: DirectorStyle) => void;
  onActionClick: () => void;
}

export const StudioPrep: React.FC<StudioPrepProps> = ({
  heroes,
  onUpdateHero,
  scenes,
  currentScene,
  onSelectScene,
  directorStyle,
  onSelectDirectorStyle,
  onActionClick,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string>('titan');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const selectedHero = heroes.find((h) => h.id === selectedHeroId) || heroes[0];

  const handleAction = () => {
    setIsRolling(true);
    sound.playClapperboard();
    window.setTimeout(() => {
      onActionClick();
    }, 600);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between overflow-y-auto bg-slate-950/90 text-slate-100 p-4 sm:p-6 lg:p-8 select-none">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wide text-white flex items-center gap-2">
              HOLLYWOOD PRODUCTION STUDIO
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">STAGE 4</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              CAST MANAGEMENT · SCENE SETTING · DIRECTOR CHOREOGRAPHY
            </p>
          </div>
        </div>

        {/* Studio Viewport Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setIsMobileFrame(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              !isMobileFrame ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Studio Desk</span>
          </button>
          <button
            onClick={() => setIsMobileFrame(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              isMobileFrame ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Portrait Mobile</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`my-auto mx-auto w-full transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-md bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl my-4'
            : 'max-w-6xl py-4'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Cast Selector & Active Hero Card (lg: 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                1. Active Cast Lineup
              </span>
              <span className="text-xs text-slate-400 font-mono">3 / 3 Lead Actors Ready</span>
            </div>

            {/* Hero Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {heroes.map((hero) => {
                const isSelected = hero.id === selectedHeroId;
                const Icon = hero.role === 'tank' ? Shield : hero.role === 'dps' ? Zap : Sparkles;
                return (
                  <button
                    key={hero.id}
                    onClick={() => {
                      setSelectedHeroId(hero.id);
                      sound.playCameraSwitch();
                    }}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${hero.color}25`, color: hero.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-full">{hero.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{hero.role}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Hero Inspector */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{selectedHero.name}</h3>
                    <span
                      className="text-[10px] uppercase font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${selectedHero.color}25`, color: selectedHero.color }}
                    >
                      {selectedHero.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Actor: <span className="text-amber-400 font-medium">{selectedHero.actorName}</span> · &ldquo;{selectedHero.title}&rdquo;
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-black/40 rounded-xl border border-slate-800/80 text-center font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">MAX HP</div>
                  <div className="text-sm font-bold text-emerald-400">{selectedHero.maxHp}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">ATTACK</div>
                  <div className="text-sm font-bold text-red-400">{selectedHero.attack}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">DEFENSE</div>
                  <div className="text-sm font-bold text-blue-400">{selectedHero.defense}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">CRIT RATE</div>
                  <div className="text-sm font-bold text-amber-400">{selectedHero.critRate}%</div>
                </div>
              </div>

              {/* Weapon Selection */}
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase mb-1.5 block">Equipped Weapon & Prop:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedHero.availableWeapons.map((wpn) => {
                    const isEquipped = selectedHero.equippedWeapon === wpn.id;
                    return (
                      <button
                        key={wpn.id}
                        onClick={() => {
                          onUpdateHero(selectedHero.id, { equippedWeapon: wpn.id });
                          sound.playCameraSwitch();
                        }}
                        className={`p-2.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                          isEquipped
                            ? 'bg-amber-500/10 border-amber-500 text-white'
                            : 'bg-black/20 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-white flex items-center justify-between">
                          <span className="truncate">{wpn.name}</span>
                          {isEquipped && <span className="text-[10px] text-amber-400">ON</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2 mt-1">{wpn.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Combat Stance */}
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase mb-1.5 block">Choreography Stance:</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['defensive', 'aggressive', 'cinematic'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        onUpdateHero(selectedHero.id, { stance: st });
                        sound.playCameraSwitch();
                      }}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition cursor-pointer ${
                        selectedHero.stance === st
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-black/30 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Scene & Director Vision (lg: 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Scene Selector */}
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block mb-2">
                2. Select Movie Scene & Set
              </span>
              <div className="flex flex-col gap-2">
                {scenes.map((sc) => {
                  const isCurrent = sc.id === currentScene.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        onSelectScene(sc);
                        sound.playCameraSwitch();
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-slate-900 border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono text-amber-400 font-bold">
                          SCENE {sc.sceneNumber} · {sc.targetAudience}
                        </div>
                        <div className="text-sm font-black text-white">{sc.title}</div>
                        <div className="text-xs text-red-400 font-mono mt-0.5">
                          Boss: <span className="font-bold">{sc.boss.name}</span> ({sc.boss.maxHp} HP)
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-mono block">BUDGET</span>
                        <span className="text-xs font-bold text-emerald-400">
                          ${(sc.budgetReward / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Director Style */}
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block mb-2">
                3. Director Style
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DIRECTOR_STYLES.map((ds) => {
                  const isChosen = directorStyle === ds.id;
                  return (
                    <button
                      key={ds.id}
                      onClick={() => {
                        onSelectDirectorStyle(ds.id);
                        sound.playCameraSwitch();
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isChosen
                          ? 'bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border-amber-400'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{ds.name}</span>
                        {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">{ds.tag}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 mt-1">{ds.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Big ACTION! Clapperboard Trigger */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Clapperboard className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>READY TO ROLL · ALL STUNT RIGS CHECKED · 35MM CINEMASCOPE</span>
          </div>

          <button
            onClick={handleAction}
            disabled={isRolling}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black tracking-widest text-lg rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.5)] active:scale-95 transition cursor-pointer ${
              isRolling ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Clapperboard className="w-6 h-6 fill-black" />
            <span>ACTION! (ROLL CAMERA)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Screen Orientation Wipe Transition */}
      {isRolling && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in pointer-events-auto">
          <Clapperboard className="w-16 h-16 text-amber-400 animate-spin mb-4" />
          <h2 className="text-3xl font-black text-amber-400 tracking-widest font-mono">SCENE INITIATED!</h2>
          <p className="text-sm font-mono text-slate-400 mt-2">SWITCHING TO CINEMATIC LANDSCAPE CAMERAS...</p>
        </div>
      )}
    </div>
  );
};
