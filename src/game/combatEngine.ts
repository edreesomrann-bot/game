/**
 * Hollywood Combat Engine & Choreography Coordinator
 * Manages runtime fighter instances, procedural 3D kinematics, particle VFX, and camera cuts.
 */

import * as THREE from 'three';
import { HeroData, BossData, DirectorStyle, CombatAction, CameraPreset } from '../types/game';
import { CharacterRig } from './proceduralModels';
import { CameraDirector } from './cinematics';
import { sound } from '../audio/soundEngine';

export interface FloatingText {
  id: string;
  text: string;
  isCrit: boolean;
  color: string;
  x: number;
  y: number;
  opacity: number;
}

export interface ParticleBurst {
  points: THREE.Points;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetime: number;
  age: number;
}

export class CombatEngine {
  private heroes: HeroData[];
  private boss: BossData;
  private directorStyle: DirectorStyle;
  private cameraDirector: CameraDirector;
  private scene: THREE.Scene;

  // 3D Rigs
  public titanRig!: CharacterRig;
  public viperRig!: CharacterRig;
  public aetherRig!: CharacterRig;
  public bossRig!: CharacterRig;

  // Runtime Health
  public heroHp: { [id: string]: number } = {};
  public bossHp: number = 0;
  public isBattleActive: boolean = false;
  public isBattleFinished: boolean = false;
  public winner: 'heroes' | 'boss' | null = null;

  // Animation States
  private titanPos = new THREE.Vector3(-4.5, 0, 1.2);
  private viperPos = new THREE.Vector3(-3.5, 0, -1.8);
  private aetherPos = new THREE.Vector3(-6.5, 0, 0);
  private bossPos = new THREE.Vector3(5.0, 0, 0);

  // Targets
  private titanTargetPos = new THREE.Vector3(-4.5, 0, 1.2);
  private viperTargetPos = new THREE.Vector3(-3.5, 0, -1.8);
  private bossTargetPos = new THREE.Vector3(5.0, 0, 0);

  // Timers & Choreography
  private battleTimer: number = 0;
  private roundIndex: number = 0;
  private nextActionDelay: number = 2.0;
  private actionCooldown: number = 2.0;

  // VFX
  private particleBursts: ParticleBurst[] = [];

  // Callback to React
  private onCombatAction?: (action: CombatAction) => void;
  private onBattleFinish?: (winner: 'heroes' | 'boss', stats: { totalDamage: number; crits: number; duration: number }) => void;

  private totalDamageDealt: number = 0;
  private critCount: number = 0;

  constructor(
    heroes: HeroData[],
    boss: BossData,
    directorStyle: DirectorStyle,
    cameraDirector: CameraDirector,
    scene: THREE.Scene,
    onCombatAction?: (action: CombatAction) => void,
    onBattleFinish?: (winner: 'heroes' | 'boss', stats: { totalDamage: number; crits: number; duration: number }) => void
  ) {
    this.heroes = heroes;
    this.boss = boss;
    this.directorStyle = directorStyle;
    this.cameraDirector = cameraDirector;
    this.scene = scene;
    this.onCombatAction = onCombatAction;
    this.onBattleFinish = onBattleFinish;

    // Initialize Runtime Stats without mutating base data
    heroes.forEach((h) => {
      this.heroHp[h.id] = h.maxHp;
    });
    this.bossHp = boss.maxHp;
  }

  public registerRigs(titan: CharacterRig, viper: CharacterRig, aether: CharacterRig, boss: CharacterRig) {
    this.titanRig = titan;
    this.viperRig = viper;
    this.aetherRig = aether;
    this.bossRig = boss;

    this.titanRig.root.position.copy(this.titanPos);
    this.viperRig.root.position.copy(this.viperPos);
    this.aetherRig.root.position.copy(this.aetherPos);
    this.bossRig.root.position.copy(this.bossPos);

    // Face each other
    this.titanRig.root.lookAt(this.bossPos.x, 0, this.bossPos.z);
    this.viperRig.root.lookAt(this.bossPos.x, 0, this.bossPos.z);
    this.aetherRig.root.lookAt(this.bossPos.x, 0, this.bossPos.z);
    this.bossRig.root.lookAt(this.titanPos.x, 0, this.titanPos.z);
  }

