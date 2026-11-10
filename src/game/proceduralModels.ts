/**
 * Procedural 3D Character Models and Movie Sets for Hollywood Battler
 * Built using Three.js standard PBR materials and multi-part THREE.Group assemblies.
 */

import * as THREE from 'three';

// Procedural Canvas Textures
export function createGridTexture(accentColor: string = '#00f0ff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#182030';
  ctx.lineWidth = 2;
  const step = 32;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Major accent lines
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 480, 480);
  ctx.strokeRect(128, 128, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createShieldTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c2230';
  ctx.fillRect(0, 0, 256, 512);

  // Gold chevron border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 14;
  ctx.strokeRect(12, 12, 232, 488);

  // Heraldry Crest
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(128, 60);
  ctx.lineTo(200, 140);
  ctx.lineTo(128, 240);
  ctx.lineTo(56, 140);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AEGIS', 128, 340);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Model Assemblies

export interface CharacterRig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  shield?: THREE.Group;
  weapon?: THREE.Group;
  weaponMesh?: THREE.Mesh;
  glowParts: THREE.Mesh[];
  shadowDisc: THREE.Mesh;
}

/** Builds Titan Aegis (Tank) */
export function buildTitanModel(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'Hero_Titan';

  // Base materials
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x24324a,
    roughness: 0.35,
    metalness: 0.85,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.95,
  });
  const undersuitMat = new THREE.MeshStandardMaterial({
    color: 0x111620,
    roughness: 0.7,
    metalness: 0.2,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.1,
  });

  const glowParts: THREE.Mesh[] = [];

  // 1. Legs & Boots (grounded)
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.9, 0.42), armorMat);
  leftLeg.position.set(-0.35, 0.45, 0);
  leftLeg.castShadow = true;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.9, 0.42), armorMat);
  rightLeg.position.set(0.35, 0.45, 0);
  rightLeg.castShadow = true;
  root.add(rightLeg);

  // 2. Torso Subgroup (pivot at waist ~0.9)
  const torso = new THREE.Group();
  torso.position.set(0, 0.9, 0);
  root.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.9, 0.6), armorMat);
  chest.position.set(0, 0.45, 0);
  chest.castShadow = true;
  torso.add(chest);

  const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), glowMat);
  chestCore.rotation.x = Math.PI / 2;
  chestCore.position.set(0, 0.55, 0.31);
  torso.add(chestCore);
  glowParts.push(chestCore);

  // Pauldrons
  const leftShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.55), trimMat);
  leftShoulder.position.set(-0.68, 0.85, 0);
  leftShoulder.castShadow = true;
  torso.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.55), trimMat);
  rightShoulder.position.set(0.68, 0.85, 0);
  rightShoulder.castShadow = true;
  torso.add(rightShoulder);

  // 3. Head & Spartan Horned Helmet
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), armorMat);
  head.position.set(0, 1.1, 0);
  head.castShadow = true;
  torso.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.1), glowMat);
  visor.position.set(0, 0.04, 0.23);
  head.add(visor);
  glowParts.push(visor);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.55), trimMat);
  crest.position.set(0, 0.32, -0.05);
  head.add(crest);

  // 4. Left Arm with Massive Tower Shield
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.65, 0.75, 0);
  torso.add(leftArm);

  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.7, 8), undersuitMat);
  leftArmMesh.position.set(0, -0.3, 0);
  leftArm.add(leftArmMesh);

  const shieldGroup = new THREE.Group();
  shieldGroup.position.set(-0.15, -0.2, 0.25);
  leftArm.add(shieldGroup);

  const shieldMat = new THREE.MeshStandardMaterial({
    map: createShieldTexture(),
    roughness: 0.3,
    metalness: 0.8,
  });
  const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.12), shieldMat);
  shieldMesh.castShadow = true;
  shieldGroup.add(shieldMesh);

  const shieldGlowTrim = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.14), glowMat);
  shieldGlowTrim.position.set(0, 0.72, 0);
  shieldGroup.add(shieldGlowTrim);
  glowParts.push(shieldGlowTrim);

  // 5. Right Arm with Heavy Kinetic Warhammer
  const rightArm = new THREE.Group();
  rightArm.position.set(0.65, 0.75, 0);
  torso.add(rightArm);

  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.7, 8), undersuitMat);
  rightArmMesh.position.set(0, -0.3, 0);
  rightArm.add(rightArmMesh);

  const hammerGroup = new THREE.Group();
  hammerGroup.position.set(0.1, -0.4, 0.2);
  rightArm.add(hammerGroup);

  const hammerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), armorMat);
  hammerShaft.rotation.x = Math.PI / 4;
  hammerShaft.castShadow = true;
  hammerGroup.add(hammerShaft);

  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.65), trimMat);
  hammerHead.position.set(0, 0.5, 0.5);
  hammerHead.castShadow = true;
  hammerGroup.add(hammerHead);

  const hammerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.42, 8), glowMat);
  hammerCore.rotation.z = Math.PI / 2;
  hammerCore.position.set(0, 0.5, 0.5);
  hammerGroup.add(hammerCore);
  glowParts.push(hammerCore);

  // Contact Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(0.9, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  root.add(shadowDisc);

  return { root, torso, head, leftArm, rightArm, shield: shieldGroup, weapon: hammerGroup, glowParts, shadowDisc };
}

