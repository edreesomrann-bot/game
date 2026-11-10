/**
 * Hollywood Battler - 3D Cinematic Auto-Battler & Director Studio
 * @license Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { HeroData, MovieScene, DirectorStyle, CameraPreset, CombatAction, GameState } from './types/game';
import { INITIAL_HEROES, MOVIE_SCENES } from './game/initialData';
import { SceneViewport } from './components/SceneViewport';
import { TitleScreen } from './components/TitleScreen';
import { StudioPrep } from './components/StudioPrep';
import { CinematicBattleHUD } from './components/CinematicBattleHUD';
import { DirectorCutModal } from './components/DirectorCutModal';
import { CombatEngine } from './game/combatEngine';
import { sound } from './audio/soundEngine';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [heroes, setHeroes] = useState<HeroData[]>(INITIAL_HEROES);
  const [sceneIndex, setSceneIndex] = useState<number>(0);
  const [directorStyle, setDirectorStyle] = useState<DirectorStyle>('zack_snyder');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('director_auto');
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getIsMuted());

  // Combat Runtime Mirror State for HUD
  const [heroHp, setHeroHp] = useState<{ [id: string]: number }>({
    titan: INITIAL_HEROES[0].maxHp,
    viper: INITIAL_HEROES[1].maxHp,
    aether: INITIAL_HEROES[2].maxHp,
  });
  const [bossHp, setBossHp] = useState<number>(MOVIE_SCENES[0].boss.maxHp);
  const [recentAction, setRecentAction] = useState<CombatAction | null>(null);

  // Victory / Modal stats
  const [battleResult, setBattleResult] = useState<{
    winner: 'heroes' | 'boss';
    stats: { totalDamage: number; crits: number; duration: number };
  } | null>(null);

  const engineRef = useRef<CombatEngine | null>(null);

  const currentScene = MOVIE_SCENES[sceneIndex] || MOVIE_SCENES[0];

  const handleUpdateHero = useCallback((heroId: string, updates: Partial<HeroData>) => {
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id !== heroId) return h;
        const updated = { ...h, ...updates };
        // Apply weapon bonuses if weapon updated
        if (updates.equippedWeapon) {
          const wpn = h.availableWeapons.find((w) => w.id === updates.equippedWeapon);
          if (wpn) {
            updated.attack = h.attack + wpn.atkBonus;
            updated.critRate = Math.min(80, Math.max(5, h.critRate + wpn.critBonus));
          }
        }
        return updated;
      })
    );
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = sound.toggleMute();
    setIsMuted(next);
  }, []);

  const handleStartBattle = useCallback(() => {
    setGameState('battle');
    setRecentAction({
      sourceId: 'director',
      targetId: 'all',
      type: 'attack',
      damage: 0,
      isCrit: false,
      message: '🎬 ACTION! Take 1 Rolling — Standby for Hero Engagement!',
    });
    // Reset HP for new battle
    const initialHps: { [id: string]: number } = {};
    heroes.forEach((h) => {
      initialHps[h.id] = h.maxHp;
    });
    setHeroHp(initialHps);
    setBossHp(currentScene.boss.maxHp);

    if (engineRef.current) {
      engineRef.current.startBattle();
    }
  }, [heroes, currentScene]);

  const handleCombatAction = useCallback((action: CombatAction) => {
    setRecentAction(action);
    if (engineRef.current) {
      setHeroHp({ ...engineRef.current.heroHp });
      setBossHp(engineRef.current.bossHp);
    }
  }, []);

  const handleBattleFinish = useCallback((winner: 'heroes' | 'boss', stats: { totalDamage: number; crits: number; duration: number }) => {
    setBattleResult({ winner, stats });
    setGameState('director_cut');
  }, []);

  const handleEngineReady = useCallback((engine: CombatEngine) => {
    engineRef.current = engine;
  }, []);

  const handleTriggerCue = useCallback((cue: 'stunt_double' | 'fortress_block' | 'celestial_strike' | 'bullet_time' | 'finisher') => {
    if (!engineRef.current) return;
    if (cue === 'stunt_double') {
      engineRef.current.triggerCueStuntDouble();
    } else if (cue === 'fortress_block') {
      engineRef.current.triggerCueFortressBlock();
    } else if (cue === 'celestial_strike') {
      engineRef.current.triggerCueCelestialStrike();
    } else if (cue === 'bullet_time') {
      sound.playSlowMoEnter();
      setTimeScale(0.2);
      window.setTimeout(() => setTimeScale(1.0), 1200);
    } else if (cue === 'finisher') {
      engineRef.current.triggerFinisher();
    }
    setHeroHp({ ...engineRef.current.heroHp });
    setBossHp(engineRef.current.bossHp);
  }, []);

  const handleReplayTake = useCallback(() => {
    setBattleResult(null);
    handleStartBattle();
  }, [handleStartBattle]);

  const handleNextScene = useCallback(() => {
    setBattleResult(null);
    const nextIdx = (sceneIndex + 1) % MOVIE_SCENES.length;
    setSceneIndex(nextIdx);
    setGameState('studio_prep');
  }, [sceneIndex]);

  const handleReturnToStudio = useCallback(() => {
    setBattleResult(null);
    setGameState('studio_prep');
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {/* 1. Underlying 3D Viewport (Always active for 60fps cinematic background) */}
      <SceneViewport
        key={`${currentScene.id}-${directorStyle}`}
        heroes={heroes}
        boss={currentScene.boss}
        environment={currentScene.environment}
        directorStyle={directorStyle}
        cameraPreset={cameraPreset}
        timeScale={timeScale}
        isBattleActive={gameState === 'battle'}
        onCombatAction={handleCombatAction}
        onBattleFinish={handleBattleFinish}
        onEngineReady={handleEngineReady}
      />

      {/* 2. Title Screen State */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={() => setGameState('studio_prep')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 3. Studio Staging / Prep State */}
      {gameState === 'studio_prep' && (
        <StudioPrep
          heroes={heroes}
          onUpdateHero={handleUpdateHero}
          scenes={MOVIE_SCENES}
          currentScene={currentScene}
          onSelectScene={(sc) => {
            const idx = MOVIE_SCENES.findIndex((s) => s.id === sc.id);
            if (idx !== -1) setSceneIndex(idx);
          }}
          directorStyle={directorStyle}
          onSelectDirectorStyle={setDirectorStyle}
          onActionClick={handleStartBattle}
        />
      )}

      {/* 4. Active Cinematic Battle HUD */}
      {gameState === 'battle' && (
        <CinematicBattleHUD
          heroes={heroes}
          heroHp={heroHp}
          boss={currentScene.boss}
          bossHp={bossHp}
          sceneTitle={currentScene.title}
          directorStyle={directorStyle}
          cameraPreset={cameraPreset}
          onSelectCamera={setCameraPreset}
          timeScale={timeScale}
          onSetTimeScale={setTimeScale}
          onTriggerCue={handleTriggerCue}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          recentAction={recentAction}
          onReturnToStudio={handleReturnToStudio}
        />
      )}

      {/* 5. Director's Cut Victory / Defeat Modal */}
      {gameState === 'director_cut' && battleResult && (
        <DirectorCutModal
          winner={battleResult.winner}
          sceneTitle={currentScene.title}
          stats={battleResult.stats}
          budgetEarned={currentScene.budgetReward}
          onReplayTake={handleReplayTake}
          onNextScene={handleNextScene}
          onReturnToStudio={handleReturnToStudio}
          hasNextScene={sceneIndex < MOVIE_SCENES.length - 1}
        />
      )}
    </div>
  );
}