  public startBattle() {
    this.isBattleActive = true;
    this.isBattleFinished = false;
    this.battleTimer = 0;
    this.roundIndex = 0;
    this.nextActionDelay = 2.2; // Brief intro framing
    sound.playClapperboard();
    this.cameraDirector.setPreset('wide_intro', this.titanPos, this.bossPos);
  }

  // --- Interactive Player Director Cues ---

  public triggerCueStuntDouble() {
    if (!this.isBattleActive || this.isBattleFinished) return;
    sound.playDirectorCue();
    this.cameraDirector.setPreset('dps_action', this.viperPos, this.bossPos);
    this.cameraDirector.triggerSlowMo(0.2, 0.9, 50);

    // Viper teleports/dashes forward with double crit strike
    this.viperTargetPos.set(this.bossPos.x - 1.8, 0, this.bossPos.z - 0.5);
    const viperHero = this.heroes.find((h) => h.id === 'viper') || this.heroes[1];
    const dmg = Math.round(viperHero.attack * 2.2);

    this.bossHp = Math.max(0, this.bossHp - dmg);
    this.totalDamageDealt += dmg;
    this.critCount++;

    this.createParticleBurst(new THREE.Vector3(this.bossPos.x - 0.5, 2.0, this.bossPos.z), 0xff007f, 40);
    this.cameraDirector.triggerImpulse(1.4);
    sound.playBladeSlash(true);

    this.onCombatAction?.({
      sourceId: 'viper',
      targetId: 'boss',
      type: 'skill',
      damage: dmg,
      isCrit: true,
      message: '🎬 DIRECTED CUE: Viper executes Shadow Stunt Flank!',
    });

    this.checkBattleStatus();
  }

  public triggerCueFortressBlock() {
    if (!this.isBattleActive || this.isBattleFinished) return;
    sound.playDirectorCue();
    this.cameraDirector.setPreset('tank_block', this.titanPos, this.bossPos);
    this.cameraDirector.triggerSlowMo(0.25, 0.8, 40);

    // Titan raises shield to absorb impact
    if (this.titanRig?.shield) {
      this.titanRig.shield.position.z += 0.4;
      this.titanRig.shield.scale.set(1.3, 1.3, 1.3);
    }
    this.createParticleBurst(new THREE.Vector3(this.titanPos.x + 0.8, 1.8, this.titanPos.z), 0xf59e0b, 50);
    this.cameraDirector.triggerImpulse(1.6);
    sound.playShieldBlock();

    // Give Titan HP barrier
    this.heroHp['titan'] = Math.min(this.heroes[0].maxHp, (this.heroHp['titan'] || 0) + 300);

    this.onCombatAction?.({
      sourceId: 'titan',
      targetId: 'titan',
      type: 'block',
      damage: 0,
      isCrit: false,
      message: '🎬 DIRECTED CUE: Titan deploys Aegis Kinetic Bastion!',
    });
  }

  public triggerCueCelestialStrike() {
    if (!this.isBattleActive || this.isBattleFinished) return;
    sound.playDirectorCue();
    this.cameraDirector.setPreset('orbit_drone', this.aetherPos, this.bossPos);
    this.cameraDirector.triggerSlowMo(0.3, 1.0, 40);

    const dmg = Math.round(this.heroes[2]?.attack * 1.8 || 220);
    this.bossHp = Math.max(0, this.bossHp - dmg);
    this.totalDamageDealt += dmg;

    // Heal all squad heroes
    this.heroes.forEach((h) => {
      this.heroHp[h.id] = Math.min(h.maxHp, (this.heroHp[h.id] || 0) + 200);
    });

    this.createParticleBurst(new THREE.Vector3(this.bossPos.x, 3.0, this.bossPos.z), 0x38bdf8, 60);
    this.cameraDirector.triggerImpulse(1.2);
    sound.playMagicSpell();

    this.onCombatAction?.({
      sourceId: 'aether',
      targetId: 'boss',
      type: 'skill',
      damage: dmg,
      isCrit: true,
      message: '🎬 DIRECTED CUE: Aether unleashes Celestial Nova + Squad Regen!',
    });

    this.checkBattleStatus();
  }