/** Builds Viper Blade (DPS) */
export function buildViperModel(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'Hero_Viper';

  const stealthMat = new THREE.MeshStandardMaterial({
    color: 0x181a20,
    roughness: 0.25,
    metalness: 0.8,
  });
  const magentaGlow = new THREE.MeshStandardMaterial({
    color: 0xff007f,
    emissive: 0xd90368,
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });
  const silverTrim = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.15,
    metalness: 0.95,
  });

  const glowParts: THREE.Mesh[] = [];

  // Legs (sleek, athletic)
  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.95, 8), stealthMat);
  leftLeg.position.set(-0.25, 0.47, 0);
  leftLeg.castShadow = true;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.95, 8), stealthMat);
  rightLeg.position.set(0.25, 0.47, 0);
  rightLeg.castShadow = true;
  root.add(rightLeg);

  // Torso
  const torso = new THREE.Group();
  torso.position.set(0, 0.95, 0);
  root.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 0.42), stealthMat);
  chest.position.set(0, 0.4, 0);
  chest.castShadow = true;
  torso.add(chest);

  // Emissive chest seams
  const chestSeam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.44), magentaGlow);
  chestSeam.position.set(0, 0.5, 0);
  torso.add(chestSeam);
  glowParts.push(chestSeam);

  // Head with ninja cowl & visor
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.38), stealthMat);
  head.position.set(0, 0.95, 0);
  head.castShadow = true;
  torso.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.1), magentaGlow);
  visor.position.set(0, 0.02, 0.2);
  head.add(visor);
  glowParts.push(visor);

  // Scarf / Aerodynamic cowl
  const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.48), silverTrim);
  scarf.position.set(0, 0.78, 0);
  torso.add(scarf);

  // Arms with Dual Energy Katanas
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.45, 0.68, 0);
  torso.add(leftArm);

  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.65, 8), stealthMat);
  leftArmMesh.position.set(0, -0.3, 0);
  leftArm.add(leftArmMesh);

  // Left Blade
  const blade1Group = new THREE.Group();
  blade1Group.position.set(-0.05, -0.4, 0.2);
  leftArm.add(blade1Group);

  const blade1Hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), silverTrim);
  blade1Group.add(blade1Hilt);

  const blade1Edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.14), magentaGlow);
  blade1Edge.position.set(0, 0.6, 0.05);
  blade1Group.add(blade1Edge);
  glowParts.push(blade1Edge);

  // Right Arm & Blade
  const rightArm = new THREE.Group();
  rightArm.position.set(0.45, 0.68, 0);
  torso.add(rightArm);

  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.65, 8), stealthMat);
  rightArmMesh.position.set(0, -0.3, 0);
  rightArm.add(rightArmMesh);

  const blade2Group = new THREE.Group();
  blade2Group.position.set(0.05, -0.4, 0.2);
  rightArm.add(blade2Group);

  const blade2Hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), silverTrim);
  blade2Group.add(blade2Hilt);

  const blade2Edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.14), magentaGlow);
  blade2Edge.position.set(0, 0.6, 0.05);
  blade2Group.add(blade2Edge);
  glowParts.push(blade2Edge);

  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  root.add(shadowDisc);

  return { root, torso, head, leftArm, rightArm, weapon: blade2Group, glowParts, shadowDisc };
}

