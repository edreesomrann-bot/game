/**
 * Hollywood Cinematics & Camera Director
 * Handles virtual camera switching, smooth interpolation, decaying impulse shake, and slow-mo speed ramping.
 */

import * as THREE from 'three';
import { CameraPreset } from '../types/game';
import { sound } from '../audio/soundEngine';

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

export class CameraDirector {
  private camera: THREE.PerspectiveCamera;
  private currentPose: CameraPose;
  private targetPose: CameraPose;
  private currentPreset: CameraPreset = 'wide_intro';

  // Screen Shake (Impulse)
  private shakeIntensity: number = 0;
  private shakeDecay: number = 8.0;
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();

  // Speed Ramping & Hitstop
  private timeScale: number = 1.0;
  private targetTimeScale: number = 1.0;
  private hitstopDuration: number = 0;

  // Cinematic Letterbox
  private letterboxRatio: number = 2.39; // 2.39:1 anamorphic cinemascope

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentPose = {
      position: new THREE.Vector3(0, 7, 18),
      target: new THREE.Vector3(0, 1.5, 0),
      fov: 48,
    };
    this.targetPose = {
      position: new THREE.Vector3(0, 7, 18),
      target: new THREE.Vector3(0, 1.5, 0),
      fov: 48,
    };
  }

  public getPreset(): CameraPreset {
    return this.currentPreset;
  }

  public getTimeScale(): number {
    return this.timeScale;
  }

  public setPreset(preset: CameraPreset, heroPos?: THREE.Vector3, bossPos?: THREE.Vector3) {
    this.currentPreset = preset;
    sound.playCameraSwitch();

    const hPos = heroPos || new THREE.Vector3(-4, 0, 0);
    const bPos = bossPos || new THREE.Vector3(5, 0, 0);
    const midPoint = new THREE.Vector3().addVectors(hPos, bPos).multiplyScalar(0.5);

    switch (preset) {
      case 'wide_intro':
        // Dramatic 3/4 high-angle Hollywood master shot
        this.targetPose = {
          position: new THREE.Vector3(2.5, 5.5, 15.5),
          target: new THREE.Vector3(0.5, 1.8, 0),
          fov: 46,
        };
        break;

      case 'boss_attack':
        // Dramatic low-angle looking up at boss menacing silhouette
        this.targetPose = {
          position: new THREE.Vector3(bPos.x - 3.0, 1.2, bPos.z + 3.8),
          target: new THREE.Vector3(bPos.x + 0.2, 2.8, bPos.z),
          fov: 40,
        };
        break;

      case 'tank_block':
        // Over-the-shoulder behind Titan looking directly at incoming boss attack
        this.targetPose = {
          position: new THREE.Vector3(hPos.x - 2.2, 1.7, hPos.z + 2.6),
          target: new THREE.Vector3(hPos.x + 3.2, 2.2, hPos.z - 0.2),
          fov: 38,
        };
        break;

      case 'dps_action':
        // Dynamic fast-action flank camera tracking Viper's blade trail
        this.targetPose = {
          position: new THREE.Vector3(hPos.x + 2.4, 1.4, hPos.z + 4.2),
          target: new THREE.Vector3(bPos.x - 0.5, 2.0, bPos.z),
          fov: 44,
        };
        break;

      case 'close_climax':
        // Extreme macro close-up with dramatic low dutch angle
        this.targetPose = {
          position: new THREE.Vector3(midPoint.x + 0.5, 1.8, midPoint.z + 3.4),
          target: new THREE.Vector3(midPoint.x, 2.0, midPoint.z),
          fov: 32,
        };
        break;

      case 'orbit_drone':
        // Orbit position
        this.targetPose = {
          position: new THREE.Vector3(14, 5.5, 13),
          target: midPoint.clone().setY(1.8),
          fov: 46,
        };
        break;

      case 'director_auto':
      default:
        // Default dynamic Hollywood combat master view
        this.targetPose = {
          position: new THREE.Vector3(2.0, 5.0, 14.5),
          target: new THREE.Vector3(0.5, 1.8, 0),
          fov: 46,
        };
        break;
    }
  }

  /**
   * Generates a decaying screen shake impulse (Cinemachine Impulse style)
   */
  public triggerImpulse(intensity: number = 1.0) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 2.5);
  }

  /**
   * Triggers Hollywood Slow-Motion Speed Ramping
   * e.g. targetScale = 0.15 (bullet-time) for 0.8s
   */
  public triggerSlowMo(slowScale: number = 0.18, durationSec: number = 0.8, hitstopMs: number = 60) {
    this.targetTimeScale = slowScale;
    this.timeScale = slowScale;
    this.hitstopDuration = hitstopMs / 1000;
    sound.setTimeScale(slowScale);
    sound.playSlowMoEnter();

    window.setTimeout(() => {
      this.targetTimeScale = 1.0;
      sound.setTimeScale(1.0);
    }, durationSec * 1000);
  }

  public update(dt: number, heroPos?: THREE.Vector3, bossPos?: THREE.Vector3) {
    // 1. Hitstop simulation freeze
    if (this.hitstopDuration > 0) {
      this.hitstopDuration -= dt;
      return;
    }

    // 2. Smooth Time Scale restoration
    if (this.timeScale !== this.targetTimeScale) {
      this.timeScale = THREE.MathUtils.damp(this.timeScale, this.targetTimeScale, 6.0, dt);
      sound.setTimeScale(this.timeScale);
    }

    // 3. Dynamic Orbit Drone continuous rotation
    if (this.currentPreset === 'orbit_drone') {
      const time = performance.now() * 0.0006;
      const radius = 15;
      this.targetPose.position.x = Math.sin(time) * radius;
      this.targetPose.position.z = Math.cos(time) * radius;
    }

    // 4. Smooth Camera Lerp (Exponential Damping)
    const dampRate = 7.0;
    this.currentPose.position.lerp(this.targetPose.position, 1 - Math.exp(-dampRate * dt));
    this.currentPose.target.lerp(this.targetPose.target, 1 - Math.exp(-dampRate * dt));
    this.currentPose.fov = THREE.MathUtils.damp(this.currentPose.fov, this.targetPose.fov, dampRate, dt);

    // 5. Decaying Screen Shake calculation
    if (this.shakeIntensity > 0.01) {
      const freq = performance.now() * 0.05;
      this.shakeOffset.set(
        (Math.sin(freq * 1.3) * this.shakeIntensity) * 0.25,
        (Math.cos(freq * 1.7) * this.shakeIntensity) * 0.22,
        (Math.sin(freq * 0.9) * this.shakeIntensity) * 0.15
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    } else {
      this.shakeOffset.set(0, 0, 0);
      this.shakeIntensity = 0;
    }

    // Apply to Three.js camera
    this.camera.position.copy(this.currentPose.position).add(this.shakeOffset);
    this.camera.lookAt(this.currentPose.target);
    this.camera.fov = this.currentPose.fov;
    this.camera.updateProjectionMatrix();
  }
}