  public triggerFinisher() {
    if (!this.isBattleActive || this.isBattleFinished) return;
    this.bossHp = 0;
    this.checkBattleStatus();
  }

  // --- Choreography Sequence ---

  public update(dt: number) {
    if (!this.isBattleActive) return;

    const effectiveDt = dt * this.cameraDirector.getTimeScale();
    this.battleTimer += effectiveDt;

    // Update Particles
    this.updateParticles(effectiveDt);

    // Procedural Kinematics
    this.animateIdleAndMovement(effectiveDt);

    if (this.isBattleFinished) return;

    // Auto Choreography Timeline
    this.actionCooldown -= effectiveDt;
    if (this.actionCooldown <= 0) {
      this.executeNextChoreographyStep();
      this.actionCooldown = this.nextActionDelay;
    }
  }

  private executeNextChoreographyStep() {
    this.roundIndex++;
    const step = (this.roundIndex % 4);

    if (step === 1) {
      // Step 1: Boss charges and attacks Titan
      this.cameraDirector.setPreset('boss_attack', this.titanPos, this.bossPos);
      this.bossTargetPos.set(this.titanPos.x + 2.4, 0, this.titanPos.z);

      window.setTimeout(() => {
        if (!this.isBattleActive) return;
        this.cameraDirector.setPreset('tank_block', this.titanPos, this.bossPos);

        const isCrit = Math.random() < 0.4;
        const bossDmg = Math.round(this.boss.attack * (isCrit ? 1.5 : 1.0));
        const defense = this.heroes[0].defense;
        const finalDmg = Math.max(20, Math.round(bossDmg * (100 / (100 + defense))));

        this.heroHp['titan'] = Math.max(0, (this.heroHp['titan'] || 0) - finalDmg);

        if (isCrit || this.directorStyle === 'zack_snyder') {
          this.cameraDirector.triggerSlowMo(0.15, 0.8, 60);
          this.cameraDirector.triggerImpulse(1.8);
          sound.playShieldBlock();
        } else {
          this.cameraDirector.triggerImpulse(1.1);
          sound.playShieldBlock();
        }

        this.createParticleBurst(new THREE.Vector3(this.titanPos.x + 0.8, 1.8, this.titanPos.z), 0xf59e0b, 35);

        this.onCombatAction?.({
          sourceId: 'boss',
          targetId: 'titan',
          type: 'boss_slam',
          damage: finalDmg,
          isCrit,
          message: `Goliath strikes! Titan shields the blast for ${finalDmg} DMG!`,
        });

        // Boss steps back slightly
        window.setTimeout(() => {
          this.bossTargetPos.set(5.0, 0, 0);
        }, 700);

        this.checkBattleStatus();
      }, 700);

      this.nextActionDelay = 2.4;
    } else if (step === 2) {
      // Step 2: Viper leaps in with twin katana combo
      this.cameraDirector.setPreset('dps_action', this.viperPos, this.bossPos);
      this.viperTargetPos.set(this.bossPos.x - 1.4, 0, this.bossPos.z - 0.4);

      window.setTimeout(() => {
        if (!this.isBattleActive) return;
        const isCrit = Math.random() < (this.heroes[1].critRate / 100);
        const dmg = Math.round(this.heroes[1].attack * (isCrit ? this.heroes[1].critMultiplier : 1.0));

        this.bossHp = Math.max(0, this.bossHp - dmg);
        this.totalDamageDealt += dmg;
        if (isCrit) this.critCount++;

        if (isCrit) {
          this.cameraDirector.setPreset('close_climax', this.viperPos, this.bossPos);
          this.cameraDirector.triggerSlowMo(0.12, 1.0, 70);
          this.cameraDirector.triggerImpulse(2.0);
          sound.playBladeSlash(true);
        } else {
          this.cameraDirector.triggerImpulse(1.0);
          sound.playBladeSlash(false);
        }

        this.createParticleBurst(new THREE.Vector3(this.bossPos.x - 0.4, 2.2, this.bossPos.z), 0xff007f, isCrit ? 45 : 20);

        this.onCombatAction?.({
          sourceId: 'viper',
          targetId: 'boss',
          type: 'attack',
          damage: dmg,
          isCrit,
          message: `Viper performs twin blade cross-slash for ${dmg} ${isCrit ? 'CRITICAL DMG!' : 'DMG'}`,
        });

        // Viper returns to position
        window.setTimeout(() => {
          this.viperTargetPos.set(-3.5, 0, -1.8);
        }, 800);

        this.checkBattleStatus();
      }, 600);

      this.nextActionDelay = 2.2;
    } else if (step === 3) {
      // Step 3: Aether casts support spell / Celestial beam
      this.cameraDirector.setPreset('orbit_drone', this.aetherPos, this.bossPos);
      sound.playMagicSpell();

      window.setTimeout(() => {
        if (!this.isBattleActive) return;
        const healAmt = 160;
        this.heroes.forEach((h) => {
          this.heroHp[h.id] = Math.min(h.maxHp, (this.heroHp[h.id] || 0) + healAmt);
        });

        const spellDmg = Math.round(this.heroes[2].attack * 1.2);
        this.bossHp = Math.max(0, this.bossHp - spellDmg);
        this.totalDamageDealt += spellDmg;

        this.createParticleBurst(new THREE.Vector3(this.aetherPos.x, 2.0, this.aetherPos.z), 0x38bdf8, 30);
        this.createParticleBurst(new THREE.Vector3(this.bossPos.x, 2.5, this.bossPos.z), 0x38bdf8, 30);
        this.cameraDirector.triggerImpulse(0.8);

        this.onCombatAction?.({
          sourceId: 'aether',
          targetId: 'boss',
          type: 'heal',
          damage: spellDmg,
          isCrit: false,
          message: `Aether weaves Celestial Radiance: +${healAmt} Squad HP & ${spellDmg} Arcane DMG!`,
        });

        this.checkBattleStatus();
      }, 500);

      this.nextActionDelay = 2.0;
    } else {
      // Step 0: Titan hammer sweep
      this.cameraDirector.setPreset('wide_intro', this.titanPos, this.bossPos);
      this.titanTargetPos.set(this.bossPos.x - 2.0, 0, this.bossPos.z);

      window.setTimeout(() => {
        if (!this.isBattleActive) return;
        const dmg = Math.round(this.heroes[0].attack * 1.3);
        this.bossHp = Math.max(0, this.bossHp - dmg);
        this.totalDamageDealt += dmg;

        this.cameraDirector.triggerImpulse(1.4);
        sound.playBossSlam();
        this.createParticleBurst(new THREE.Vector3(this.bossPos.x - 0.5, 1.2, this.bossPos.z), 0xf59e0b, 30);

        this.onCombatAction?.({
          sourceId: 'titan',
          targetId: 'boss',
          type: 'attack',
          damage: dmg,
          isCrit: false,
          message: `Titan delivers kinetic warhammer crush for ${dmg} DMG!`,
        });

        window.setTimeout(() => {
          this.titanTargetPos.set(-4.5, 0, 1.2);
        }, 700);

        this.checkBattleStatus();
      }, 600);

      this.nextActionDelay = 2.4;
    }
  }