/** Builds Aether Weaver (Mage/Support) */
export function buildAetherModel(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'Hero_Aether';

  const robeMat = new THREE.MeshStandardMaterial({
    color: 0x312e81,
    roughness: 0.4,
    metalness: 0.3,
  });
  const celestialGlow = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });
  const goldTrim = new THREE.MeshStandardMaterial({
    color: 0xfcd34d,
    roughness: 0.2,
    metalness: 0.9,
  });

  const glowParts: THREE.Mesh[] = [];

  // Levitating robe cone
  const robeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.3, 12), robeMat);
  robeMesh.position.set(0, 0.8, 0);
  robeMesh.castShadow = true;
  root.add(robeMesh);

  // Torso
  const torso = new THREE.Group();
  torso.position.set(0, 1.1, 0);
  root.add(torso);

  const upperChest = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.6, 12), robeMat);
  upperChest.position.set(0, 0.3, 0);
  upperChest.castShadow = true;
  torso.add(upperChest);

  // Head with floating celestial halo
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), robeMat);
  head.position.set(0, 0.75, 0);
  head.castShadow = true;
  torso.add(head);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 24), celestialGlow);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 0.95, 0);
  torso.add(halo);
  glowParts.push(halo);

  // Mystic crystalline staff in right arm
  const rightArm = new THREE.Group();
  rightArm.position.set(0.42, 0.4, 0);
  torso.add(rightArm);

  const staffGroup = new THREE.Group();
  staffGroup.position.set(0.1, -0.1, 0.3);
  rightArm.add(staffGroup);

  const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), goldTrim);
  staffShaft.castShadow = true;
  staffGroup.add(staffShaft);

  const staffOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), celestialGlow);
  staffOrb.position.set(0, 0.95, 0);
  staffGroup.add(staffOrb);
  glowParts.push(staffOrb);

  const staffRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 8, 24), celestialGlow);
  staffRing.position.set(0, 0.95, 0);
  staffGroup.add(staffRing);
  glowParts.push(staffRing);

  // Left arm floating gesture
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.42, 0.4, 0);
  torso.add(leftArm);

  const leftOrb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), celestialGlow);
  leftOrb.position.set(0, 0.2, 0.35);
  leftArm.add(leftOrb);
  glowParts.push(leftOrb);

  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.75, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  root.add(shadowDisc);

  return { root, torso, head, leftArm, rightArm, weapon: staffGroup, glowParts, shadowDisc };
}

/** Builds Goliath Overlord (Boss) - Colossal Titan */
export function buildBossModel(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'Boss_Goliath';

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.4,
    metalness: 0.85,
  });
  const magmaMat = new THREE.MeshStandardMaterial({
    color: 0xff3b00,
    emissive: 0xff2200,
    emissiveIntensity: 3.0,
    roughness: 0.15,
  });
  const bronzeArmorMat = new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.3,
    metalness: 0.9,
  });

  const glowParts: THREE.Mesh[] = [];

  // Giant Pillars / Legs (2.2m tall)
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.7), obsidianMat);
  leftLeg.position.set(-0.75, 0.9, 0);
  leftLeg.castShadow = true;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.7), obsidianMat);
  rightLeg.position.set(0.75, 0.9, 0);
  rightLeg.castShadow = true;
  root.add(rightLeg);

  // Massive Torso Subgroup
  const torso = new THREE.Group();
  torso.position.set(0, 1.8, 0);
  root.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.8, 1.3), obsidianMat);
  chest.position.set(0, 0.9, 0);
  chest.castShadow = true;
  torso.add(chest);

  // Magma Core in chest
  const chestCore = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.2), magmaMat);
  chestCore.position.set(0, 0.9, 0.66);
  torso.add(chestCore);
  glowParts.push(chestCore);

  // Heavy Spiked Pauldrons
  const leftPauldron = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.1, 5), bronzeArmorMat);
  leftPauldron.rotation.z = Math.PI / 4;
  leftPauldron.position.set(-1.5, 1.8, 0);
  leftPauldron.castShadow = true;
  torso.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.1, 5), bronzeArmorMat);
  rightPauldron.rotation.z = -Math.PI / 4;
  rightPauldron.position.set(1.5, 1.8, 0);
  rightPauldron.castShadow = true;
  torso.add(rightPauldron);

  // Head with Demonic Horns
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), obsidianMat);
  head.position.set(0, 2.1, 0.15);
  head.castShadow = true;
  torso.add(head);

  // Multi-eye glowing visor
  const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.1), magmaMat);
  eye1.position.set(0, 0.08, 0.42);
  head.add(eye1);
  glowParts.push(eye1);

  // Horns
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 4), bronzeArmorMat);
  hornL.rotation.z = Math.PI / 3;
  hornL.rotation.y = 0.3;
  hornL.position.set(-0.55, 0.5, 0);
  head.add(hornL);

  const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 4), bronzeArmorMat);
  hornR.rotation.z = -Math.PI / 3;
  hornR.rotation.y = -0.3;
  hornR.position.set(0.55, 0.5, 0);
  head.add(hornR);

  // Left Arm (Claw/Fist)
  const leftArm = new THREE.Group();
  leftArm.position.set(-1.4, 1.4, 0);
  torso.add(leftArm);

  const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.4, 0.55), obsidianMat);
  leftArmMesh.position.set(0, -0.6, 0);
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);

  // Right Arm with Giant Molten Cleaver
  const rightArm = new THREE.Group();
  rightArm.position.set(1.4, 1.4, 0);
  torso.add(rightArm);

  const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.4, 0.55), obsidianMat);
  rightArmMesh.position.set(0, -0.6, 0);
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0.3, -0.9, 0.3);
  rightArm.add(weaponGroup);

  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8), bronzeArmorMat);
  hilt.rotation.x = Math.PI / 4;
  hilt.rotation.z = -Math.PI / 8;
  weaponGroup.add(hilt);

  // Heavy jagged blade spine
  const bladeSpine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.8, 0.4), obsidianMat);
  bladeSpine.position.set(-0.1, 1.1, 0.5);
  bladeSpine.rotation.x = Math.PI / 6;
  bladeSpine.castShadow = true;
  weaponGroup.add(bladeSpine);

  // Emissive glowing magma cutting edge
  const bladeEdge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.7, 0.6), magmaMat);
  bladeEdge.position.set(-0.1, 1.1, 0.85);
  bladeEdge.rotation.x = Math.PI / 6;
  bladeEdge.castShadow = true;
  weaponGroup.add(bladeEdge);
  glowParts.push(bladeEdge);

  // Contact Shadow Disc
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  root.add(shadowDisc);

  return { root, torso, head, leftArm, rightArm, weapon: weaponGroup, glowParts, shadowDisc };
}

