/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { FISH_SPECIES } from '../data/fishData';
import type { FishSpecies, CatchMethod, EcologicalRole } from '../types';
import { IslandThreeEngine, ThrownProjectile } from './threeEngine';

export type FishBehaviorState = 'CALM' | 'ALERT' | 'FLEE' | 'HIDE' | 'FEED' | 'SCHOOL' | 'HUNT' | 'REST';

export interface FishInstance {
  id: string;
  species: FishSpecies;
  sizeCm: number;
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  tailMesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  isSpooked: boolean;
  spookTimer: number;
  alertLevel: number; // 0: calm, 1: alert, 2: fleeing
  behaviorState: FishBehaviorState;
  stateTimer: number;
  wiggleSpeed: number;
  phase: number;
  isTrapped: boolean;
  burstMultiplier: number;

  // --- PREDATOR & HUNGER SYSTEM ---
  hunger: number;               // 0.0 (starving) to 1.0 (satisfied)
  hungerDecayRate: number;      // Continuous decay per second (e.g. 0.006/s to 0.012/s)
  postMealCooldown: number;     // Active satisfied rest cooldown after eating (no hunting)
  failedHuntCooldown: number;   // Delay after an unsuccessful chase or lost target (no chain attacks)
  huntDurationTimer: number;    // Elapsed seconds pursuing current target
  lastPreyTargetId: string | null; // ID of prey that just escaped (avoids immediately retargeting same fish)
  huntTargetFishId: string | null;
  isHunting: boolean;
  predatorAggroLevel: number;   // 0: indifferent, 1: circling curious, 2: mock charge / aggressive
  aggroCooldown: number;

  // --- PREY HABITAT & SPAWN PROTECTION ---
  spawnGraceTimer: number;      // Grace period on newly spawned fish (higher vigilance, ignored by casual predators)
  isInCover: boolean;           // True if inside sea grass, coral crevices, kelp, or shallow nursery
  coverConcealment: number;     // 0.0 (exposed in blue water) to 0.85 (deep shelter)
}

export interface ShoreCrab {
  id: string;
  group: THREE.Group;
  clawLeft: THREE.Mesh;
  clawRight: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  targetX: number;
  targetZ: number;
  isFleeing: boolean;
  walkCycle: number;
}

export interface SeaBird {
  group: THREE.Group;
  wingLeft: THREE.Mesh;
  wingRight: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  state: 'flying' | 'landing' | 'pecking' | 'takeoff';
  stateTimer: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  circleAngle: number;
  circleRadius: number;
  circleSpeed: number;
}

export interface EcosystemTelemetry {
  totalPrey: number;
  totalMesopredators: number;
  totalApexPredators: number;
  avgPredatorHunger: number;
  totalHuntsAttempted: number;
  successfulHunts: number;
  failedHunts: number;
  huntSuccessRate: number;
  preyEscapes: number;
  predatorKills: number;
  playerCatches: number;
}

export class Ecosystem {
  private engine: IslandThreeEngine;
  public fishList: FishInstance[] = [];
  public crabs: ShoreCrab[] = [];
  public birds: SeaBird[] = [];

  // Population caps per species across Island, Lagoon, Coral Reef, Kelp Forest, and Deep Trench
  // Tuned for a healthy, robust base prey biomass and strictly controlled apex predator populations
  private populationCaps: Record<string, number> = {
    // 1. Small Prey / Foragers / Grazers (Healthy baseline biomass)
    sergeant_major: 8,
    lagoon_anthias: 8,
    blue_tang: 6,
    yellowfin_goatfish: 6,
    bonefish: 5,
    peacock_flounder: 4,
    spotted_trunkfish: 4,
    queen_angelfish: 4,
    banded_butterflyfish: 4,
    atlantic_needlefish: 4,

    // 2. Mid Carnivores / Mesopredators (Controlled population)
    yellowtail_snapper: 4,
    coral_trout: 3,
    kelp_bass: 3,
    red_lionfish: 2,
    blacktip_pup: 2,

    // 3. Apex Predators & Solitary Sea Cruisers (Strict carrying capacity)
    great_hammerhead: 1,
    great_barracuda: 1,
    giant_trevally: 2,
    spotted_eagle_ray: 2
  };

  public telemetry: EcosystemTelemetry = {
    totalPrey: 0,
    totalMesopredators: 0,
    totalApexPredators: 0,
    avgPredatorHunger: 0.85,
    totalHuntsAttempted: 0,
    successfulHunts: 0,
    failedHunts: 0,
    huntSuccessRate: 0,
    preyEscapes: 0,
    predatorKills: 0,
    playerCatches: 0
  };

  private respawnCheckTimer: number = 0;

  // Coral shelters and underwater features
  private coralShelters = [
    { x: 18, z: 16 },
    { x: 24, z: 18 },
    { x: 14, z: 24 },
    { x: 26, z: 10 },
    { x: 22, z: 28 },
    { x: -28, z: 24 },
    { x: -32, z: -18 },
    { x: 20, z: -32 },
    { x: -16, z: 32 },
    { x: -24, z: -30 },
    { x: 30, z: -15 },
    { x: 28, z: 26 },
    { x: -35, z: 10 },
    { x: 45, z: 35 },
    { x: -50, z: 38 },
    { x: 48, z: -42 },
    { x: -46, z: -48 }
  ];

  constructor(engine: IslandThreeEngine) {
    this.engine = engine;
    this.spawnInitialFauna();
  }

  private spawnInitialFauna() {
    // 1. Spawn Initial Fish Population for all Species
    FISH_SPECIES.forEach((species) => {
      const targetCount = this.populationCaps[species.id] || 2;
      for (let i = 0; i < targetCount; i++) {
        this.spawnFish(species, i, true);
      }
    });

    // 2. Shore Crabs (Scuttling on sand)
    this.spawnShoreCrabs();

    // 3. Sea Birds (Pelicans / Terns soaring and landing)
    this.spawnSeaBirds();
  }

  // --- HABITAT COORD SELECTOR WITH SPAWN PROTECTION ---
  private pickHabitatCoordinates(species: FishSpecies, awayFromPlayerX?: number, awayFromPlayerZ?: number): { x: number; z: number } {
    const isApex = species.role === 'apex_predator' || species.isLargePredator;
    const isPrey = !species.isPredator && species.role !== 'apex_predator' && species.role !== 'mid_carnivore';

    let attempts = 0;
    while (attempts < 30) {
      attempts++;
      let radius = 24 + Math.random() * 26;
      let angle = Math.random() * Math.PI * 2;

      // Species-specific habitat preference & zones
      if (species.habitatZone === 'deep_trench' || species.id === 'great_hammerhead') {
        radius = 110 + Math.random() * 28; // Deep trench abyss (Depth -9m to -13.5m)
      } else if (species.habitatZone === 'kelp_forest' || species.id === 'kelp_bass') {
        radius = 72 + Math.random() * 32;  // Kelp forest slopes (Depth -4.5m to -8.5m)
      } else if (species.habitatZone === 'open_sea' || species.id === 'great_barracuda' || species.id === 'spotted_eagle_ray' || species.id === 'giant_trevally') {
        radius = 75 + Math.random() * 40;  // Open sea blue water
      } else if (species.habitatZone === 'coral_reef') {
        radius = 48 + Math.random() * 24;  // Outer coral reef rim
      } else if (species.id === 'sergeant_major' || species.id === 'yellowfin_goatfish') {
        radius = 16 + Math.random() * 12; // Shallow shoreline flats
      } else if (species.id === 'atlantic_needlefish') {
        radius = 18 + Math.random() * 25; // Surface bays
      } else if (species.id === 'blacktip_pup' || species.id === 'bluefin_trevally') {
        radius = 35 + Math.random() * 22; // Outer channels & deep patrol
      } else if (
        species.id === 'spotted_trunkfish' ||
        species.id === 'blue_tang' ||
        species.id === 'queen_angelfish' ||
        species.id === 'banded_butterflyfish' ||
        species.id === 'coral_trout' ||
        species.id === 'lagoon_anthias' ||
        species.id === 'picasso_triggerfish'
      ) {
        // Spawn near coral clusters
        const randomCoral = this.coralShelters[Math.floor(Math.random() * this.coralShelters.length)];
        const cx = randomCoral.x + (Math.random() - 0.5) * 6;
        const cz = randomCoral.z + (Math.random() - 0.5) * 6;
        
        // Check terrain height at coral location
        const groundY = this.engine.getTerrainHeight(cx, cz);
        if (groundY < -0.25) {
          return { x: cx, z: cz };
        }
      } else if (species.id === 'peacock_flounder' || species.id === 'bonefish') {
        radius = 18 + Math.random() * 18; // Shallow flats
      }

      let x = Math.cos(angle) * radius;
      let z = Math.sin(angle) * radius;

      // Distance from player to avoid instant pop-in
      if (awayFromPlayerX !== undefined && awayFromPlayerZ !== undefined) {
        const distToPlayer = Math.sqrt(Math.pow(x - awayFromPlayerX, 2) + Math.pow(z - awayFromPlayerZ, 2));
        if (distToPlayer < 14) continue;
      }

      // Check terrain is underwater
      const groundY = this.engine.getTerrainHeight(x, z);
      if (groundY >= -0.2) continue;

      // PREY SPAWN PROTECTION: Avoid spawning right next to hungry active predators
      if (isPrey && this.fishList.length > 0) {
        const nearHungryPredator = this.fishList.some((other) => {
          if (other.isTrapped) return false;
          const otherIsPredator = other.species.isPredator || other.species.role === 'apex_predator' || other.species.role === 'mid_carnivore';
          if (!otherIsPredator || other.hunger >= 0.65) return false;
          const d = Math.sqrt(Math.pow(other.x - x, 2) + Math.pow(other.z - z, 2));
          return d < 22; // Keep at least 22m away from hungry predators on spawn
        });
        if (nearHungryPredator && attempts < 25) continue;
      }

      // APEX PREDATOR SPACING: Avoid spawning two apex predators within 35m of each other
      if (isApex && this.fishList.length > 0) {
        const nearOtherApex = this.fishList.some((other) => {
          if (other.isTrapped) return false;
          const otherIsApex = other.species.role === 'apex_predator' || other.species.isLargePredator;
          if (!otherIsApex) return false;
          const d = Math.sqrt(Math.pow(other.x - x, 2) + Math.pow(other.z - z, 2));
          return d < 35;
        });
        if (nearOtherApex && attempts < 25) continue;
      }

      return { x, z };
    }

    return { x: 30, z: 30 };
  }