  private checkBattleStatus() {
    if (this.bossHp <= 0) {
      // Boss Defeated! Epic Finisher Slow-Mo
      this.isBattleFinished = true;
      this.winner = 'heroes';
      this.cameraDirector.setPreset('close_climax', this.viperPos, this.bossPos);
      this.cameraDirector.triggerSlowMo(0.08, 2.0, 100);
      this.cameraDirector.triggerImpulse(2.5);

      sound.playBladeSlash(true);
      this.createParticleBurst(new THREE.Vector3(this.bossPos.x, 2.0, this.bossPos.z), 0xff4500, 100);

      // Boss collapses
      if (this.bossRig?.torso) {
        this.bossRig.torso.rotation.x = -Math.PI / 3;
        this.bossRig.torso.position.y = 0.5;
      }

      window.setTimeout(() => {
        sound.playVictoryFanfare();
        this.onBattleFinish?.('heroes', {
          totalDamage: this.totalDamageDealt,
          crits: this.critCount,
          duration: Math.round(this.battleTimer),
        });
      }, 2200);
    } else {
      // Check if all heroes down
      const allDown = Object.values(this.heroHp).every((hp) => hp <= 0);
      if (allDown) {
        this.isBattleFinished = true;
        this.winner = 'boss';
        this.onBattleFinish?.('boss', {
          totalDamage: this.totalDamageDealt,
          crits: this.critCount,
          duration: Math.round(this.battleTimer),
        });
      }
    }
  }