/** Builds Movie Sets (Cyberpunk Alley, Colosseum of Titans, Molten Foundry) */
export function buildArenaSet(sceneType: 'cyberpunk' | 'colosseum' | 'foundry'): THREE.Group {
  const set = new THREE.Group();
  set.name = 'Movie_Set_' + sceneType;

  if (sceneType === 'cyberpunk') {
    // 1. Wet Asphalt Floor with Neon Grid
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080b12,
      roughness: 0.15,
      metalness: 0.8,
      map: createGridTexture('#00f0ff'),
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    set.add(floor);

    // 2. High-Tech Neon Skyscrapers surrounding the arena
    const bldgMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.3,
    });
    const neonPink = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 3.0,
    });
    const neonCyan = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 3.0,
    });

    const positions = [
      { x: -16, z: -14, h: 22, w: 8, mat: neonCyan },
      { x: 16, z: -14, h: 25, w: 10, mat: neonPink },
      { x: -18, z: 8, h: 18, w: 9, mat: neonPink },
      { x: 18, z: 8, h: 20, w: 7, mat: neonCyan },
      { x: 0, z: -22, h: 30, w: 14, mat: neonCyan },
    ];

    positions.forEach((p) => {
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, 6), bldgMat);
      bldg.position.set(p.x, p.h / 2, p.z);
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      set.add(bldg);

      // Billboard sign on building
      const sign = new THREE.Mesh(new THREE.BoxGeometry(p.w * 0.7, 2, 0.4), p.mat);
      sign.position.set(p.x, p.h - 4, p.z + 3.1);
      set.add(sign);
    });
  } else if (sceneType === 'colosseum') {
    // Ancient Sand & Stone Arena
    const floorGeo = new THREE.CircleGeometry(25, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x272421,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    set.add(floor);

    // Weathered fluted pillars
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x524b42,
      roughness: 0.7,
      metalness: 0.2,
    });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 14;
      const z = Math.sin(angle) * 14;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 12), pillarMat);
      pillar.position.set(x, 4, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      set.add(pillar);

      const capital = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 2), pillarMat);
      capital.position.set(x, 8.2, z);
      set.add(capital);
    }
  } else {
    // Molten Foundry
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.6,
      metalness: 0.7,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    set.add(floor);

    // Lava canals
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff3300,
      emissiveIntensity: 3.5,
      roughness: 0.2,
    });
    const lava1 = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 4), lavaMat);
    lava1.position.set(0, 0.05, -10);
    set.add(lava1);

    const lava2 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 40), lavaMat);
    lava2.position.set(-10, 0.05, 0);
    set.add(lava2);
  }

  return set;
}