  // --- FISH CREATION (ALL 16 SPECIES) ---
  public spawnFish(species: FishSpecies, index: number, initialSpawn: boolean = false, playerX?: number, playerZ?: number): FishInstance {
    const group = new THREE.Group();

    const sizeCm = Math.round(species.minSizeCm + Math.random() * (species.maxSizeCm - species.minSizeCm));
    const scale = Math.max(0.18, Math.min(3.0, (sizeCm / 70) * 0.75 + 0.15));

    let bodyMesh: THREE.Mesh;
    let tailMesh: THREE.Mesh;

    if (species.id === 'bonefish') {
      // 1. BONEFISH: Slender metallic silver torpedo
      const bodyGeom = new THREE.ConeGeometry(0.2, 1.3, 8);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        metalness: 0.75,
        roughness: 0.25,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const tailGeom = new THREE.ConeGeometry(0.22, 0.45, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.4 });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.7);
      tailMesh.scale.set(0.08, 1.4, 1);
      group.add(tailMesh);

      const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 3), tailMat);
      dorsal.position.set(0, 0.2, 0.1);
      dorsal.rotation.x = -0.4;
      group.add(dorsal);

    } else if (species.id === 'yellowtail_snapper') {
      // 2. YELLOWTAIL SNAPPER: Yellow lateral stripe & forked tail
      const bodyGeom = new THREE.ConeGeometry(0.24, 1.2, 8);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#60a5fa',
        roughness: 0.4,
        metalness: 0.2,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const stripeGeom = new THREE.BoxGeometry(0.49, 0.05, 1.0);
      const stripeMat = new THREE.MeshBasicMaterial({ color: '#facc15' });
      const stripe = new THREE.Mesh(stripeGeom, stripeMat);
      group.add(stripe);

      const tailGeom = new THREE.ConeGeometry(0.28, 0.5, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.3 });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.65);
      tailMesh.scale.set(0.08, 1.5, 1);
      group.add(tailMesh);

    } else if (species.id === 'peacock_flounder') {
      // 3. PEACOCK FLOUNDER: Flat asymmetric camouflage disc with cyan rosettes
      const bodyGeom = new THREE.BoxGeometry(0.65, 0.07, 0.95);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#ca8a04',
        roughness: 0.9,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const spotMat = new THREE.MeshBasicMaterial({ color: '#06b6d4' });
      for (let s = 0; s < 6; s++) {
        const spot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 6), spotMat);
        spot.rotation.x = -Math.PI / 2;
        spot.position.set((Math.random() - 0.5) * 0.45, 0.04, (Math.random() - 0.5) * 0.6);
        group.add(spot);
      }

      const tailGeom = new THREE.ConeGeometry(0.2, 0.35, 4);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#a16207' });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.55);
      tailMesh.scale.set(1.4, 0.05, 1);
      group.add(tailMesh);

    } else if (species.id === 'blue_tang') {
      // 4. BLUE TANG: Royal Blue oval body, neon yellow scalpel tail
      const bodyGeom = new THREE.BoxGeometry(0.14, 0.6, 0.85);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#2563eb',
        roughness: 0.35,
        metalness: 0.2,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const tailGeom = new THREE.ConeGeometry(0.25, 0.4, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.3 });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.52);
      tailMesh.scale.set(0.08, 1.4, 1);
      group.add(tailMesh);

    } else if (species.id === 'sergeant_major') {
      // 5. SERGEANT MAJOR: Yellow top, 5 bold vertical black stripes
      const bodyGeom = new THREE.BoxGeometry(0.16, 0.55, 0.78);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#facc15',
        roughness: 0.4,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const stripeMat = new THREE.MeshBasicMaterial({ color: '#09090b' });
      for (let s = -2; s <= 2; s++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.5, 0.05), stripeMat);
        stripe.position.set(0, 0, s * 0.14);
        group.add(stripe);
      }

      const tailGeom = new THREE.ConeGeometry(0.2, 0.35, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1' });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.48);
      tailMesh.scale.set(0.08, 1.3, 1);
      group.add(tailMesh);

    } else if (species.id === 'blacktip_pup') {
      // 6. BLACKTIP REEF SHARK PUP: Countershaded grey/white, black fin tips
      const bodyGeom = new THREE.ConeGeometry(0.25, 1.5, 8);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#64748b',
        roughness: 0.3,
        metalness: 0.25,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const dorsalMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.4 });
      const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 3), dorsalMat);
      dorsal.position.set(0, 0.28, 0.1);
      dorsal.rotation.x = -0.35;
      group.add(dorsal);

      const tailGeom = new THREE.ConeGeometry(0.22, 0.55, 3);
      tailGeom.rotateX(-Math.PI / 2);
      tailMesh = new THREE.Mesh(tailGeom, dorsalMat);
      tailMesh.position.set(0, 0.08, -0.85);
      tailMesh.scale.set(0.08, 1.6, 1);
      group.add(tailMesh);

    } else if (species.id === 'red_lionfish') {
      // 7. RED LIONFISH: Ornate zebra stripes and fan pectoral fins
      const bodyGeom = new THREE.ConeGeometry(0.3, 1.0, 7);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#dc2626',
        roughness: 0.6,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const finMat = new THREE.MeshStandardMaterial({ color: '#fef08a', side: THREE.DoubleSide });
      for (let s = -1; s <= 1; s += 2) {
        const fan = new THREE.Mesh(new THREE.CircleGeometry(0.35, 5), finMat);
        fan.position.set(s * 0.32, 0.05, 0.1);
        fan.rotation.y = s * 0.8;
        group.add(fan);
      }

      const tailGeom = new THREE.ConeGeometry(0.2, 0.35, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#ef4444' });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.55);
      tailMesh.scale.set(0.08, 1.3, 1);
      group.add(tailMesh);

    } else if (species.id === 'spotted_trunkfish') {
      // 8. SPOTTED TRUNKFISH: Boxy triangular prism body, black leopard polka dots, yellow lips
      const bodyGeom = new THREE.CylinderGeometry(0.22, 0.38, 0.9, 3);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.85,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Black leopard spots
      const spotMat = new THREE.MeshBasicMaterial({ color: '#09090b' });
      for (let s = 0; s < 10; s++) {
        const spot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 5), spotMat);
        const sideAngle = (s / 10) * Math.PI * 2;
        spot.position.set(Math.cos(sideAngle) * 0.25, Math.sin(sideAngle) * 0.18, (Math.random() - 0.5) * 0.5);
        group.add(spot);
      }

      // Yellow snout / lips
      const lipMat = new THREE.MeshStandardMaterial({ color: '#facc15' });
      const lips = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 5), lipMat);
      lips.position.set(0, -0.05, 0.5);
      group.add(lips);

      // Tiny fan tail
      const tailGeom = new THREE.ConeGeometry(0.18, 0.3, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.75 });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.55);
      tailMesh.scale.set(0.06, 1.2, 1);
      group.add(tailMesh);

    } else if (species.id === 'queen_angelfish') {
      // 9. QUEEN ANGELFISH: Tall disc body in turquoise & gold, dark-blue electric crown
      const bodyGeom = new THREE.BoxGeometry(0.12, 0.82, 0.95);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#0284c7',
        roughness: 0.3,
        metalness: 0.35,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Golden edge rims
      const rimMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.3 });
      const topRim = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.9), rimMat);
      topRim.position.y = 0.42;
      group.add(topRim);

      // Electric blue forehead crown
      const crownMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', emissive: '#3b82f6', emissiveIntensity: 0.6 });
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), crownMat);
      crown.position.set(0, 0.32, 0.35);
      group.add(crown);

      // Forked tail
      const tailGeom = new THREE.ConeGeometry(0.24, 0.45, 3);
      tailGeom.rotateX(-Math.PI / 2);
      tailMesh = new THREE.Mesh(tailGeom, rimMat);
      tailMesh.position.set(0, 0, -0.6);
      tailMesh.scale.set(0.06, 1.5, 1);
      group.add(tailMesh);

    } else if (species.id === 'atlantic_needlefish') {
      // 10. ATLANTIC NEEDLEFISH: Ultra-long needle cylinder body, elongated beak
      const bodyGeom = new THREE.CylinderGeometry(0.07, 0.09, 1.6, 6);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#6ee7b7',
        metalness: 0.7,
        roughness: 0.25,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Long scissor beak
      const beakMat = new THREE.MeshStandardMaterial({ color: '#34d399', roughness: 0.5 });
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.6, 4), beakMat);
      beak.position.set(0, 0, 1.05);
      beak.rotateX(Math.PI / 2);
      group.add(beak);

      // Small translucent tail
      const tailGeom = new THREE.ConeGeometry(0.14, 0.3, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#a7f3d0' });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.9);
      tailMesh.scale.set(0.05, 1.3, 1);
      group.add(tailMesh);

    } else if (species.id === 'banded_butterflyfish') {
      // 11. BANDED BUTTERFLYFISH: Disc body, pearl-white with 3 black vertical chevron stripes
      const bodyGeom = new THREE.BoxGeometry(0.12, 0.68, 0.78);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.35,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // 3 Black Chevron Bands
      const stripeMat = new THREE.MeshBasicMaterial({ color: '#09090b' });
      for (let s = -1; s <= 1; s++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.62, 0.08), stripeMat);
        stripe.position.set(0, 0, s * 0.2);
        stripe.rotation.x = 0.15 * s;
        group.add(stripe);
      }

      // Pointed snout
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), bodyMat);
      snout.position.set(0, -0.05, 0.46);
      snout.rotateX(Math.PI / 2);
      group.add(snout);

      // Tail
      const tailGeom = new THREE.ConeGeometry(0.2, 0.35, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#fef08a' });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.48);
      tailMesh.scale.set(0.06, 1.4, 1);
      group.add(tailMesh);

    } else if (species.id === 'bluefin_trevally') {
      // 12. BLUEFIN TREVALLY: Steep streamlined forehead, electric neon-blue fins, deep brassy body
      const bodyGeom = new THREE.ConeGeometry(0.26, 1.35, 8);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#0284c7',
        metalness: 0.65,
        roughness: 0.25,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Electric neon dorsal & anal fin ridges
      const electricMat = new THREE.MeshStandardMaterial({ color: '#00f0ff', emissive: '#0284c7', emissiveIntensity: 0.5 });
      const topFin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 3), electricMat);
      topFin.position.set(0, 0.26, 0.05);
      topFin.rotation.x = -0.5;
      group.add(topFin);

      const tailGeom = new THREE.ConeGeometry(0.28, 0.52, 3);
      tailGeom.rotateX(-Math.PI / 2);
      tailMesh = new THREE.Mesh(tailGeom, electricMat);
      tailMesh.position.set(0, 0, -0.75);
      tailMesh.scale.set(0.08, 1.6, 1);
      group.add(tailMesh);

    } else if (species.id === 'coral_trout') {
      // 13. CORAL TROUT: Scarlet grouper body covered with glowing turquoise pin-dots
      const bodyGeom = new THREE.ConeGeometry(0.28, 1.25, 8);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#e11d48',
        roughness: 0.45,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Turquoise pin-dots
      const pinMat = new THREE.MeshBasicMaterial({ color: '#22d3ee' });
      for (let p = 0; p < 12; p++) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), pinMat);
        const pAngle = (p / 12) * Math.PI * 2;
        dot.position.set(Math.cos(pAngle) * 0.22, Math.sin(pAngle) * 0.15, (Math.random() - 0.5) * 0.6);
        group.add(dot);
      }

      const tailGeom = new THREE.ConeGeometry(0.24, 0.42, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#be123c', roughness: 0.5 });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.7);
      tailMesh.scale.set(0.08, 1.4, 1);
      group.add(tailMesh);

    } else if (species.id === 'lagoon_anthias') {
      // 14. LAGOON ANTHIAS: Slender magenta-orange body with trailing streamer fin lobes
      const bodyGeom = new THREE.BoxGeometry(0.12, 0.45, 0.7);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#ec4899',
        emissive: '#f97316',
        emissiveIntensity: 0.3,
        roughness: 0.35,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Long dorsal filament streamer
      const streamerMat = new THREE.MeshStandardMaterial({ color: '#facc15', side: THREE.DoubleSide });
      const streamer = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.5, 3), streamerMat);
      streamer.position.set(0, 0.3, 0.1);
      streamer.rotation.x = -0.6;
      group.add(streamer);

      const tailGeom = new THREE.ConeGeometry(0.25, 0.5, 3);
      tailGeom.rotateX(-Math.PI / 2);
      tailMesh = new THREE.Mesh(tailGeom, streamerMat);
      tailMesh.position.set(0, 0, -0.45);
      tailMesh.scale.set(0.06, 1.6, 1);
      group.add(tailMesh);

    } else if (species.id === 'yellowfin_goatfish') {
      // 15. YELLOWFIN GOATFISH: Elongated sandy bottom-feeder with yellow fins and chin barbels
      const bodyGeom = new THREE.ConeGeometry(0.22, 1.15, 7);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#fde047',
        roughness: 0.5,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Chin Barbels (Whiskers for sensing sand)
      const barbelMat = new THREE.MeshStandardMaterial({ color: '#eab308' });
      for (let b = -1; b <= 1; b += 2) {
        const barbel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.25, 4), barbelMat);
        barbel.position.set(b * 0.05, -0.16, 0.52);
        barbel.rotation.x = 0.6;
        group.add(barbel);
      }

      const tailGeom = new THREE.ConeGeometry(0.22, 0.4, 3);
      tailGeom.rotateX(-Math.PI / 2);
      tailMesh = new THREE.Mesh(tailGeom, barbelMat);
      tailMesh.position.set(0, 0, -0.65);
      tailMesh.scale.set(0.08, 1.4, 1);
      group.add(tailMesh);

    } else if (species.id === 'picasso_triggerfish') {
      // 16. PICASSO TRIGGERFISH: Angular diamond shape, abstract geometric mask & trigger spine
      const bodyGeom = new THREE.BoxGeometry(0.18, 0.72, 0.88);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        roughness: 0.4,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Blue & black geometric face bands
      const maskMat = new THREE.MeshBasicMaterial({ color: '#0284c7' });
      const mask = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.28, 0.35), maskMat);
      mask.position.set(0, 0.12, 0.22);
      mask.rotation.x = 0.4;
      group.add(mask);

      // Yellow mouth band
      const mouthMat = new THREE.MeshStandardMaterial({ color: '#facc15' });
      const mouth = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), mouthMat);
      mouth.position.set(0, -0.1, 0.52);
      mouth.rotateX(Math.PI / 2);
      group.add(mouth);

      // Sharp dorsal trigger spine
      const spineMat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 3), spineMat);
      spine.position.set(0, 0.42, 0.1);
      spine.rotation.x = -0.3;
      group.add(spine);

      // Tail
      const tailGeom = new THREE.ConeGeometry(0.2, 0.35, 3);
      tailGeom.rotateX(-Math.PI / 2);
      tailMesh = new THREE.Mesh(tailGeom, mouthMat);
      tailMesh.position.set(0, 0, -0.52);
      tailMesh.scale.set(0.07, 1.3, 1);
      group.add(tailMesh);

    } else if (species.id === 'great_hammerhead') {
      // 17. GREAT HAMMERHEAD SHARK: Massive bronze-grey apex predator, hammer cephalofoil head, tall sickle dorsal
      const bodyGeom = new THREE.ConeGeometry(0.42, 2.4, 8);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.35,
        metalness: 0.2,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Cephalofoil "Hammer" Head
      const hammerGeom = new THREE.BoxGeometry(1.6, 0.18, 0.45);
      const hammer = new THREE.Mesh(hammerGeom, bodyMat);
      hammer.position.set(0, 0, 1.05);
      group.add(hammer);

      // Wide-set eyes on outer edges of hammer
      const eyeMat = new THREE.MeshBasicMaterial({ color: '#0f172a' });
      for (let e = -1; e <= 1; e += 2) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 5), eyeMat);
        eye.position.set(e * 0.78, 0, 1.05);
        group.add(eye);
      }

      // Tall Sickle First Dorsal Fin
      const dorsalMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4 });
      const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.85, 4), dorsalMat);
      dorsal.position.set(0, 0.52, 0.1);
      dorsal.rotation.x = -0.4;
      group.add(dorsal);

      // Heterocercal Sweeping Caudal Fin
      const tailGeom = new THREE.ConeGeometry(0.35, 0.95, 3);
      tailGeom.rotateX(-Math.PI / 2);
      tailMesh = new THREE.Mesh(tailGeom, dorsalMat);
      tailMesh.position.set(0, 0, -1.2);
      tailMesh.scale.set(0.1, 1.8, 1);
      group.add(tailMesh);

    } else if (species.id === 'great_barracuda') {
      // 18. GREAT BARRACUDA: Sleek elongated silver missile, tiger bars, pointed toothy underbite
      const bodyGeom = new THREE.CylinderGeometry(0.14, 0.2, 1.9, 8);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        metalness: 0.85,
        roughness: 0.18,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Dark tiger crossbars
      const barMat = new THREE.MeshBasicMaterial({ color: '#1e293b' });
      for (let b = -3; b <= 2; b++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.22, 0.06), barMat);
        bar.position.set(0, 0.02, b * 0.22);
        group.add(bar);
      }

      // Pointed predatory jaws
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 5), bodyMat);
      snout.position.set(0, 0, 1.15);
      snout.rotateX(Math.PI / 2);
      group.add(snout);

      const tailGeom = new THREE.ConeGeometry(0.25, 0.45, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.3 });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -1.05);
      tailMesh.scale.set(0.08, 1.6, 1);
      group.add(tailMesh);

    } else if (species.id === 'giant_trevally') {
      // 19. GIANT TREVALLY: Muscular steep-headed apex predator, dark dusk slate, powerful fin sweeps
      const bodyGeom = new THREE.ConeGeometry(0.38, 1.65, 8);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#334155',
        metalness: 0.5,
        roughness: 0.35,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const finMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4 });
      const topFin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 3), finMat);
      topFin.position.set(0, 0.38, 0.05);
      topFin.rotation.x = -0.45;
      group.add(topFin);

      const tailGeom = new THREE.ConeGeometry(0.35, 0.65, 3);
      tailGeom.rotateX(-Math.PI / 2);
      tailMesh = new THREE.Mesh(tailGeom, finMat);
      tailMesh.position.set(0, 0, -0.9);
      tailMesh.scale.set(0.1, 1.7, 1);
      group.add(tailMesh);

    } else if (species.id === 'kelp_bass') {
      // 20. KELP BASS: Olive-gold mottled predator adapted for kelp stalks
      const bodyGeom = new THREE.ConeGeometry(0.28, 1.35, 8);
      bodyGeom.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#65a30d',
        roughness: 0.5,
        metalness: 0.15,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Gold-brown camouflage mottling
      const spotMat = new THREE.MeshBasicMaterial({ color: '#ca8a04' });
      for (let s = 0; s < 7; s++) {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 4, 4), spotMat);
        const sAng = (s / 7) * Math.PI * 2;
        spot.position.set(Math.cos(sAng) * 0.22, Math.sin(sAng) * 0.18, (Math.random() - 0.5) * 0.6);
        group.add(spot);
      }

      const tailGeom = new THREE.ConeGeometry(0.26, 0.45, 3);
      tailGeom.rotateX(-Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#4d7c0f', roughness: 0.4 });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -0.75);
      tailMesh.scale.set(0.08, 1.4, 1);
      group.add(tailMesh);

    } else {
      // 21. SPOTTED EAGLE RAY: Broad diamond mantle wings, white spot pattern, duckbill snout, long whip tail
      const bodyGeom = new THREE.BoxGeometry(1.8, 0.08, 1.1);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.45,
        flatShading: true
      });
      bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // White ring spots across mantle
      const spotMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      for (let sp = 0; sp < 14; sp++) {
        const spot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 5), spotMat);
        spot.rotation.x = -Math.PI / 2;
        spot.position.set((Math.random() - 0.5) * 1.5, 0.045, (Math.random() - 0.5) * 0.8);
        group.add(spot);
      }

      // Duckbill head
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 4), bodyMat);
      snout.position.set(0, 0, 0.65);
      snout.rotateX(Math.PI / 2);
      group.add(snout);

      // Long Whip Tail
      const tailGeom = new THREE.CylinderGeometry(0.02, 0.01, 1.6, 4);
      tailGeom.rotateX(Math.PI / 2);
      const tailMat = new THREE.MeshStandardMaterial({ color: '#09090b' });
      tailMesh = new THREE.Mesh(tailGeom, tailMat);
      tailMesh.position.set(0, 0, -1.2);
      group.add(tailMesh);
    }

    group.scale.set(scale, scale, scale);

    // Pick spawn coordinates
    const coords = this.pickHabitatCoordinates(species, initialSpawn ? undefined : playerX, initialSpawn ? undefined : playerZ);
    const x = coords.x;
    const z = coords.z;

    const groundY = this.engine.getTerrainHeight(x, z);
    let y = -0.4;
    if (species.depthPreference === 'bottom') {
      y = Math.min(-0.15, groundY + 0.18);
    } else if (species.depthPreference === 'surface') {
      y = -0.15;
    } else if (species.habitatZone === 'deep_trench') {
      y = Math.min(-4.0, groundY + 2.5);
    } else {
      y = Math.min(-0.3, (groundY - 0.1) * 0.55);
    }

    group.position.set(x, y, z);
    this.engine.scene.add(group);

    const isPredator = species.isPredator || species.role === 'apex_predator' || species.role === 'mid_carnivore';
    const isApex = species.role === 'apex_predator' || species.isLargePredator;

    // Predator hunger balance: Initial spawn starts satisfied (0.75 - 0.95) with post-meal cooldown
    const initialHunger = isPredator ? (0.72 + Math.random() * 0.25) : (0.80 + Math.random() * 0.20);
    // Slower metabolic hunger decay for massive apex predators (~80-120s between hunting urges)
    const decayRate = isApex ? 0.0055 : (isPredator ? 0.0085 : 0.010);
    const postMealCd = isPredator ? (initialSpawn ? (15 + Math.random() * 20) : (35 + Math.random() * 25)) : 0;
    // Respawned prey get a grace period where predators do not target them and they seek safety
    const graceTimer = (!isPredator && !initialSpawn) ? 14.0 : 0;

    const fishInstance: FishInstance = {
      id: `${species.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      species,
      sizeCm,
      group,
      bodyMesh,
      tailMesh,
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * species.swimSpeed,
      vy: 0,
      vz: (Math.random() - 0.5) * species.swimSpeed,
      targetX: x + (Math.random() - 0.5) * 10,
      targetY: y,
      targetZ: z + (Math.random() - 0.5) * 10,
      isSpooked: false,
      spookTimer: 0,
      alertLevel: 0,
      behaviorState: 'CALM',
      stateTimer: 4 + Math.random() * 6,
      wiggleSpeed: 5.5 + Math.random() * 3.5,
      phase: Math.random() * Math.PI * 2,
      isTrapped: false,
      burstMultiplier: 2.2,

      // Hunger & Predation State
      hunger: initialHunger,
      hungerDecayRate: decayRate,
      postMealCooldown: postMealCd,
      failedHuntCooldown: 0,
      huntDurationTimer: 0,
      lastPreyTargetId: null,
      huntTargetFishId: null,
      isHunting: false,
      predatorAggroLevel: 0,
      aggroCooldown: 8 + Math.random() * 6,

      // Habitat & Cover State
      spawnGraceTimer: graceTimer,
      isInCover: false,
      coverConcealment: 0
    };

    this.fishList.push(fishInstance);
    return fishInstance;
  }

  // --- SHORE CRABS ---
  private spawnShoreCrabs() {
    const crabMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.6, flatShading: true });
    const clawMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.5 });
    const legMat = new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.7 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#09090b' });

    for (let i = 0; i < 9; i++) {
      const group = new THREE.Group();

      // Carapace
      const carapace = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.28), crabMat);
      carapace.position.y = 0.08;
      group.add(carapace);

      // Stalk Eyes
      for (let e = -1; e <= 1; e += 2) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), eyeMat);
        eye.position.set(e * 0.09, 0.16, 0.14);
        group.add(eye);
      }

      // Claws
      const clawL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 4), clawMat);
      clawL.position.set(0.24, 0.05, 0.15);
      clawL.rotation.z = -Math.PI / 3;
      group.add(clawL);

      const clawR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 4), clawMat);
      clawR.position.set(-0.24, 0.05, 0.15);
      clawR.rotation.z = Math.PI / 3;
      group.add(clawR);

      // Legs
      for (let side = -1; side <= 1; side += 2) {
        for (let l = 0; l < 3; l++) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4), legMat);
          leg.position.set(side * 0.22, -0.04, -0.08 + l * 0.08);
          leg.rotation.z = side * (0.6 + l * 0.1);
          group.add(leg);
        }
      }

      const angle = (i / 9) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radius = 18 + Math.random() * 8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.max(0.04, this.engine.getTerrainHeight(x, z) + 0.07);

      group.position.set(x, y, z);
      this.engine.scene.add(group);

      this.crabs.push({
        id: `crab_${i}`,
        group,
        clawLeft: clawL,
        clawRight: clawR,
        x,
        y,
        z,
        vx: 0,
        vz: 0,
        targetX: x + (Math.random() - 0.5) * 4,
        targetZ: z + (Math.random() - 0.5) * 4,
        isFleeing: false,
        walkCycle: Math.random() * 10
      });
    }
  }

  // --- SEA BIRDS ---
  private spawnSeaBirds() {
    const birdMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 });
    const beakMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 });
    const wingMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.7, side: THREE.DoubleSide });

    for (let b = 0; b < 4; b++) {
      const group = new THREE.Group();

      const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 5), birdMat);
      body.rotateX(Math.PI / 2);
      group.add(body);

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 4), beakMat);
      beak.position.set(0, 0, 0.55);
      beak.rotateX(Math.PI / 2);
      group.add(beak);

      const wingGeom = new THREE.BoxGeometry(0.8, 0.03, 0.3);
      const wingL = new THREE.Mesh(wingGeom, wingMat);
      wingL.position.set(0.45, 0.05, 0);
      group.add(wingL);

      const wingR = new THREE.Mesh(wingGeom, wingMat);
      wingR.position.set(-0.45, 0.05, 0);
      group.add(wingR);

      const circleRadius = 26 + b * 10;
      const circleSpeed = 0.22 + b * 0.04;
      const circleAngle = (b / 4) * Math.PI * 2;

      const x = Math.cos(circleAngle) * circleRadius;
      const z = Math.sin(circleAngle) * circleRadius;
      const y = 14 + b * 3;

      group.position.set(x, y, z);
      this.engine.scene.add(group);

      this.birds.push({
        group,
        wingLeft: wingL,
        wingRight: wingR,
        x,
        y,
        z,
        state: 'flying',
        stateTimer: 10 + Math.random() * 15,
        targetX: x,
        targetY: y,
        targetZ: z,
        circleAngle,
        circleRadius,
        circleSpeed
      });
    }
  }

  // --- THREAT & ESCAPE AI ---
  public spookFishInRadius(centerX: number, centerZ: number, radius: number) {
    this.fishList.forEach((fish) => {
      if (fish.isTrapped) return;
      const dx = fish.x - centerX;
      const dz = fish.z - centerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius) {
        this.triggerSpook(fish, centerX, centerZ);
      }
    });
  }

  // School scattering defense: causes all schooling fish of that species in the vicinity to scatter radially
  public scatterSchool(speciesId: string, threatX: number, threatZ: number) {
    this.fishList.forEach((f) => {
      if (f.species.id === speciesId && !f.isTrapped) {
        const dx = f.x - threatX;
        const dz = f.z - threatZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 18) {
          f.isSpooked = true;
          f.spookTimer = 3.2;
          f.alertLevel = 2;
          f.behaviorState = 'FLEE';
          f.burstMultiplier = 2.6;
          const angle = Math.atan2(dz, dx) + (Math.random() - 0.5) * 1.4;
          f.targetX = f.x + Math.cos(angle) * (10 + Math.random() * 8);
          f.targetZ = f.z + Math.sin(angle) * (10 + Math.random() * 8);
        }
      }
    });
  }

  private triggerSpook(fish: FishInstance, fromX: number, fromZ: number) {
    fish.isSpooked = true;
    fish.spookTimer = 2.8;
    fish.alertLevel = 2;
    fish.isHunting = false;
    fish.huntTargetFishId = null;

    const dx = fish.x - fromX;
    const dz = fish.z - fromZ;

    if (fish.species.id === 'bonefish' || fish.species.id === 'atlantic_needlefish' || fish.species.id === 'bluefin_trevally') {
      const fleeAngle = Math.atan2(dz, dx) + (Math.random() - 0.5) * 0.6;
      fish.targetX = fish.x + Math.cos(fleeAngle) * 16;
      fish.targetZ = fish.z + Math.sin(fleeAngle) * 16;
    } else if (fish.species.id === 'spotted_trunkfish' || fish.species.id === 'peacock_flounder') {
      // Gentle short flutter
      const fleeAngle = Math.atan2(dz, dx) + (Math.random() - 0.5) * 0.9;
      fish.targetX = fish.x + Math.cos(fleeAngle) * 4.5;
      fish.targetZ = fish.z + Math.sin(fleeAngle) * 4.5;
    } else {
      const fleeAngle = Math.atan2(dz, dx) + (Math.random() - 0.5) * 0.5;
      fish.targetX = fish.x + Math.cos(fleeAngle) * 12;
      fish.targetZ = fish.z + Math.sin(fleeAngle) * 12;
    }
  }

  // --- PROJECTILE HIT DETECTION ---
  public checkProjectileHits(projectiles: ThrownProjectile[]): { caughtFish: FishInstance | null; method: CatchMethod } {
    for (const proj of projectiles) {
      if (proj.hasHitGround) continue;

      for (let f = 0; f < this.fishList.length; f++) {
        const fish = this.fishList[f];
        if (fish.isTrapped) continue;

        const dx = fish.x - proj.x;
        const dy = fish.y - proj.y;
        const dz = fish.z - proj.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const hitRadius = proj.type === 'spear' ? 0.75 : 0.55;

        if (dist < hitRadius) {
          if (proj.type === 'spear') {
            return { caughtFish: fish, method: 'spear' };
          } else {
            this.triggerSpook(fish, proj.x, proj.z);
          }
        }
      }
    }

    return { caughtFish: null, method: 'spear' };
  }

  // --- UPDATE LOOP ---
  public update(delta: number, playerX: number, playerZ: number, playerWadingFast: boolean, isSneaking: boolean) {
    // 1. Natural Population Management & Respawning
    this.respawnCheckTimer += delta;
    if (this.respawnCheckTimer > 5.0) {
      this.respawnCheckTimer = 0;
      this.checkAndRespawnPopulations(playerX, playerZ);
    }

    // 2. Fish Trap Attraction & Catching Loop
    this.updateFishTraps(delta);

    // 3. Fish AI & Swimming Animation (Schooling + Stabilized Hunger/Predator System)
    this.updateFish(delta, playerX, playerZ, playerWadingFast, isSneaking);

    // 4. Shore Crabs AI
    this.updateCrabs(delta, playerX, playerZ);

    // 5. Sea Birds AI (No infinite seed spawning!)
    this.updateBirds(delta, playerX, playerZ);
  }

  // --- FISH TRAP ATTRACTION & CAPTURE ---
  private updateFishTraps(delta: number) {
    const placedTraps = this.engine.worldObjects.placedTraps;
    if (!placedTraps || placedTraps.length === 0) return;

    placedTraps.forEach((trap) => {
      if (!trap.bait) return;
      if (trap.caughtFish.length >= (trap.maxCapacity || 5)) return;

      // Find nearby matching fish within attraction radius (14m)
      this.fishList.forEach((fish) => {
        if (fish.isTrapped || fish.isSpooked) return;

        // Size restrictions: Large predators and sharks NEVER enter small fish traps!
        if (fish.species.isLargePredator || fish.species.role === 'apex_predator' || fish.sizeCm > 65) {
          return;
        }

        // Check bait preference against single or multiple preferred baits
        const baitMatch =
          fish.species.preferredBait === 'both' ||
          fish.species.preferredBait === trap.bait ||
          (fish.species.preferredBaits && fish.species.preferredBaits.includes(trap.bait as any)) ||
          (!fish.species.preferredBait && !fish.species.preferredBaits && Math.random() < 0.2);

        if (!baitMatch) return;

        const dx = trap.x - fish.x;
        const dz = trap.z - fish.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 14) {
          // Attracted! Head toward trap
          fish.targetX = trap.x + (Math.random() - 0.5) * 0.3;
          fish.targetZ = trap.z + (Math.random() - 0.5) * 0.3;

          // If fish enters the trap entrance (<0.65m) and fits the funnel (small non-predator fish <= 35cm only)
          const fitsTrap = fish.sizeCm <= 35 && fish.species.shape !== 'hammerhead' && fish.species.shape !== 'shark' && !fish.species.isLargePredator && !fish.species.isPredator;
          if (dist < 0.65 && fitsTrap && trap.caughtFish.length < (trap.maxCapacity || 5)) {
            // Trapped!
            trap.caughtFish.push({
              speciesId: fish.species.id,
              sizeCm: fish.sizeCm,
              caughtAt: Date.now()
            });

            fish.isTrapped = true;
            this.engine.scene.remove(fish.group);

            const idx = this.fishList.indexOf(fish);
            if (idx !== -1) {
              this.fishList.splice(idx, 1);
            }

            // Update 3D visual mini-fish in cage
            this.engine.updateTrapVisuals(trap);
          }
        }
      });
    });
  }

  // --- FISH AI (8-STATE BEHAVIOR MACHINE + STABILIZED PREDATOR HUNGER CYCLE + HABITAT COVER) ---
  private updateFish(delta: number, playerX: number, playerZ: number, playerWadingFast: boolean, isSneaking: boolean) {
    const chumClouds = this.engine.worldObjects.chumClouds || [];
    const seaGrassBeds = this.engine.worldObjects.seaGrassBeds || [];
    const kelpForest = this.engine.worldObjects.kelpForest || [];

    // A. Habitat Cover & Concealment Calculations (Sea Grass, Coral Shelters, Kelp, Shallows)
    this.fishList.forEach((fish) => {
      if (fish.isTrapped) return;

      fish.isInCover = false;
      fish.coverConcealment = 0;

      // 1. Proximity to Sea Grass beds (Dense ground camouflage)
      for (let b = 0; b < seaGrassBeds.length; b++) {
        const bed = seaGrassBeds[b];
        if (bed.hasGrass) {
          const dxB = bed.x - fish.x;
          const dzB = bed.z - fish.z;
          if (dxB * dxB + dzB * dzB < 16) { // within 4m
            fish.isInCover = true;
            fish.coverConcealment = Math.max(fish.coverConcealment, 0.80);
            break;
          }
        }
      }

      // 2. Proximity to Coral Reef shelters / bommies (Complex 3D crevices)
      for (let c = 0; c < this.coralShelters.length; c++) {
        const coral = this.coralShelters[c];
        const dxC = coral.x - fish.x;
        const dzC = coral.z - fish.z;
        if (dxC * dxC + dzC * dzC < 18) { // within 4.2m
          fish.isInCover = true;
          fish.coverConcealment = Math.max(fish.coverConcealment, 0.85);
          break;
        }
      }

      // 3. Proximity to Kelp Forest (Vertical canopy cover)
      for (let k = 0; k < kelpForest.length; k++) {
        const kelp = kelpForest[k];
        if (kelp.hasKelp) {
          const dxK = kelp.x - fish.x;
          const dzK = kelp.z - fish.z;
          if (dxK * dxK + dzK * dzK < 20) { // within 4.5m
            fish.isInCover = true;
            fish.coverConcealment = Math.max(fish.coverConcealment, 0.75);
            break;
          }
        }
      }

      // 4. Shallow Nursery flats: depth < 0.65m protects small fish from large oceanic predators
      const groundY = this.engine.getTerrainHeight(fish.x, fish.z);
      if (groundY > -0.65 && fish.sizeCm < 30) {
        fish.isInCover = true;
        fish.coverConcealment = Math.max(fish.coverConcealment, 0.70);
      }
    });

    // B. Schooling calculations (Group Centroid & Alignment for Schooling species ONLY)
    const schoolCentroids: Record<string, { x: number; z: number; count: number; vx: number; vz: number }> = {};
    this.fishList.forEach((fish) => {
      if (fish.isTrapped || !fish.species.isSchooling || fish.species.isSolitary) return;
      const spId = fish.species.id;
      if (!schoolCentroids[spId]) {
        schoolCentroids[spId] = { x: 0, z: 0, count: 0, vx: 0, vz: 0 };
      }
      schoolCentroids[spId].x += fish.x;
      schoolCentroids[spId].z += fish.z;
      schoolCentroids[spId].vx += fish.vx;
      schoolCentroids[spId].vz += fish.vz;
      schoolCentroids[spId].count++;
    });

    // Normalize centroids
    Object.keys(schoolCentroids).forEach((k) => {
      const c = schoolCentroids[k];
      if (c.count > 0) {
        c.x /= c.count;
        c.z /= c.count;
        c.vx /= c.count;
        c.vz /= c.count;
      }
    });

    // C. Individual Fish State, Hunger, Predation & Movement
    this.fishList.forEach((fish) => {
      if (fish.isTrapped) return;

      fish.stateTimer -= delta;

      // Spawn grace countdown for newly spawned prey
      if (fish.spawnGraceTimer > 0) {
        fish.spawnGraceTimer -= delta;
      }

      const isPredatory =
        fish.species.role === 'apex_predator' ||
        fish.species.role === 'mid_carnivore' ||
        fish.species.isPredator;

      // Metabolic Hunger & Cooldown Processing for Predators
      if (isPredatory) {
        fish.hunger = Math.max(0, fish.hunger - fish.hungerDecayRate * delta);
        if (fish.postMealCooldown > 0) fish.postMealCooldown -= delta;
        if (fish.failedHuntCooldown > 0) fish.failedHuntCooldown -= delta;
      }

      const dxToPlayer = fish.x - playerX;
      const dzToPlayer = fish.z - playerZ;
      const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dzToPlayer * dzToPlayer);

      // Player Proximity Threat Check
      let alertDist = fish.species.spookDistance;
      if (isSneaking) {
        alertDist *= 0.45;
      } else if (playerWadingFast) {
        alertDist *= 1.6;
      }

      if (fish.species.handCatchDifficulty === 'very_easy') {
        alertDist = Math.min(1.4, alertDist * 0.6);
      }

      // --- STATE TRANSITION EVALUATIONS ---

      // 1. Spook / Flee / Hide Trigger from Player
      if (distToPlayer < alertDist * 0.5 && !fish.isSpooked && !fish.species.isLargePredator) {
        fish.alertLevel = 1;
        fish.behaviorState = 'ALERT';
        const awayAngle = Math.atan2(dzToPlayer, dxToPlayer);
        fish.targetX = fish.x + Math.cos(awayAngle) * 4.5;
        fish.targetZ = fish.z + Math.sin(awayAngle) * 4.5;
      } else if (distToPlayer < alertDist && !fish.isSpooked && playerWadingFast && !fish.species.isLargePredator) {
        this.triggerSpook(fish, playerX, playerZ);
        fish.behaviorState = 'FLEE';

        // Small fish attempt to HIDE in nearby coral or sea grass
        if (fish.sizeCm < 35 && Math.random() < 0.6) {
          const nearestShelter = this.coralShelters.find(
            (c) => Math.sqrt(Math.pow(c.x - fish.x, 2) + Math.pow(c.z - fish.z, 2)) < 12
          );
          if (nearestShelter) {
            fish.behaviorState = 'HIDE';
            fish.targetX = nearestShelter.x + (Math.random() - 0.5) * 2;
            fish.targetZ = nearestShelter.z + (Math.random() - 0.5) * 2;
          }
        }
      }

      if (fish.isSpooked) {
        fish.spookTimer -= delta;
        if (fish.spookTimer <= 0) {
          fish.isSpooked = false;
          fish.alertLevel = 0;
          fish.behaviorState = 'CALM';
        }
      }

      // 2. Chum Scent Cloud Attraction (Attracts carnivorous & scent-following fish)
      if (!fish.isSpooked && chumClouds.length > 0) {
        const nearestChum = chumClouds.find((c) => {
          const d = Math.sqrt(Math.pow(c.x - fish.x, 2) + Math.pow(c.z - fish.z, 2));
          const maxDetectDist = (fish.species.isLargePredator || fish.species.role === 'apex_predator') ? 40 : 22;
          return d < maxDetectDist;
        });

        if (nearestChum) {
          const isAttracted =
            fish.species.role === 'apex_predator' ||
            fish.species.role === 'mid_carnivore' ||
            fish.species.preferredBaits?.includes('fish') ||
            fish.species.preferredBaits?.includes('crab') ||
            fish.species.preferredBaits?.includes('scallop') ||
            fish.species.preferredBaits?.includes('barnacle') ||
            fish.species.preferredBait === 'both' ||
            fish.species.preferredBait === 'crab';

          if (isAttracted) {
            fish.behaviorState = 'FEED';
            const orbitAngle = Date.now() * 0.002 + (parseInt(fish.id.slice(-3), 36) || 0);
            const orbitDist = 0.8 + (Math.random() * 1.8);
            fish.targetX = nearestChum.x + Math.cos(orbitAngle) * orbitDist;
            fish.targetZ = nearestChum.z + Math.sin(orbitAngle) * orbitDist;
          }
        }
      }

      // 3. Herbivore / Grazer Feeding (Sea Grass, Kelp & Algae)
      const isGrazer =
        fish.species.role === 'herbivore' ||
        fish.species.role === 'small_omnivore' ||
        fish.species.preferredBait === 'sea_grass' ||
        fish.species.preferredBaits?.includes('sea_grass') ||
        fish.species.preferredBaits?.includes('kelp');

      if (!fish.isSpooked && fish.behaviorState === 'CALM' && isGrazer) {
        if (fish.stateTimer <= 0 && Math.random() < 0.4) {
          fish.behaviorState = 'FEED';
          fish.stateTimer = 5 + Math.random() * 6;
          
          if (fish.species.preferredBaits?.includes('kelp') && kelpForest.length > 0) {
            const kelp = kelpForest[Math.floor(Math.random() * kelpForest.length)];
            if (kelp && kelp.hasKelp) {
              fish.targetX = kelp.x + (Math.random() - 0.5) * 2.0;
              fish.targetZ = kelp.z + (Math.random() - 0.5) * 2.0;
            }
          } else if (seaGrassBeds.length > 0) {
            const bed = seaGrassBeds[Math.floor(Math.random() * seaGrassBeds.length)];
            if (bed && bed.hasGrass) {
              fish.targetX = bed.x + (Math.random() - 0.5) * 1.5;
              fish.targetZ = bed.z + (Math.random() - 0.5) * 1.5;
            }
          }
        }
      }

      // 4. STABILIZED PREDATOR HUNGER SYSTEM (Satisfied -> Hungry -> Hunting -> Fed -> Satisfied)
      if (isPredatory && !fish.isSpooked) {
        fish.aggroCooldown -= delta;
        
        // Check player in deep open water / trench
        const playerDistFromIslandCenter = Math.sqrt(playerX * playerX + playerZ * playerZ);
        const inPredatorTerritory = playerDistFromIslandCenter > 50 || distToPlayer < 24;

        // Player curiosity / bluff in deep water (does not trigger prey slaughter)
        if (fish.species.isLargePredator && inPredatorTerritory && distToPlayer < 18 && fish.aggroCooldown <= 0) {
          if (fish.predatorAggroLevel === 0) {
            fish.predatorAggroLevel = 1;
            fish.behaviorState = 'HUNT';
            fish.aggroCooldown = 6.0;
          } else if (fish.predatorAggroLevel === 1 && distToPlayer < 10) {
            fish.predatorAggroLevel = 2;
            fish.behaviorState = 'HUNT';
            fish.aggroCooldown = 8.0;
          }
        }

        if (fish.predatorAggroLevel === 1) {
          // Circle player harmlessly at 8-10m radius
          const circleSpeed = 0.8;
          const circleAngle = Date.now() * 0.001 * circleSpeed + (parseInt(fish.id.slice(-2), 36) || 0);
          fish.targetX = playerX + Math.cos(circleAngle) * 8.5;
          fish.targetZ = playerZ + Math.sin(circleAngle) * 8.5;
          if (distToPlayer > 28) {
            fish.predatorAggroLevel = 0;
            fish.behaviorState = 'CALM';
          }
        } else if (fish.predatorAggroLevel === 2) {
          // Make a swift pass within 2.5m then break away
          fish.targetX = playerX + (Math.random() - 0.5) * 2;
          fish.targetZ = playerZ + (Math.random() - 0.5) * 2;
          if (distToPlayer < 2.5) {
            fish.predatorAggroLevel = 0;
            fish.behaviorState = 'CALM';
            fish.aggroCooldown = 10.0;
          }
        } else {
          // --- PREY TARGETING & HUNGER CYCLES ---
          const isSatisfied = fish.hunger >= 0.58 || fish.postMealCooldown > 0;
          const isHungry = fish.hunger < 0.58 && fish.postMealCooldown <= 0 && fish.failedHuntCooldown <= 0;

          if (isSatisfied) {
            // SATISFIED STATE: Zero motivation to hunt! Calmly cruises and patrols territory.
            if (fish.isHunting) {
              fish.isHunting = false;
              fish.huntTargetFishId = null;
              fish.behaviorState = 'CALM';
            }
          } else if (isHungry) {
            // HUNGRY STATE: Actively scans for suitable prey factoring distance, size, and habitat cover
            if (!fish.isHunting) {
              const baseDetectRadius = fish.species.isLargePredator ? 24 : (fish.species.role === 'apex_predator' ? 22 : 14);
              const maxRatio = fish.species.maxPreySizeRatio ?? 0.45;

              let bestPrey: FishInstance | null = null;
              let bestScore = -999;

              for (let i = 0; i < this.fishList.length; i++) {
                const candidate = this.fishList[i];
                if (candidate.id === fish.id || candidate.isTrapped || candidate.id === fish.lastPreyTargetId) continue;
                
                // Do not hunt other apex or giant predators
                if (candidate.species.role === 'apex_predator' || candidate.species.isLargePredator) continue;
                // Prey size ratio restriction
                if (candidate.sizeCm > fish.sizeCm * maxRatio) continue;

                const dxP = candidate.x - fish.x;
                const dzP = candidate.z - fish.z;
                const dist = Math.sqrt(dxP * dxP + dzP * dzP);

                // Concealment reduces effective detection distance
                const effectiveRadius = baseDetectRadius * (1.0 - candidate.coverConcealment * 0.75);
                if (dist > effectiveRadius) continue;

                // Heavily sheltered prey has high chance of being ignored
                if (candidate.coverConcealment >= 0.75 && Math.random() < 0.75) continue;
                // Spawn grace protection for newly arrived prey
                if (candidate.spawnGraceTimer > 0 && Math.random() < 0.80) continue;

                // Score: closer is better, open water prey is prime target
                const score = 100 - dist * 2 - candidate.coverConcealment * 50;
                if (score > bestScore) {
                  bestScore = score;
                  bestPrey = candidate;
                }
              }

              if (bestPrey) {
                fish.isHunting = true;
                fish.huntTargetFishId = bestPrey.id;
                fish.huntDurationTimer = 0;
                fish.behaviorState = 'HUNT';
                this.telemetry.totalHuntsAttempted++;
              } else {
                // No viable target found, pause search briefly
                fish.failedHuntCooldown = 3.5 + Math.random() * 3.5;
              }
            }

            // ACTIVE HUNT PURSUIT & ESCAPE RESOLUTION
            if (fish.isHunting && fish.huntTargetFishId) {
              fish.huntDurationTimer += delta;
              const maxChaseTime = fish.species.isLargePredator ? 6.5 : 5.0;

              const prey = this.fishList.find((f) => f.id === fish.huntTargetFishId);
              if (!prey || prey.isTrapped) {
                // Prey despawned or trapped
                fish.isHunting = false;
                fish.huntTargetFishId = null;
                fish.failedHuntCooldown = 4.0;
                fish.behaviorState = 'CALM';
              } else if (fish.huntDurationTimer > maxChaseTime) {
                // HUNT FAILED: Predator stamina exhausted, prey escaped!
                fish.isHunting = false;
                fish.lastPreyTargetId = prey.id;
                fish.huntTargetFishId = null;
                fish.failedHuntCooldown = 14.0 + Math.random() * 8.0;
                fish.behaviorState = 'CALM';
                fish.stateTimer = 4.0;
                this.telemetry.failedHunts++;
                this.telemetry.preyEscapes++;
              } else {
                // Steer predator towards prey
                fish.targetX = prey.x;
                fish.targetZ = prey.z;

                const dxPrey = prey.x - fish.x;
                const dzPrey = prey.z - fish.z;
                const distToPrey = Math.sqrt(dxPrey * dxPrey + dzPrey * dzPrey);

                // Prey detects incoming predator and triggers defensive evasion
                if (distToPrey < (fish.species.isLargePredator ? 6.0 : 4.0)) {
                  if (!prey.isSpooked) {
                    this.triggerSpook(prey, fish.x, fish.z);
                    prey.burstMultiplier = 2.6;
                    // School scattering defense
                    if (prey.species.isSchooling) {
                      this.scatterSchool(prey.species.id, fish.x, fish.z);
                    }
                  }
                }

                // If prey reaches dense cover and puts distance between itself and predator -> Escape!
                if (prey.coverConcealment >= 0.75 && distToPrey > 1.8) {
                  fish.isHunting = false;
                  fish.lastPreyTargetId = prey.id;
                  fish.huntTargetFishId = null;
                  fish.failedHuntCooldown = 12.0 + Math.random() * 6.0;
                  fish.behaviorState = 'CALM';
                  this.telemetry.failedHunts++;
                  this.telemetry.preyEscapes++;
                } else if (distToPrey < 0.75) {
                  // STRIKE DISTANCE ATTEMPT
                  const catchChance = 0.55 + (prey.coverConcealment === 0 ? 0.15 : -0.15) + (fish.species.isLargePredator ? 0.10 : 0);

                  if (Math.random() < catchChance) {
                    // SUCCESSFUL HUNT: Prey consumed!
                    this.catchFishInstance(prey);
                    const nutrition = Math.min(0.85, (prey.sizeCm / Math.max(15, fish.sizeCm * 0.45)) * 0.6 + 0.35);
                    fish.hunger = Math.min(1.0, fish.hunger + nutrition);
                    // Long post-meal satisfied rest cooldown (40-90s)
                    fish.postMealCooldown = 35 + (fish.species.isLargePredator ? 45 : 20) * fish.hunger + Math.random() * 15;
                    fish.isHunting = false;
                    fish.huntTargetFishId = null;
                    fish.behaviorState = 'REST';
                    fish.stateTimer = 5.0;
                    this.telemetry.successfulHunts++;
                    this.telemetry.predatorKills++;
                  } else {
                    // FAILED STRIKE: Prey executes an emergency dodge burst!
                    prey.isSpooked = true;
                    prey.spookTimer = 3.5;
                    prey.burstMultiplier = 2.9;

                    fish.isHunting = false;
                    fish.lastPreyTargetId = prey.id;
                    fish.huntTargetFishId = null;
                    fish.failedHuntCooldown = 14.0 + Math.random() * 8.0;
                    fish.behaviorState = 'CALM';
                    fish.stateTimer = 3.5;
                    this.telemetry.failedHunts++;
                    this.telemetry.preyEscapes++;
                  }
                }
              }
            }
          }
        }
      }

      // 5. Schooling Cohesion & Alignment (Schooling species only; solitary fish never school)
      if (fish.species.isSchooling && !fish.species.isSolitary && !fish.isSpooked && !fish.isHunting && fish.behaviorState !== 'FEED') {
        const centroid = schoolCentroids[fish.species.id];
        if (centroid && centroid.count > 1) {
          fish.behaviorState = 'SCHOOL';
          const dxC = centroid.x - fish.x;
          const dzC = centroid.z - fish.z;
          const distC = Math.sqrt(dxC * dxC + dzC * dzC);

          if (distC > 4.5) {
            fish.targetX = fish.targetX * 0.85 + centroid.x * 0.15;
            fish.targetZ = fish.targetZ * 0.85 + centroid.z * 0.15;
          }

          fish.vx = fish.vx * 0.95 + centroid.vx * 0.05;
          fish.vz = fish.vz * 0.95 + centroid.vz * 0.05;
        }
      }

      // 5b. Pairing Behavior (Pairing species look for a companion)
      if (fish.species.isPairing && !fish.isSpooked && fish.behaviorState === 'CALM') {
        const partner = this.fishList.find(
          (other) =>
            other.id !== fish.id &&
            other.species.id === fish.species.id &&
            Math.sqrt(Math.pow(other.x - fish.x, 2) + Math.pow(other.z - fish.z, 2)) < 15
        );
        if (partner) {
          fish.targetX = fish.targetX * 0.92 + partner.x * 0.08;
          fish.targetZ = fish.targetZ * 0.92 + partner.z * 0.08;
        }
      }

      // 6. Natural Roaming & Rest State
      if (fish.behaviorState === 'CALM' && fish.stateTimer <= 0) {
        fish.stateTimer = 4 + Math.random() * 8;
        if (Math.random() < 0.25) {
          fish.behaviorState = 'REST';
          fish.stateTimer = 3 + Math.random() * 4;
        }
      }

      // --- MOVEMENT & PHYSICS ---
      const dx = fish.targetX - fish.x;
      const dz = fish.targetZ - fish.z;
      const distToTarget = Math.sqrt(dx * dx + dz * dz);

      if (distToTarget < 1.6 || Math.random() < 0.006) {
        const angle = Math.random() * Math.PI * 2;
        let radius = 24 + Math.random() * 32;
        if (fish.species.habitatZone === 'deep_trench') radius = 105 + Math.random() * 30;
        else if (fish.species.habitatZone === 'open_sea') radius = 75 + Math.random() * 40;
        else if (fish.species.habitatZone === 'kelp_forest') radius = 70 + Math.random() * 32;
        else if (fish.species.habitatZone === 'coral_reef') radius = 48 + Math.random() * 24;

        fish.targetX = Math.cos(angle) * radius;
        fish.targetZ = Math.sin(angle) * radius;
      }

      let speedMultiplier = 1.0;
      if (fish.behaviorState === 'FLEE' || fish.isSpooked) {
        speedMultiplier = fish.burstMultiplier;
      } else if (fish.behaviorState === 'HUNT' || fish.isHunting || fish.predatorAggroLevel === 2) {
        speedMultiplier = 2.4;
      } else if (fish.behaviorState === 'ALERT' || fish.predatorAggroLevel === 1) {
        speedMultiplier = 1.35;
      } else if (fish.behaviorState === 'REST') {
        speedMultiplier = 0.15;
      } else if (fish.behaviorState === 'FEED') {
        speedMultiplier = 0.65;
      }

      const speed = fish.species.swimSpeed * speedMultiplier;
      const angleToTarget = Math.atan2(dz, dx);

      const targetVx = Math.cos(angleToTarget) * speed;
      const targetVz = Math.sin(angleToTarget) * speed;

      fish.vx += (targetVx - fish.vx) * delta * 2.8;
      fish.vz += (targetVz - fish.vz) * delta * 2.8;

      fish.x += fish.vx * delta;
      fish.z += fish.vz * delta;

      // Keep within ocean water boundaries (strictly avoid getting beached on central island or protruding)
      const groundY = this.engine.getTerrainHeight(fish.x, fish.z);
      const isLargeApex = fish.species.isLargePredator || fish.species.role === 'apex_predator' || fish.sizeCm > 80;
      
      if (isLargeApex && (groundY > -1.8 || Math.sqrt(fish.x * fish.x + fish.z * fish.z) < 32)) {
        const currentAngle = Math.atan2(fish.z, fish.x);
        fish.targetX = Math.cos(currentAngle) * 75;
        fish.targetZ = Math.sin(currentAngle) * 75;
      } else if (groundY > -0.4) {
        const currentAngle = Math.atan2(fish.z, fish.x);
        fish.targetX = Math.cos(currentAngle) * 45;
        fish.targetZ = Math.sin(currentAngle) * 45;
      }

      // Strong repulsive force away from shallow island shores
      if (groundY > -0.3) {
        const centerDist = Math.sqrt(fish.x * fish.x + fish.z * fish.z);
        if (centerDist > 0.1) {
          fish.vx += (fish.x / centerDist) * 8.0 * delta;
          fish.vz += (fish.z / centerDist) * 8.0 * delta;
        }
      }

      // Vertical position based on depth preference & terrain
      let targetY = -0.45;
      if (fish.species.depthPreference === 'bottom') {
        targetY = Math.min(-0.18, groundY + 0.18);
      } else if (fish.species.depthPreference === 'surface') {
        targetY = -0.16;
      } else if (fish.species.habitatZone === 'deep_trench') {
        targetY = Math.min(-4.0, groundY + 2.5);
      } else if (fish.species.habitatZone === 'kelp_forest') {
        targetY = Math.min(-2.0, (groundY - 0.2) * 0.6);
      } else {
        targetY = Math.min(-0.3, (groundY - 0.1) * 0.55);
      }

      if (fish.behaviorState === 'HIDE') {
        targetY = groundY + 0.08; // Tuck close to seabed/coral
      }

      fish.y += (targetY - fish.y) * delta * 3.5;

      // Rigid collision clamping to prevent protruding above water surface or clipping through seabed
      const maxSurfaceY = -0.08;
      const minSeabedY = groundY + (fish.sizeCm > 100 ? 0.35 : 0.10);
      fish.y = Math.min(maxSurfaceY, Math.max(minSeabedY, fish.y));

      fish.group.position.set(fish.x, fish.y, fish.z);

      // Smooth heading with shortest angular difference interpolation (no 180 snap)
      const targetHeading = Math.atan2(-fish.vz, fish.vx) + Math.PI / 2;
      let diff = targetHeading - fish.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      const turnRate = (fish.behaviorState === 'FLEE' || fish.behaviorState === 'HUNT') ? 9.0 : 4.5;
      fish.group.rotation.y += diff * Math.min(1.0, delta * turnRate);

      // Natural banking on turns: lean into curvature
      const bankAmount = Math.max(-0.4, Math.min(0.4, diff * 1.2));

      // Swimming waggle with sinusoidal body and tail flexion
      const waggleSpeed = (fish.behaviorState === 'FLEE' || fish.behaviorState === 'HUNT') ? 16 : (fish.behaviorState === 'REST' ? 2.5 : fish.wiggleSpeed);
      fish.phase += delta * waggleSpeed;
      const waggle = Math.sin(fish.phase) * ((fish.behaviorState === 'FLEE' || fish.behaviorState === 'HUNT') ? 0.45 : 0.22);
      
      fish.tailMesh.rotation.y = waggle;
      fish.bodyMesh.rotation.y = waggle * 0.25;
      fish.group.rotation.z = bankAmount * 0.75 + waggle * 0.08;
    });
  }

  // --- CRAB AI ---
  private updateCrabs(delta: number, playerX: number, playerZ: number) {
    this.crabs.forEach((crab) => {
      const dxToPlayer = crab.x - playerX;
      const dzToPlayer = crab.z - playerZ;
      const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dzToPlayer * dzToPlayer);

      if (distToPlayer < 4.2) {
        crab.isFleeing = true;
        crab.targetX = crab.x + dxToPlayer * 2 + (Math.random() - 0.5) * 3;
        crab.targetZ = crab.z + dzToPlayer * 2 + (Math.random() - 0.5) * 3;
        crab.clawLeft.rotation.x = 0.5;
        crab.clawRight.rotation.x = 0.5;
      } else if (Math.random() < 0.015) {
        crab.isFleeing = false;
        crab.clawLeft.rotation.x = 0;
        crab.clawRight.rotation.x = 0;
        crab.targetX = crab.x + (Math.random() - 0.5) * 5;
        crab.targetZ = crab.z + (Math.random() - 0.5) * 5;
      }

      const dx = crab.targetX - crab.x;
      const dz = crab.targetZ - crab.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.3) {
        const speed = crab.isFleeing ? 2.4 : 0.85;
        crab.vx = (dx / dist) * speed;
        crab.vz = (dz / dist) * speed;
        crab.x += crab.vx * delta;
        crab.z += crab.vz * delta;

        crab.group.rotation.y = Math.atan2(crab.vz, crab.vx) + Math.PI / 2;
        crab.walkCycle += delta * (crab.isFleeing ? 18 : 8);
        crab.group.rotation.z = Math.sin(crab.walkCycle) * 0.15;
      } else {
        crab.vx = 0;
        crab.vz = 0;
      }

      const groundY = this.engine.getTerrainHeight(crab.x, crab.z);
      crab.y = Math.max(0.04, groundY + 0.05);
      crab.group.position.set(crab.x, crab.y, crab.z);
    });
  }

  // --- SEA BIRDS AI (FIXED: NO SEED DUPLICATION) ---
  private updateBirds(delta: number, playerX: number, playerZ: number) {
    this.birds.forEach((bird) => {
      bird.stateTimer -= delta;

      if (bird.state === 'flying') {
        bird.circleAngle += bird.circleSpeed * delta;
        bird.x = Math.cos(bird.circleAngle) * bird.circleRadius;
        bird.z = Math.sin(bird.circleAngle) * bird.circleRadius;
        bird.y = 12 + Math.sin(bird.circleAngle * 2) * 2;

        bird.group.position.set(bird.x, bird.y, bird.z);
        bird.group.rotation.y = -bird.circleAngle + Math.PI / 2;
        bird.group.rotation.z = 0.2;

        const flap = Math.sin(Date.now() * 0.008) * 0.45;
        bird.wingLeft.rotation.z = flap;
        bird.wingRight.rotation.z = -flap;

        if (bird.stateTimer <= 0 && Math.random() < 0.5) {
          bird.state = 'landing';
          bird.stateTimer = 4;
          const beachAngle = Math.random() * Math.PI * 2;
          bird.targetX = Math.cos(beachAngle) * 20;
          bird.targetZ = Math.sin(beachAngle) * 20;
          bird.targetY = Math.max(0.2, this.engine.getTerrainHeight(bird.targetX, bird.targetZ) + 0.15);
        }
      } else if (bird.state === 'landing') {
        bird.x += (bird.targetX - bird.x) * delta * 1.5;
        bird.y += (bird.targetY - bird.y) * delta * 1.5;
        bird.z += (bird.targetZ - bird.z) * delta * 1.5;

        bird.group.position.set(bird.x, bird.y, bird.z);

        const flap = Math.sin(Date.now() * 0.015) * 0.6;
        bird.wingLeft.rotation.z = flap;
        bird.wingRight.rotation.z = -flap;

        if (Math.abs(bird.y - bird.targetY) < 0.3 || bird.stateTimer <= 0) {
          bird.state = 'pecking';
          bird.stateTimer = 6 + Math.random() * 6;
          bird.wingLeft.rotation.z = 0;
          bird.wingRight.rotation.z = 0;
          bird.group.rotation.z = 0;
        }
      } else if (bird.state === 'pecking') {
        const bob = Math.sin(Date.now() * 0.006) * 0.25;
        bird.group.rotation.x = Math.max(0, bob);

        const distToPlayer = Math.sqrt(Math.pow(bird.x - playerX, 2) + Math.pow(bird.z - playerZ, 2));
        if (distToPlayer < 5.0 || bird.stateTimer <= 0) {
          bird.state = 'takeoff';
          bird.stateTimer = 3;
        }
      } else if (bird.state === 'takeoff') {
        bird.y += delta * 6;
        bird.x += (Math.random() - 0.5) * delta * 4;
        bird.z += (Math.random() - 0.5) * delta * 4;

        bird.group.position.set(bird.x, bird.y, bird.z);

        const flap = Math.sin(Date.now() * 0.02) * 0.7;
        bird.wingLeft.rotation.z = flap;
        bird.wingRight.rotation.z = -flap;

        if (bird.y > 12 || bird.stateTimer <= 0) {
          bird.state = 'flying';
          bird.stateTimer = 12 + Math.random() * 15;
        }
      }
    });
  }

  // --- NATURAL ECOSYSTEM EQUILIBRIUM & RESPAWNING ---
  private checkAndRespawnPopulations(playerX: number, playerZ: number) {
    let preyCount = 0;
    let mesopredatorCount = 0;
    let apexCount = 0;
    let totalPredatorHunger = 0;
    let predatorTotal = 0;

    this.fishList.forEach((fish) => {
      if (fish.isTrapped) return;
      if (fish.species.role === 'apex_predator' || fish.species.isLargePredator) {
        apexCount++;
        totalPredatorHunger += fish.hunger;
        predatorTotal++;
      } else if (fish.species.role === 'mid_carnivore' || fish.species.isPredator) {
        mesopredatorCount++;
        totalPredatorHunger += fish.hunger;
        predatorTotal++;
      } else {
        preyCount++;
      }
    });

    // Update internal telemetry
    this.telemetry.totalPrey = preyCount;
    this.telemetry.totalMesopredators = mesopredatorCount;
    this.telemetry.totalApexPredators = apexCount;
    this.telemetry.avgPredatorHunger = predatorTotal > 0 ? (totalPredatorHunger / predatorTotal) : 1.0;
    this.telemetry.huntSuccessRate = this.telemetry.totalHuntsAttempted > 0
      ? Math.round((this.telemetry.successfulHunts / this.telemetry.totalHuntsAttempted) * 100)
      : 0;

    // Total target prey biomass capacity across all small & medium species (~49 total)
    const targetPreyCapacity = 49;
    const preyRatio = preyCount / targetPreyCapacity;

    FISH_SPECIES.forEach((species) => {
      const isApex = species.role === 'apex_predator' || species.isLargePredator;
      const isMeso = species.role === 'mid_carnivore' || species.isPredator;
      const isPrey = !isApex && !isMeso;

      // If prey biomass is suppressed (<60% capacity), pause all predator respawns until prey recovers
      if ((isApex || isMeso) && preyRatio < 0.60) {
        return;
      }

      const targetCount = this.populationCaps[species.id] || 3;
      const currentCount = this.fishList.filter((f) => f.species.id === species.id && !f.isTrapped).length;

      if (currentCount < targetCount) {
        // Spawn replacement with spawn protection
        this.spawnFish(species, currentCount, false, playerX, playerZ);
      }
    });
  }

  // --- TELEMETRY GETTER (FOR MONITORING & EQUILIBRIUM HEALTH) ---
  public getTelemetry(): EcosystemTelemetry {
    return { ...this.telemetry };
  }

  // --- CATCH & REMOVE FISH ---
  public catchFishInstance(fish: FishInstance) {
    this.engine.scene.remove(fish.group);
    const idx = this.fishList.indexOf(fish);
    if (idx !== -1) {
      this.fishList.splice(idx, 1);
    }
  }

  // --- CATCH CRAB ---
  public catchCrabInstance(crab: ShoreCrab) {
    this.engine.scene.remove(crab.group);
    const idx = this.crabs.indexOf(crab);
    if (idx !== -1) {
      this.crabs.splice(idx, 1);
    }
  }

  // --- RELEASE LIVE FISH (FROM PALM SHELL STORAGE) ---
  public releaseLiveFish(speciesId: string, sizeCm: number, x: number, z: number): FishInstance | null {
    const species = FISH_SPECIES.find((s) => s.id === speciesId) || FISH_SPECIES[0];
    const fish = this.spawnFish(species, this.fishList.length, false, x, z);
    fish.x = x;
    fish.z = z;
    fish.sizeCm = sizeCm;
    const groundY = this.engine.getTerrainHeight(x, z);
    fish.y = Math.max(groundY + 0.15, Math.min(-0.25, groundY + 0.6));
    fish.group.position.set(fish.x, fish.y, fish.z);
    fish.isSpooked = true;
    fish.spookTimer = 3.0;
    fish.burstMultiplier = 2.0;
    return fish;
  }
}
