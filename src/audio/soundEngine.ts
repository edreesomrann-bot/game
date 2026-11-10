/**
 * Procedural Web Audio Sound Engine for Hollywood Battler
 * Synthesizes cinematic impacts, metallic clangs, sub-bass hits, and dynamic pitch shifting during slow-mo.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private currentPitchMultiplier: number = 1.0;

  private userHasInteracted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const onFirstGesture = () => {
        this.userHasInteracted = true;
        this.initCtx();
        window.removeEventListener('pointerdown', onFirstGesture);
        window.removeEventListener('keydown', onFirstGesture);
      };
      window.addEventListener('pointerdown', onFirstGesture);
      window.addEventListener('keydown', onFirstGesture);
    }
  }

  private initCtx() {
    if (!this.userHasInteracted) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.4, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Set playback pitch multiplier according to cinematic time scale (slow-mo speed ramping)
   */
  public setTimeScale(timeScale: number) {
    // When timeScale is 0.2 (bullet-time), pitch drops to ~0.55 for sub-rumble movie effect
    this.currentPitchMultiplier = Math.max(0.4, Math.min(1.5, Math.pow(timeScale, 0.45)));
  }

  // --- Sound Effects ---

  /** Clapperboard SNAP on ACTION! */
  public playClapperboard() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // High wood slap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);

    // Followed by sharp snap noise
    this.playNoiseBurst(0.05, 0.4, 2500);
  }

  /** Heavy Metallic Shield Block Clang */
  public playShieldBlock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const pitch = 380 * this.currentPitchMultiplier;

    // Metal resonance pair
    [pitch, pitch * 1.58, pitch * 2.2].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.6);

      const vol = (idx === 0 ? 0.6 : 0.3);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45 + idx * 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.6);
    });

    // Sub thump
    this.playSubBass(60, 0.35, 0.5);
  }

  /** Blade Slash / Fast Critical Strike */
  public playBladeSlash(isCrit: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCrit ? 'sawtooth' : 'triangle';
    const startFreq = (isCrit ? 900 : 650) * this.currentPitchMultiplier;
    const endFreq = 80 * this.currentPitchMultiplier;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.18);

    gain.gain.setValueAtTime(isCrit ? 0.6 : 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.22);

    if (isCrit) {
      this.playSubBass(45, 0.6, 0.7);
      this.playNoiseBurst(0.12, 0.3, 1800);
    }
  }

  /** Boss Heavy Slam / Ground Impact */
  public playBossSlam() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    this.playSubBass(40 * this.currentPitchMultiplier, 0.8, 0.8);
    this.playNoiseBurst(0.25, 0.5, 400);

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120 * this.currentPitchMultiplier, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.5);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  /** Slow-Mo Impact Bullet-Time Drone */
  public playSlowMoEnter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.45);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.8);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.9);
  }

  /** Magic Energy / Celestial Beam */
  public playMagicSpell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520 * this.currentPitchMultiplier, t);
    osc.frequency.linearRampToValueAtTime(1100 * this.currentPitchMultiplier, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  /** Camera Switch Click */
  public playCameraSwitch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /** Director Cue Trigger Sound */
  public playDirectorCue() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880]; // D5, F#5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0.25, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.22);
    });
  }

  /** Victory Hollywood Horn Fanfare */
  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const chords = [
      { f: 220, time: 0 },
      { f: 277.18, time: 0.15 },
      { f: 329.63, time: 0.3 },
      { f: 440, time: 0.45 },
      { f: 554.37, time: 0.7 },
    ];

    chords.forEach(({ f, time }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t + time);

      gain.gain.setValueAtTime(0.3, t + time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + time + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + time);
      osc.stop(t + time + 0.8);
    });
  }

  // --- Helpers ---

  private playSubBass(freq: number, gainVal: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + duration);

    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  private playNoiseBurst(duration: number, gainVal: number, filterFreq: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }
}

export const sound = new SoundEngine();