  // --- Procedural Kinematic Animation Loop ---

  private animateIdleAndMovement(dt: number) {
    const time = performance.now() * 0.003;

    // Smooth position interpolation
    this.titanPos.lerp(this.titanTargetPos, 5.0 * dt);
    this.viperPos.lerp(this.viperTargetPos, 8.0 * dt);
    this.bossPos.lerp(this.bossTargetPos, 4.0 * dt);

    if (this.titanRig) {
      this.titanRig.root.position.copy(this.titanPos);
      // Breathing & shield hover
      this.titanRig.torso.position.y = 0.9 + Math.sin(time * 2) * 0.03;
      if (this.titanRig.leftArm) this.titanRig.leftArm.rotation.x = Math.sin(time * 2) * 0.08;
    }

    if (this.viperRig) {
      this.viperRig.root.position.copy(this.viperPos);
      // Agile stealth crouch bob
      this.viperRig.torso.position.y = 0.95 + Math.sin(time * 4) * 0.04;
      if (this.viperRig.weapon) this.viperRig.weapon.rotation.z = Math.sin(time * 5) * 0.15;
    }

    if (this.aetherRig) {
      // Floating hover bobbing
      const hoverY = 0.4 + Math.sin(time * 2.5) * 0.12;
      this.aetherRig.root.position.y = hoverY;
      this.aetherRig.root.position.x = this.aetherPos.x;
      this.aetherRig.root.position.z = this.aetherPos.z;

      // Rotating celestial staff orb
      if (this.aetherRig.weapon) {
        this.aetherRig.weapon.rotation.y += 2.0 * dt;
      }
    }

    if (this.bossRig && !this.isBattleFinished) {
      this.bossRig.root.position.copy(this.bossPos);
      // Colossal menacing sway
      this.bossRig.torso.position.y = 1.8 + Math.sin(time * 1.5) * 0.06;
      this.bossRig.torso.rotation.y = Math.sin(time * 1.0) * 0.08;
    }
  }

  // --- Particle VFX ---

  private createParticleBurst(pos: THREE.Vector3, colorHex: number, count: number = 30) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const speed = 2.0 + Math.random() * 4.5;

      velocities[i * 3] = Math.cos(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * speed + 2.0; // upwards bias
      velocities[i * 3 + 2] = Math.cos(phi) * Math.sin(theta) * speed;

      lifetimes[i] = 0.5 + Math.random() * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.22,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.particleBursts.push({
      points,
      velocities,
      lifetimes,
      maxLifetime: 1.0,
      age: 0,
    });
  }

  private updateParticles(dt: number) {
    for (let b = this.particleBursts.length - 1; b >= 0; b--) {
      const burst = this.particleBursts[b];
      burst.age += dt;

      const positions = burst.points.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        positions[i * 3] += burst.velocities[i * 3] * dt;
        positions[i * 3 + 1] += burst.velocities[i * 3 + 1] * dt;
        positions[i * 3 + 2] += burst.velocities[i * 3 + 2] * dt;

        // gravity
        burst.velocities[i * 3 + 1] -= 9.8 * dt * 0.6;
      }

      burst.points.geometry.attributes.position.needsUpdate = true;

      // Fade out
      const mat = burst.points.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, 1.0 - burst.age / burst.maxLifetime);

      if (burst.age >= burst.maxLifetime) {
        this.scene.remove(burst.points);
        burst.points.geometry.dispose();
        mat.dispose();
        this.particleBursts.splice(b, 1);
      }
    }
  }

  public dispose() {
    this.isBattleActive = false;
    this.particleBursts.forEach((b) => {
      this.scene.remove(b.points);
      b.points.geometry.dispose();
      (b.points.material as THREE.Material).dispose();
    });
    this.particleBursts = [];
  }
}
