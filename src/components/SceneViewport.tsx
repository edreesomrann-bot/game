/**
 * 3D WebGL Canvas Scene Viewport for Hollywood Battler
 * Compliant with Three.js Skill: RoomEnvironment PBR, isSoftwareGl guard,
 * 60fps decoupled render loop, and procedural multi-part models.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HeroData, BossData, DirectorStyle, CombatAction, CameraPreset } from '../types/game';
import { buildTitanModel, buildViperModel, buildAetherModel, buildBossModel, buildArenaSet } from '../game/proceduralModels';
import { CameraDirector } from '../game/cinematics';
import { CombatEngine } from '../game/combatEngine';

interface SceneViewportProps {
  heroes: HeroData[];
  boss: BossData;
  environment: 'cyberpunk' | 'colosseum' | 'foundry';
  directorStyle: DirectorStyle;
  cameraPreset: CameraPreset;
  timeScale: number;
  isBattleActive: boolean;
  onCombatAction: (action: CombatAction) => void;
  onBattleFinish: (winner: 'heroes' | 'boss', stats: { totalDamage: number; crits: number; duration: number }) => void;
  onEngineReady?: (engine: CombatEngine) => void;
}

export const SceneViewport: React.FC<SceneViewportProps> = ({
  heroes,
  boss,
  environment,
  directorStyle,
  cameraPreset,
  isBattleActive,
  onCombatAction,
  onBattleFinish,
  onEngineReady,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CombatEngine | null>(null);
  const cameraDirectorRef = useRef<CameraDirector | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Probe
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Scene & Renderer Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(environment === 'cyberpunk' ? 0x080b12 : environment === 'colosseum' ? 0x1c1917 : 0x0f0f12);
    scene.fog = new THREE.FogExp2(scene.background.getHex(), 0.02);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    const cameraDirector = new CameraDirector(camera);
    cameraDirectorRef.current = cameraDirector;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.5);
    keyLight.position.set(12, 18, 10);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    const d = 14;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-15, 10, -12);
    scene.add(rimLight);

    // Warm boss light & cool hero light for cinematic contrast
    const bossPointLight = new THREE.PointLight(0xff4500, 3.5, 12);
    bossPointLight.position.set(5.0, 3.0, 0.5);
    scene.add(bossPointLight);

    const heroPointLight = new THREE.PointLight(0x06b6d4, 2.5, 10);
    heroPointLight.position.set(-4.0, 2.0, 0);
    scene.add(heroPointLight);

    // 5. Arena Set
    const arena = buildArenaSet(environment);
    scene.add(arena);

    // 6. Character Models
    const titanRig = buildTitanModel();
    const viperRig = buildViperModel();
    const aetherRig = buildAetherModel();
    const bossRig = buildBossModel();

    scene.add(titanRig.root);
    scene.add(viperRig.root);
    scene.add(aetherRig.root);
    scene.add(bossRig.root);

    // 7. Initialize Combat Engine
    const combatEngine = new CombatEngine(
      heroes,
      boss,
      directorStyle,
      cameraDirector,
      scene,
      onCombatAction,
      onBattleFinish
    );
    combatEngine.registerRigs(titanRig, viperRig, aetherRig, bossRig);
    engineRef.current = combatEngine;
    onEngineReady?.(combatEngine);

    if (isBattleActive) {
      combatEngine.startBattle();
    } else {
      cameraDirector.setPreset('wide_intro');
    }

    // 8. 60fps Animation Loop with isSoftwareGl Guard
    let frameId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // clamped dt for physics stability

      combatEngine.update(dt);
      cameraDirector.update(dt);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      combatEngine.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [environment]);

  // Handle camera preset changes
  useEffect(() => {
    if (cameraDirectorRef.current) {
      cameraDirectorRef.current.setPreset(cameraPreset);
    }
  }, [cameraPreset]);

  // Handle battle active toggle
  useEffect(() => {
    if (isBattleActive && engineRef.current && !engineRef.current.isBattleActive) {
      engineRef.current.startBattle();
    }
  }, [isBattleActive]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    />
  );
};
