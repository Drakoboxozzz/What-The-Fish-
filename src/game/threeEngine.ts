/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PlantedTree, PlacedTrap, StructureType, PlacedStructure, PlacedRaft, PlacedCraftingTable, GraphicsQuality, ToolType, BaitType, DroppedLootContainer } from '../types';

export interface ThrownProjectile {
  id: string;
  type: 'spear' | 'rock';
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  lifeTime: number;
  hasSplashedWater: boolean;
  hasHitGround: boolean;
}

export interface WaterSplash {
  group: THREE.Group;
  particles: THREE.Mesh[];
  velocities: THREE.Vector3[];
  life: number;
}

export interface RockHitSpark {
  group: THREE.Group;
  particles: THREE.Mesh[];
  velocities: THREE.Vector3[];
  life: number;
}

export interface FallenLog {
  id: string;
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  woodRemaining: number;
}

// Explicit physics classification: buoyant items float on water surface; rocks and heavy items sink
export function isItemBuoyant(type: string): boolean {
  return (
    type === 'wood' ||
    type === 'palm_shell' ||
    type === 'live_fish_shell' ||
    type === 'seed' ||
    type === 'fiber' ||
    type === 'rope' ||
    type === 'fruit' ||
    type === 'simple_raft' ||
    type === 'raft_sail' ||
    type === 'raft_expansion' ||
    type === 'fish_trap' ||
    type === 'wood_structure'
  );
}

export interface ScallopItem {
  id: string;
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  isCollected: boolean;
  respawnTimer: number;
}

export interface BarnacleCluster {
  id: string;
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  count: number;
  initialCount: number;
  isDepleted: boolean;
  barnacleMeshes: THREE.Mesh[];
  respawnTimer: number;
}

export interface SeaGrassBed {
  id: string;
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  hasGrass: boolean;
  blades: THREE.Mesh[];
  respawnTimer: number;
}

export interface KelpStalk {
  id: string;
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  height: number;
  hasKelp: boolean;
  fronds: THREE.Mesh[];
  respawnTimer: number;
}

export interface ChumScentCloud {
  id: string;
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  particles: THREE.Points;
  life: number;
  maxLife: number;
}

export interface WorldObjects {
  palmTrees: Array<{
    group: THREE.Group;
    x: number;
    z: number;
    health: number;
    initialY: number;
    isChopped: boolean;
  }>;
  fallenLogs: FallenLog[];
  bushes: Array<{
    group: THREE.Group;
    x: number;
    z: number;
    hasFiber: boolean;
  }>;
  groundRocks: Array<{
    mesh: THREE.Mesh;
    id: string;
    x: number;
    z: number;
    size: number;
    health: number;
    isPicked: boolean;
    isLargeBoulder: boolean;
  }>;
  groundItems: Array<{
    group: THREE.Group;
    id: string;
    type: ToolType;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
  }>;
  scallopBeds: ScallopItem[];
  barnacleClusters: BarnacleCluster[];
  seaGrassBeds: SeaGrassBed[];
  kelpForest: KelpStalk[];
  chumClouds: ChumScentCloud[];
  plantedTrees: Array<{
    id: string;
    group: THREE.Group;
    stage: number; // 0: sprout, 1: young, 2: adult harvestable
    plantedAt: number;
    x: number;
    z: number;
    health: number;
  }>;
  placedTraps: PlacedTrap[];
  placedCraftingTables: Array<{
    id: string;
    group: THREE.Group;
    x: number;
    y: number;
    z: number;
    rotY: number;
  }>;
  placedRafts: Array<{
    id: string;
    group: THREE.Group;
    sailMesh: THREE.Mesh | null;
    expansionGroup: THREE.Group | null;
    x: number;
    y: number;
    z: number;
    rotY: number;
    hasSail: boolean;
    isExpanded: boolean;
    speed: number;
    turnSpeed: number;
  }>;
  structures: Array<{
    id: string;
    type: StructureType;
    group: THREE.Group;
    x: number;
    y: number;
    z: number;
    rotY: number;
  }>;
  projectiles: ThrownProjectile[];
  waterSplashes: WaterSplash[];
  rockSparks: RockHitSpark[];
  droppedLootContainers: DroppedLootContainer[];
}

export class IslandThreeEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public container: HTMLElement;
  public waterMesh: THREE.Mesh;
  public terrainMesh: THREE.Mesh;
  public worldObjects: WorldObjects;
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.HemisphereLight;

  public ghostGroup: THREE.Group;
  
  private clock: THREE.Clock;
  private waterMaterial: THREE.MeshStandardMaterial;
  private underwaterParticles: THREE.Points;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#87CEEB'); // Vibrant Sky Blue
    this.scene.fog = new THREE.FogExp2('#74B9FF', 0.008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      350
    );
    this.camera.position.set(0, 2, 10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    container.appendChild(this.renderer.domElement);

    // Lights
    this.ambientLight = new THREE.HemisphereLight('#87CEEB', '#0097A7', 1.1);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight('#FFFBEB', 2.0);
    this.sunLight.position.set(55, 75, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 180;
    this.sunLight.shadow.camera.left = -55;
    this.sunLight.shadow.camera.right = 55;
    this.sunLight.shadow.camera.top = 55;
    this.sunLight.shadow.camera.bottom = -55;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // World collections
    this.worldObjects = {
      palmTrees: [],
      fallenLogs: [],
      bushes: [],
      groundRocks: [],
      groundItems: [],
      scallopBeds: [],
      barnacleClusters: [],
      plantedTrees: [],
      placedTraps: [],
      placedCraftingTables: [],
      placedRafts: [],
      structures: [],
      seaGrassBeds: [],
      kelpForest: [],
      chumClouds: [],
      projectiles: [],
      waterSplashes: [],
      rockSparks: [],
      droppedLootContainers: []
    };

    // Ghost structure preview container
    this.ghostGroup = new THREE.Group();
    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);

    // Build Island Terrain & Water
    const terrain = this.createIslandTerrain();
    this.terrainMesh = terrain;
    this.scene.add(terrain);

    const water = this.createWater();
    this.waterMesh = water;
    this.waterMaterial = water.material as THREE.MeshStandardMaterial;
    this.scene.add(water);

    // Build Flora, Rocks, Corals, Sea Grass & Kelp Forest
    this.populateIsland();

    // Restore persistent world state if saved
    this.loadWorldState();

    // Underwater particulate
    this.underwaterParticles = this.createUnderwaterParticles();
    this.scene.add(this.underwaterParticles);

    // Sky dome / Clouds
    this.createSkyElements();

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);
  }

  // --- HEIGHT MAP GENERATOR (DEFINED CONTINUOUS OCEAN SYSTEM) ---
  // Progression: Island -> Shallow Lagoon -> Coral Reef Rim -> Open Sea & Kelp Forest -> Deep Ocean Trench
  public getTerrainHeight(x: number, z: number): number {
    const dist = Math.sqrt(x * x + z * z);
    const islandCoreRadius = 22;
    const shallowLagoonOuter = 50;
    const coralReefOuter = 72;
    const openSeaOuter = 115;
    const trenchOuter = 145;

    // 1. Rocky Outcrop Ridge on North-West quadrant (x: -26..-10, z: -26..-10)
    const rockRidgeDist = Math.sqrt(Math.pow(x + 18, 2) + Math.pow(z + 16, 2));
    let rockyElev = 0;
    if (rockRidgeDist < 14) {
      const rf = 1 - rockRidgeDist / 14;
      rockyElev = Math.pow(rf, 1.3) * 5.2 + Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.7;
    }

    // 2. Central Island Knoll & Dunes (x, z inside islandCoreRadius)
    let islandElevation = 0;
    if (dist < islandCoreRadius) {
      const coreFactor = 1 - dist / islandCoreRadius;
      islandElevation = Math.pow(coreFactor, 1.4) * 3.8 + Math.sin(x * 0.25) * Math.cos(z * 0.25) * 0.4;
    }

    // 3. Shallow Lagoon Ring (Radius 22m to 50m: Depth -0.4m to -2.4m)
    let lagoonProfile = 0;
    if (dist >= islandCoreRadius && dist < shallowLagoonOuter) {
      const t = (dist - islandCoreRadius) / (shallowLagoonOuter - islandCoreRadius);
      const channelDepth = Math.sin(t * Math.PI) * 2.2;
      lagoonProfile = -0.35 - channelDepth;
    }

    // 4. Coral Reef Barrier & Underwater Pinnacles (Radius 50m to 72m: Depth -2.2m to -3.8m)
    let coralReefProfile = 0;
    if (dist >= shallowLagoonOuter && dist < coralReefOuter) {
      const rt = (dist - shallowLagoonOuter) / (coralReefOuter - shallowLagoonOuter);
      // Reef crest rises slightly then slopes into open sea
      const reefCrest = Math.sin(rt * Math.PI) * 1.4;
      coralReefProfile = -2.6 + reefCrest - (rt * 1.6);
    }

    // 5. Open Sea & Kelp Forest Slopes (Radius 72m to 115m: Depth -4.5m to -8.8m)
    let openSeaProfile = 0;
    if (dist >= coralReefOuter && dist < openSeaOuter) {
      const st = (dist - coralReefOuter) / (openSeaOuter - coralReefOuter);
      const kelpShelf = Math.sin(st * Math.PI * 1.5) * 0.9;
      openSeaProfile = -4.2 - (st * 4.4) + kelpShelf;
    }

    // 6. Deep Ocean Trench & Abyssal Drop (Radius 115m to 145m: Depth -9.0m to -13.5m)
    let deepTrenchProfile = 0;
    if (dist >= openSeaOuter && dist < trenchOuter) {
      const dt = (dist - openSeaOuter) / (trenchOuter - openSeaOuter);
      deepTrenchProfile = -8.8 - (dt * 4.6);
    }

    // 7. Natural Boundary Abyss (Beyond 145m)
    let outerAbyss = 0;
    if (dist >= trenchOuter) {
      const at = Math.min(1.0, (dist - trenchOuter) * 0.15);
      outerAbyss = -13.5 - (at * 4.5);
    }

    // Underwater micro-topography & sand waves
    const ripples = Math.sin(x * 0.16 + z * 0.12) * 0.28 + Math.cos(x * 0.28 - z * 0.18) * 0.18;

    let baseHeight = 0;
    if (dist < islandCoreRadius) {
      baseHeight = islandElevation;
    } else if (dist < shallowLagoonOuter) {
      baseHeight = lagoonProfile;
    } else if (dist < coralReefOuter) {
      baseHeight = coralReefProfile;
    } else if (dist < openSeaOuter) {
      baseHeight = openSeaProfile;
    } else if (dist < trenchOuter) {
      baseHeight = deepTrenchProfile;
    } else {
      baseHeight = outerAbyss;
    }

    return baseHeight + rockyElev + ripples;
  }

  // --- EXPANDED TERRAIN CREATION (300m x 300m) ---
  private createIslandTerrain(): THREE.Mesh {
    const geom = new THREE.PlaneGeometry(300, 300, 160, 160);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors: number[] = [];

    const sandColor = new THREE.Color('#F7D794'); // Golden beach sand
    const duneColor = new THREE.Color('#F5CD79'); // Sunlit dune
    const greenGrass = new THREE.Color('#68D391'); // Island vegetation patch
    const rockColor = new THREE.Color('#576574');  // Rugged volcanic stone
    const shallowLagoonSand = new THREE.Color('#48CAE4'); // Turquoise shallow bed
    const coralReefBed = new THREE.Color('#14b8a6');   // Teal coral substrate
    const kelpFloorColor = new THREE.Color('#4d7c0f');  // Olive-amber kelp seabed
    const deepOceanBed = new THREE.Color('#0369a1');   // Deep ocean navy
    const abyssalBed = new THREE.Color('#0f172a');     // Deep trench abyss

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getTerrainHeight(x, z);
      pos.setY(i, y);

      const dist = Math.sqrt(x * x + z * z);
      const isNWOutcrop = Math.sqrt(Math.pow(x + 18, 2) + Math.pow(z + 16, 2)) < 12;

      let vertexColor = sandColor.clone();

      if (isNWOutcrop && y > 1.2) {
        vertexColor.lerp(rockColor, Math.min(1.0, (y - 1.0) / 3.0));
      } else if (y > 2.0 && dist < 14) {
        vertexColor.lerp(greenGrass, Math.min(0.85, (y - 2.0) / 1.8));
      } else if (y > 0.8) {
        vertexColor.lerp(duneColor, 0.4);
      } else if (y < 0 && y > -2.2) {
        vertexColor.lerp(shallowLagoonSand, Math.min(0.75, Math.abs(y) / 2.2));
      } else if (y <= -2.2 && y > -4.5) {
        vertexColor.lerp(coralReefBed, Math.min(0.8, (Math.abs(y) - 2.2) / 2.3));
      } else if (y <= -4.5 && y > -8.5) {
        vertexColor.lerp(kelpFloorColor, Math.min(0.85, (Math.abs(y) - 4.5) / 4.0));
      } else if (y <= -8.5 && y > -12.5) {
        vertexColor.lerp(deepOceanBed, Math.min(0.9, (Math.abs(y) - 8.5) / 4.0));
      } else if (y <= -12.5) {
        vertexColor.lerp(abyssalBed, Math.min(0.95, (Math.abs(y) - 12.5) / 5.0));
      }

      colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.receiveShadow = true;
    return mesh;
  }

  // --- EXPANDED WATER PLANE (320m x 320m) ---
  private createWater(): THREE.Mesh {
    const geom = new THREE.PlaneGeometry(320, 320, 64, 64);
    geom.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: '#38BDF8',
      roughness: 0.06,
      metalness: 0.2,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = 0.0;
    mesh.receiveShadow = true;
    return mesh;
  }

  // --- UNDERWATER PARTICLES ---
  private createUnderwaterParticles(): THREE.Points {
    const count = 300;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 18 + Math.random() * 40;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.2 - Math.random() * 2.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: '#A7F3D0',
      size: 0.12,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geom, mat);
  }

  // --- POPULATE ISLAND (Trees, Boulders, Smashed Rocks, Bushes, Coral Clumps) ---
  private populateIsland() {
    // 1. Coconut Palm Trees (8 Trees around island core)
    const treePositions = [
      { x: 3, z: 4 },
      { x: -5, z: 8 },
      { x: 8, z: -6 },
      { x: -8, z: -7 },
      { x: 12, z: 6 },
      { x: -14, z: 4 },
      { x: 5, z: 14 },
      { x: -4, z: -14 }
    ];

    treePositions.forEach((pos) => {
      const tree = this.createPalmTreeMesh();
      const y = this.getTerrainHeight(pos.x, pos.z);
      tree.position.set(pos.x, y, pos.z);
      this.scene.add(tree);

      this.worldObjects.palmTrees.push({
        group: tree,
        x: pos.x,
        z: pos.z,
        health: 4,
        initialY: y,
        isChopped: false
      });
    });

    // 2. Coastal Bushes (Harvestable for Palm Fiber)
    const bushPositions = [
      { x: 10, z: 12 },
      { x: -12, z: 10 },
      { x: 15, z: -8 },
      { x: -16, z: -10 },
      { x: 6, z: -15 },
      { x: -8, z: 15 },
      { x: 16, z: 2 },
      { x: -4, z: 18 },
      { x: 14, z: -14 },
      { x: -18, z: 2 }
    ];

    bushPositions.forEach((pos) => {
      const bush = this.createBushMesh();
      const y = this.getTerrainHeight(pos.x, pos.z);
      bush.position.set(pos.x, y, pos.z);
      this.scene.add(bush);

      this.worldObjects.bushes.push({
        group: bush,
        x: pos.x,
        z: pos.z,
        hasFiber: true
      });
    });

    // 3. Rocky Outcrop Boulders (NW quadrant: Smashable for Stone!)
    const boulderPositions = [
      { x: -20, z: -18, size: 2.2 },
      { x: -23, z: -14, size: 1.8 },
      { x: -17, z: -22, size: 2.4 },
      { x: -15, z: -16, size: 1.5 },
      { x: -22, z: -20, size: 2.6 },
      { x: -12, z: -18, size: 1.6 },
      { x: -25, z: -10, size: 1.9 }
    ];

    boulderPositions.forEach((bpos, idx) => {
      const bMesh = this.createRockMesh(bpos.size, true);
      const y = this.getTerrainHeight(bpos.x, bpos.z);
      bMesh.position.set(bpos.x, y, bpos.z);
      bMesh.rotation.y = Math.random() * Math.PI;
      this.scene.add(bMesh);

      this.worldObjects.groundRocks.push({
        mesh: bMesh,
        id: `boulder_${idx}`,
        x: bpos.x,
        z: bpos.z,
        size: bpos.size,
        health: 100,
        isPicked: false,
        isLargeBoulder: true
      });
    });

    // 4. Loose Smashed Stone Chunks on Beach
    const looseRockPositions = [
      { x: -12, z: -12 },
      { x: -16, z: -8 },
      { x: -10, z: -16 },
      { x: 6, z: 12 },
      { x: -14, z: 12 },
      { x: 18, z: -6 },
      { x: -2, z: -18 }
    ];

    looseRockPositions.forEach((rpos, idx) => {
      const rMesh = this.createRockMesh(0.38, false);
      const y = this.getTerrainHeight(rpos.x, rpos.z) + 0.12;
      rMesh.position.set(rpos.x, y, rpos.z);
      this.scene.add(rMesh);

      this.worldObjects.groundRocks.push({
        mesh: rMesh,
        id: `loose_rock_${idx}`,
        x: rpos.x,
        z: rpos.z,
        size: 0.38,
        health: 20,
        isPicked: false,
        isLargeBoulder: false
      });
    });

    // 5. Rich Coral Formations & Submerged Habitat in Lagoon & Reef
    const coralSpots: Array<{ x: number; z: number; type: 'staghorn' | 'brain' | 'table' | 'seagrass'; color: string }> = [
      { x: 18, z: 16, type: 'staghorn', color: '#f43f5e' },
      { x: 24, z: 18, type: 'brain', color: '#10b981' },
      { x: 14, z: 24, type: 'table', color: '#8b5cf6' },
      { x: 26, z: 10, type: 'staghorn', color: '#3b82f6' },
      { x: 22, z: 28, type: 'brain', color: '#ec4899' },
      { x: -28, z: 24, type: 'table', color: '#f97316' },
      { x: -32, z: -18, type: 'staghorn', color: '#06b6d4' },
      { x: 20, z: -32, type: 'brain', color: '#a855f7' },
      { x: -16, z: 32, type: 'staghorn', color: '#fb923c' },
      { x: -24, z: -30, type: 'table', color: '#38bdf8' },
      { x: 30, z: -15, type: 'brain', color: '#4ade80' },
      { x: 28, z: 26, type: 'staghorn', color: '#f43f5e' },
      { x: -35, z: 10, type: 'table', color: '#e879f9' },
      { x: 45, z: 35, type: 'table', color: '#06b6d4' },
      { x: -50, z: 38, type: 'staghorn', color: '#f43f5e' },
      { x: 48, z: -42, type: 'brain', color: '#a855f7' },
      { x: -46, z: -48, type: 'table', color: '#38bdf8' }
    ];

    coralSpots.forEach((c) => {
      const coralGroup = this.createCoralClump(c.color, c.type);
      const y = this.getTerrainHeight(c.x, c.z);
      coralGroup.position.set(c.x, y, c.z);
      this.scene.add(coralGroup);
    });

    // 6. SEA GRASS MEADOWS (Shallow Lagoon Flats: Radius 22..48m)
    const seaGrassPositions = [
      { x: 12, z: -26 },
      { x: -18, z: 18 },
      { x: 28, z: -12 },
      { x: -22, z: -22 },
      { x: 34, z: 16 },
      { x: -32, z: 14 },
      { x: 16, z: 32 },
      { x: -14, z: -34 },
      { x: 38, z: -28 },
      { x: -36, z: -16 },
      { x: 22, z: -38 },
      { x: -28, z: 34 }
    ];

    seaGrassPositions.forEach((pos, idx) => {
      const bed = this.createSeaGrassBedMesh(pos.x, pos.z, idx);
      this.worldObjects.seaGrassBeds.push(bed);
    });

    // 7. DEEP SEA KELP FORESTS (Open Sea & Underwater Slopes: Radius 72..108m)
    const kelpPositions = [
      { x: 65, z: 45, h: 5.5 },
      { x: 72, z: 38, h: 6.2 },
      { x: 78, z: 52, h: 5.8 },
      { x: -68, z: 42, h: 5.0 },
      { x: -75, z: 55, h: 6.5 },
      { x: -82, z: 35, h: 5.6 },
      { x: 55, z: -68, h: 6.0 },
      { x: 68, z: -75, h: 6.8 },
      { x: 74, z: -60, h: 5.4 },
      { x: -62, z: -70, h: 6.2 },
      { x: -72, z: -80, h: 7.0 },
      { x: -80, z: -65, h: 5.8 },
      { x: 92, z: 15, h: 6.4 },
      { x: -95, z: -18, h: 6.8 },
      { x: 18, z: 90, h: 6.0 },
      { x: -20, z: -94, h: 6.6 }
    ];

    kelpPositions.forEach((pos, idx) => {
      const kelp = this.createKelpStalkMesh(pos.x, pos.z, pos.h, idx);
      this.worldObjects.kelpForest.push(kelp);
    });

    // 8. SCALLOP BEDS (Lagoon Sandbars, Reef Shelves & Tide Pools)
    const scallopPositions = [
      { x: 14, z: 18 },
      { x: 22, z: 14 },
      { x: -16, z: 20 },
      { x: -22, z: 12 },
      { x: 8, z: -22 },
      { x: -12, z: -26 },
      { x: 26, z: -18 },
      { x: -24, z: -20 },
      { x: 32, z: 22 },
      { x: -30, z: 28 },
      { x: 18, z: -36 },
      { x: -28, z: -32 },
      { x: 38, z: -14 },
      { x: -18, z: -16 }
    ];

    scallopPositions.forEach((pos, idx) => {
      const scallop = this.createScallopItemMesh(pos.x, pos.z, idx);
      this.worldObjects.scallopBeds.push(scallop);
    });

    // 9. BARNACLE CLUSTERS (Rocky Outcrop Boulders, Tide Pool Rocks & Submerged Reef)
    const barnaclePositions = [
      { x: -20.8, z: -17.5, count: 4 },
      { x: -22.5, z: -13.8, count: 5 },
      { x: -17.2, z: -21.4, count: 3 },
      { x: -15.4, z: -15.6, count: 4 },
      { x: -21.6, z: -19.4, count: 5 },
      { x: -12.4, z: -17.6, count: 3 },
      { x: -24.6, z: -10.4, count: 4 },
      { x: -10.5, z: -15.2, count: 3 },
      { x: -16.8, z: -8.5, count: 4 },
      { x: 16.5, z: -8.2, count: 3 },
      { x: -8.5, z: 16.8, count: 4 },
      { x: 20.2, z: 22.4, count: 4 }
    ];

    barnaclePositions.forEach((bpos, idx) => {
      const cluster = this.createBarnacleClusterMesh(bpos.x, bpos.z, bpos.count, idx);
      this.worldObjects.barnacleClusters.push(cluster);
    });

    // 10. BEACH DETAILS (Driftwood, Shells, Tide Pool Stone Flats)
    const driftwoodPositions = [
      { x: 9, z: 16, rot: 0.8 },
      { x: -15, z: 12, rot: 2.1 },
      { x: 17, z: -10, rot: -1.2 },
      { x: -18, z: -4, rot: 0.4 },
      { x: 3, z: -18, rot: 1.6 }
    ];

    driftwoodPositions.forEach((pos) => {
      const wood = this.createDriftwoodMesh();
      const y = this.getTerrainHeight(pos.x, pos.z) + 0.1;
      wood.position.set(pos.x, y, pos.z);
      wood.rotation.y = pos.rot;
      this.scene.add(wood);
    });

    // Scattered Shoreline Clams & Conch Shells
    const shellSpots = [
      { x: 12, z: 8, color: '#fef08a' },
      { x: -10, z: 14, color: '#fed7aa' },
      { x: 16, z: -4, color: '#fed7aa' },
      { x: -14, z: -6, color: '#fef08a' },
      { x: 7, z: -16, color: '#fbcfe8' },
      { x: -8, z: 17, color: '#fed7aa' }
    ];

    shellSpots.forEach((s) => {
      const shellMesh = this.createSeaShellMesh(s.color);
      const y = this.getTerrainHeight(s.x, s.z) + 0.06;
      shellMesh.position.set(s.x, y, s.z);
      shellMesh.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(shellMesh);
    });

    // 11. EXPANDED ROCKY REEF LEDGES & TIDE POOL BOULDERS
    const reefRockFormations = [
      { x: -28, z: -24, size: 2.2 },
      { x: -32, z: -12, size: 2.8 },
      { x: -26, z: 22, size: 1.9 },
      { x: 26, z: 26, size: 2.4 },
      { x: 34, z: -18, size: 2.6 },
      { x: -14, z: -28, size: 2.1 },
      { x: 18, z: -34, size: 2.5 }
    ];

    reefRockFormations.forEach((rf, idx) => {
      const rockMesh = this.createRockMesh(rf.size, true);
      const y = this.getTerrainHeight(rf.x, rf.z);
      rockMesh.position.set(rf.x, y, rf.z);
      rockMesh.rotation.y = idx * 1.1;
      this.scene.add(rockMesh);
    });
  }

  // --- SCALLOP ITEM MESH ---
  private createScallopItemMesh(x: number, z: number, idx: number): ScallopItem {
    const group = new THREE.Group();
    const shellMat = new THREE.MeshStandardMaterial({
      color: '#fef3c7',
      roughness: 0.5,
      metalness: 0.15,
      flatShading: true,
      side: THREE.DoubleSide
    });
    const hingeMat = new THREE.MeshStandardMaterial({
      color: '#d97706',
      roughness: 0.7
    });

    // Fan-shaped lower and upper shell halves
    const shellGeom = new THREE.CylinderGeometry(0.18, 0.04, 0.26, 7, 1, false, 0, Math.PI);
    shellGeom.rotateX(Math.PI / 2);

    const bottomShell = new THREE.Mesh(shellGeom, shellMat);
    bottomShell.scale.set(1.0, 0.35, 1.0);
    bottomShell.castShadow = true;
    group.add(bottomShell);

    const topShell = new THREE.Mesh(shellGeom, shellMat);
    topShell.scale.set(0.95, 0.32, 0.95);
    topShell.position.set(0, 0.04, 0);
    topShell.rotation.x = -0.15; // slightly open
    group.add(topShell);

    // Hinge ridge
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.04), hingeMat);
    hinge.position.set(0, 0.02, -0.12);
    group.add(hinge);

    const y = this.getTerrainHeight(x, z) + 0.05;
    group.position.set(x, y, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(group);

    return {
      id: `scallop_${idx}`,
      group,
      x,
      y,
      z,
      isCollected: false,
      respawnTimer: 0
    };
  }

  // --- BARNACLE CLUSTER MESH ---
  private createBarnacleClusterMesh(x: number, z: number, count: number, idx: number): BarnacleCluster {
    const group = new THREE.Group();
    const barnacleMeshes: THREE.Mesh[] = [];

    const shellMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      roughness: 0.85,
      flatShading: true
    });
    const insideMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.9
    });

    for (let b = 0; b < count; b++) {
      const barnacleGroup = new THREE.Group();
      const h = 0.16 + Math.random() * 0.08;
      const rTop = 0.05 + Math.random() * 0.02;
      const rBottom = 0.11 + Math.random() * 0.03;

      // Outer volcano-shaped cone shell
      const coneGeom = new THREE.CylinderGeometry(rTop, rBottom, h, 6);
      coneGeom.translate(0, h / 2, 0);
      const cone = new THREE.Mesh(coneGeom, shellMat);
      cone.castShadow = true;
      barnacleGroup.add(cone);

      // Dark opening inside
      const openingGeom = new THREE.CircleGeometry(rTop * 0.85, 6);
      openingGeom.rotateX(-Math.PI / 2);
      const opening = new THREE.Mesh(openingGeom, insideMat);
      opening.position.y = h + 0.005;
      barnacleGroup.add(opening);

      const rad = b === 0 ? 0 : 0.14 + (b * 0.05);
      const ang = b === 0 ? 0 : (b / (count - 1)) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      barnacleGroup.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
      barnacleGroup.rotation.y = Math.random() * Math.PI;
      barnacleGroup.rotation.z = (Math.random() - 0.5) * 0.2;

      group.add(barnacleGroup as unknown as THREE.Mesh);
      barnacleMeshes.push(cone);
    }

    const y = this.getTerrainHeight(x, z) + 0.05;
    group.position.set(x, y, z);
    this.scene.add(group);

    return {
      id: `barnacle_${idx}`,
      group,
      x,
      y,
      z,
      count,
      initialCount: count,
      isDepleted: false,
      barnacleMeshes,
      respawnTimer: 0
    };
  }

  // --- DRIFTWOOD & SEASHELL VISUAL ASSETS ---
  private createDriftwoodMesh(): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.95,
      flatShading: true
    });

    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.2, 5), woodMat);
    branch.rotation.z = Math.PI / 2;
    branch.castShadow = true;
    group.add(branch);

    const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.8, 4), woodMat);
    twig.position.set(0.4, 0.15, 0.2);
    twig.rotation.y = 0.6;
    twig.rotation.z = 0.5;
    group.add(twig);

    return group;
  }

  private createSeaShellMesh(color: string): THREE.Mesh {
    const geom = new THREE.DodecahedronGeometry(0.12, 0);
    geom.scale(1.2, 0.45, 0.8);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      flatShading: true
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    return mesh;
  }

  // --- HARVEST SCALLOP & BARNACLE ---
  public collectScallop(scallop: ScallopItem): boolean {
    if (scallop.isCollected) return false;
    scallop.isCollected = true;
    scallop.respawnTimer = 40; // 40s respawn
    scallop.group.visible = false;
    return true;
  }

  public harvestBarnacle(cluster: BarnacleCluster): boolean {
    if (cluster.isDepleted || cluster.count <= 0) return false;
    cluster.count -= 1;

    // Shrink/hide one barnacle visual
    const targetIdx = cluster.count;
    if (cluster.group.children[targetIdx]) {
      cluster.group.children[targetIdx].visible = false;
    }

    if (cluster.count <= 0) {
      cluster.isDepleted = true;
      cluster.respawnTimer = 50; // 50s respawn for whole cluster
    }
    return true;
  }

  // --- SEA GRASS BED CREATION ---
  private createSeaGrassBedMesh(x: number, z: number, idx: number): SeaGrassBed {
    const group = new THREE.Group();
    const blades: THREE.Mesh[] = [];
    const grassMat = new THREE.MeshStandardMaterial({
      color: '#16a34a',
      roughness: 0.5,
      side: THREE.DoubleSide,
      flatShading: true
    });

    const bladeCount = 10;
    for (let i = 0; i < bladeCount; i++) {
      const bladeHeight = 0.85 + Math.random() * 0.5;
      const bladeGeom = new THREE.PlaneGeometry(0.12, bladeHeight);
      bladeGeom.translate(0, bladeHeight / 2, 0);
      const blade = new THREE.Mesh(bladeGeom, grassMat);

      const rad = Math.random() * 0.9;
      const ang = Math.random() * Math.PI * 2;
      blade.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
      blade.rotation.y = Math.random() * Math.PI;
      blade.rotation.z = (Math.random() - 0.5) * 0.25;

      group.add(blade);
      blades.push(blade);
    }

    const y = this.getTerrainHeight(x, z);
    group.position.set(x, y, z);
    this.scene.add(group);

    return {
      id: `seagrass_${idx}`,
      group,
      x,
      y,
      z,
      hasGrass: true,
      blades,
      respawnTimer: 0
    };
  }

  // --- KELP STALK CREATION ---
  private createKelpStalkMesh(x: number, z: number, stalkHeight: number, idx: number): KelpStalk {
    const group = new THREE.Group();
    const fronds: THREE.Mesh[] = [];

    const stalkMat = new THREE.MeshStandardMaterial({
      color: '#65a30d',
      roughness: 0.6,
      flatShading: true
    });
    const frondMat = new THREE.MeshStandardMaterial({
      color: '#a16207',
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    const bulbMat = new THREE.MeshStandardMaterial({
      color: '#ca8a04',
      roughness: 0.3
    });

    // Central flexible stalk
    const stalkGeom = new THREE.CylinderGeometry(0.08, 0.14, stalkHeight, 5);
    stalkGeom.translate(0, stalkHeight / 2, 0);
    const stalkMesh = new THREE.Mesh(stalkGeom, stalkMat);
    group.add(stalkMesh);

    // Fronds along the stalk
    const frondPairs = Math.floor(stalkHeight / 0.8);
    for (let f = 1; f <= frondPairs; f++) {
      const yOffset = f * 0.75;
      const angle = (f * 1.6);

      // Gas float bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), bulbMat);
      bulb.position.set(Math.cos(angle) * 0.18, yOffset, Math.sin(angle) * 0.18);
      group.add(bulb);

      // Ribbon leaf frond
      const frondGeom = new THREE.PlaneGeometry(0.32, 1.4 + Math.random() * 0.4);
      frondGeom.translate(0, 0.7, 0);
      const frond = new THREE.Mesh(frondGeom, frondMat);
      frond.position.set(Math.cos(angle) * 0.28, yOffset, Math.sin(angle) * 0.28);
      frond.rotation.y = angle;
      frond.rotation.x = 0.4 + Math.random() * 0.3;
      frond.castShadow = true;
      group.add(frond);
      fronds.push(frond);
    }

    const y = this.getTerrainHeight(x, z);
    group.position.set(x, y, z);
    this.scene.add(group);

    return {
      id: `kelp_${idx}`,
      group,
      x,
      y,
      z,
      height: stalkHeight,
      hasKelp: true,
      fronds,
      respawnTimer: 0
    };
  }

  // --- HARVEST AQUATIC PLANTS ---
  public harvestSeaGrassBed(bed: SeaGrassBed): boolean {
    if (!bed.hasGrass) return false;
    bed.hasGrass = false;
    bed.respawnTimer = 45; // Respawns after 45s
    bed.group.scale.set(0.2, 0.2, 0.2);
    return true;
  }

  public harvestKelpStalk(stalk: KelpStalk): boolean {
    if (!stalk.hasKelp) return false;
    stalk.hasKelp = false;
    stalk.respawnTimer = 60; // Respawns after 60s
    stalk.group.scale.set(0.3, 0.3, 0.3);
    return true;
  }

  // --- CHUM SCENT CLOUD SYSTEM ---
  public createChumScentCloud(x: number, y: number, z: number, durationSec: number = 25): ChumScentCloud {
    const group = new THREE.Group();
    const count = 90;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.8;
      positions[i * 3] = Math.cos(ang) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.2;
      positions[i * 3 + 2] = Math.sin(ang) * r;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: '#f87171',
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geom, mat);
    group.add(particles);

    const safeY = Math.min(-0.25, Math.max(this.getTerrainHeight(x, z) + 0.3, y));
    group.position.set(x, safeY, z);
    this.scene.add(group);

    const cloud: ChumScentCloud = {
      id: `chum_${Date.now()}_${Math.random()}`,
      group,
      x,
      y: safeY,
      z,
      particles,
      life: durationSec,
      maxLife: durationSec
    };

    this.worldObjects.chumClouds.push(cloud);
    return cloud;
  }

  // --- 3D MESH GENERATORS ---
  public createPalmTreeMesh(): THREE.Group {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({
      color: '#78350f',
      roughness: 0.9,
      flatShading: true
    });
    const frondMat = new THREE.MeshStandardMaterial({
      color: '#16a34a',
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    const coconutMat = new THREE.MeshStandardMaterial({
      color: '#713f12',
      roughness: 0.8
    });

    // Segmented curved trunk
    const numSegments = 7;
    let currY = 0;
    let currX = 0;
    const curveAmount = (Math.random() - 0.5) * 0.25;

    for (let s = 0; s < numSegments; s++) {
      const segHeight = 0.85;
      const rTop = 0.22 - s * 0.015;
      const rBottom = 0.28 - s * 0.015;
      const segGeom = new THREE.CylinderGeometry(rTop, rBottom, segHeight, 6);
      const seg = new THREE.Mesh(segGeom, trunkMat);
      seg.position.set(currX, currY + segHeight / 2, 0);
      seg.rotation.z = curveAmount * s * 0.12;
      seg.castShadow = true;
      seg.receiveShadow = true;
      group.add(seg);

      currY += segHeight;
      currX += Math.sin(seg.rotation.z) * segHeight;
    }

    // Palm fronds
    const numFronds = 8;
    for (let f = 0; f < numFronds; f++) {
      const angle = (f / numFronds) * Math.PI * 2;
      const frondGeom = new THREE.ConeGeometry(0.7, 3.4, 4);
      frondGeom.rotateX(Math.PI / 2);
      const frond = new THREE.Mesh(frondGeom, frondMat);
      frond.position.set(currX, currY, 0);
      frond.rotation.y = angle;
      frond.rotation.x = 0.55 + Math.random() * 0.15;
      frond.castShadow = true;
      group.add(frond);
    }

    // Coconuts in crown
    for (let c = 0; c < 3; c++) {
      const coco = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), coconutMat);
      const cAngle = (c / 3) * Math.PI * 2;
      coco.position.set(currX + Math.cos(cAngle) * 0.3, currY - 0.15, Math.sin(cAngle) * 0.3);
      coco.castShadow = true;
      group.add(coco);
    }

    return group;
  }

  public createBushMesh(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: '#15803d',
      roughness: 0.8,
      flatShading: true
    });

    const puffs = 4;
    for (let i = 0; i < puffs; i++) {
      const geom = new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.2, 1);
      const puff = new THREE.Mesh(geom, mat);
      puff.position.set(
        (Math.random() - 0.5) * 0.6,
        0.3 + Math.random() * 0.4,
        (Math.random() - 0.5) * 0.6
      );
      puff.castShadow = true;
      puff.receiveShadow = true;
      group.add(puff);
    }
    return group;
  }

  public createRockMesh(size: number, isBoulder: boolean = false): THREE.Mesh {
    const geom = new THREE.DodecahedronGeometry(size, 1);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) * (0.88 + Math.random() * 0.24);
      const y = pos.getY(i) * (0.82 + Math.random() * 0.3);
      const z = pos.getZ(i) * (0.88 + Math.random() * 0.24);
      pos.setXYZ(i, x, y, z);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: isBoulder ? '#576574' : '#71717a',
      roughness: 0.92,
      flatShading: true
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createCoralClump(color: string, type: 'staghorn' | 'brain' | 'table' | 'seagrass' = 'staghorn'): THREE.Group {
    const group = new THREE.Group();
    const coralMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      flatShading: true
    });

    if (type === 'brain') {
      // Brain coral rounded dome with ridges
      const domeGeom = new THREE.DodecahedronGeometry(0.8, 1);
      const dome = new THREE.Mesh(domeGeom, coralMat);
      dome.scale.set(1.1, 0.7, 1.1);
      dome.position.y = 0.45;
      dome.castShadow = true;
      group.add(dome);
    } else if (type === 'table') {
      // Table coral horizontal tiered plates
      const baseGeom = new THREE.CylinderGeometry(0.18, 0.3, 0.6, 5);
      const base = new THREE.Mesh(baseGeom, coralMat);
      base.position.y = 0.3;
      group.add(base);

      for (let p = 0; p < 2; p++) {
        const plateGeom = new THREE.CylinderGeometry(0.8 - p * 0.2, 0.9 - p * 0.2, 0.08, 7);
        const plate = new THREE.Mesh(plateGeom, coralMat);
        plate.position.set((p === 1 ? 0.2 : 0), 0.55 + p * 0.3, (p === 1 ? -0.15 : 0));
        plate.rotation.z = (Math.random() - 0.5) * 0.15;
        plate.castShadow = true;
        group.add(plate);
      }
    } else if (type === 'seagrass') {
      const grassMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, side: THREE.DoubleSide });
      for (let s = 0; s < 6; s++) {
        const bladeGeom = new THREE.PlaneGeometry(0.12, 0.9 + Math.random() * 0.4);
        const blade = new THREE.Mesh(bladeGeom, grassMat);
        blade.position.set((Math.random() - 0.5) * 0.5, 0.45, (Math.random() - 0.5) * 0.5);
        blade.rotation.y = Math.random() * Math.PI;
        blade.rotation.x = (Math.random() - 0.5) * 0.3;
        group.add(blade);
      }
    } else {
      // Staghorn branching coral
      for (let i = 0; i < 6; i++) {
        const branchGeom = new THREE.CylinderGeometry(0.05, 0.12, 0.8 + Math.random() * 0.6, 5);
        const branch = new THREE.Mesh(branchGeom, coralMat);
        branch.position.set((Math.random() - 0.5) * 0.8, 0.4, (Math.random() - 0.5) * 0.8);
        branch.rotation.z = (Math.random() - 0.5) * 0.5;
        branch.rotation.x = (Math.random() - 0.5) * 0.5;
        branch.castShadow = true;
        group.add(branch);
      }
    }

    return group;
  }

  private createSkyElements() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.2,
      flatShading: true
    });

    for (let c = 0; c < 6; c++) {
      const cloudGroup = new THREE.Group();
      const angle = (c / 6) * Math.PI * 2;
      const radius = 65 + Math.random() * 25;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 28 + Math.random() * 8;

      for (let p = 0; p < 4; p++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5 + Math.random() * 2.5, 1), cloudMat);
        puff.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6);
        cloudGroup.add(puff);
      }
      cloudGroup.position.set(x, y, z);
      this.scene.add(cloudGroup);
    }
  }

  // --- GROUND ITEMS SPAWN ---
  public spawnGroundItem(
    type: ToolType,
    x: number,
    z: number,
    burst: boolean = false
  ) {
    const group = new THREE.Group();
    let mesh: THREE.Mesh;

    if (type === 'wood') {
      const geom = new THREE.CylinderGeometry(0.14, 0.14, 0.9, 6);
      geom.rotateZ(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.85, flatShading: true });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'stone') {
      const geom = new THREE.DodecahedronGeometry(0.2, 1);
      const mat = new THREE.MeshStandardMaterial({ color: '#71717a', roughness: 0.9, flatShading: true });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'rock') {
      const geom = new THREE.DodecahedronGeometry(0.26, 1);
      const mat = new THREE.MeshStandardMaterial({ color: '#576574', roughness: 0.9, flatShading: true });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'seed') {
      const geom = new THREE.SphereGeometry(0.2, 6, 6);
      const mat = new THREE.MeshStandardMaterial({ color: '#713f12', roughness: 0.7 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'palm_shell') {
      const geom = new THREE.SphereGeometry(0.22, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const mat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8, side: THREE.DoubleSide });
      mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = Math.PI;
    } else if (type === 'crab') {
      const geom = new THREE.SphereGeometry(0.18, 6, 5);
      const mat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.6 });
      mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(1.3, 0.6, 1.0);
    } else if (type === 'fruit') {
      const geom = new THREE.SphereGeometry(0.2, 7, 7);
      const mat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.7 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'fish_trap') {
      const geom = new THREE.CylinderGeometry(0.22, 0.25, 0.35, 6, 1, true);
      const mat = new THREE.MeshStandardMaterial({ color: '#92400e', wireframe: true });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'wood_structure') {
      const geom = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const mat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'rope') {
      const geom = new THREE.TorusGeometry(0.2, 0.07, 6, 10);
      const mat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.9 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'spear') {
      const geom = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 5);
      geom.rotateZ(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.8 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'fish') {
      // Sleek caught fish item
      const geom = new THREE.ConeGeometry(0.12, 0.65, 6);
      geom.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({ color: '#38bdf8', metalness: 0.4, roughness: 0.3 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'chum') {
      // Chum bait container
      const geom = new THREE.DodecahedronGeometry(0.18, 1);
      const mat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.6 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'sea_grass') {
      // Sea grass harvest clump
      const geom = new THREE.TorusGeometry(0.16, 0.05, 4, 8);
      const mat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.7 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'kelp') {
      // Golden amber kelp frond bundle
      const geom = new THREE.CylinderGeometry(0.08, 0.12, 0.7, 5);
      const mat = new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.6 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'scallop') {
      // Scallop shell item
      const geom = new THREE.CylinderGeometry(0.16, 0.04, 0.22, 6, 1, false, 0, Math.PI);
      geom.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'barnacle') {
      // Barnacle cluster chunk
      const geom = new THREE.CylinderGeometry(0.06, 0.12, 0.18, 6);
      const mat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.85, flatShading: true });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'fish_meat') {
      // Fresh fish fillet/meat chunk
      const geom = new THREE.BoxGeometry(0.24, 0.08, 0.18);
      const mat = new THREE.MeshStandardMaterial({ color: '#f87171', roughness: 0.6, metalness: 0.1 });
      mesh = new THREE.Mesh(geom, mat);
    } else if (type === 'live_fish_shell') {
      // Palm shell with water
      const geom = new THREE.SphereGeometry(0.22, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const mat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8, side: THREE.DoubleSide });
      mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = Math.PI;
    } else {
      // Fiber
      const geom = new THREE.TorusGeometry(0.18, 0.06, 4, 8);
      const mat = new THREE.MeshStandardMaterial({ color: '#84cc16', roughness: 0.8 });
      mesh = new THREE.Mesh(geom, mat);
    }

    mesh.castShadow = true;
    group.add(mesh);

    const terrainY = this.getTerrainHeight(x, z);
    const buoyant = isItemBuoyant(type);
    
    let startY = terrainY + 0.12;
    if (buoyant) {
      startY = Math.max(0.04, terrainY + 0.12);
    }
    if (burst) {
      startY += 1.0;
    }
    
    group.position.set(x, startY, z);
    this.scene.add(group);

    const vx = burst ? (Math.random() - 0.5) * 3.5 : 0;
    const vy = burst ? 2.8 + Math.random() * 1.5 : (buoyant ? 0 : -0.5);
    const vz = burst ? (Math.random() - 0.5) * 3.5 : 0;

    const id = `item_${Date.now()}_${Math.random()}`;
    this.worldObjects.groundItems.push({
      group,
      id,
      type,
      x,
      y: startY,
      z,
      vx,
      vy,
      vz
    });
  }

  // --- ROCK HIT SPARKS & CRACKS ---
  public createRockHitSparks(x: number, y: number, z: number) {
    const sparkGroup = new THREE.Group();
    sparkGroup.position.set(x, y, z);

    const particles: THREE.Mesh[] = [];
    const velocities: THREE.Vector3[] = [];
    const sparkMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      roughness: 0.2,
      emissive: '#f59e0b',
      emissiveIntensity: 0.8
    });

    const count = 6;
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.04, 0), sparkMat);
      sparkGroup.add(p);
      particles.push(p);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.0;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * speed,
        1.5 + Math.random() * 2.0,
        Math.sin(angle) * speed
      ));
    }

    this.scene.add(sparkGroup);
    this.worldObjects.rockSparks.push({
      group: sparkGroup,
      particles,
      velocities,
      life: 0.4
    });
  }

  // --- PROJECTILES (Thrown Spear / Thrown Rock) ---
  public spawnThrownSpear(origin: THREE.Vector3, velocity: THREE.Vector3): ThrownProjectile {
    const group = new THREE.Group();
    const shaftMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
    const tipMat = new THREE.MeshStandardMaterial({ color: '#71717a', roughness: 0.9 });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.4, 6), shaftMat);
    shaft.rotation.x = Math.PI / 2;
    group.add(shaft);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.25, 4), tipMat);
    tip.position.z = -0.75;
    tip.rotation.x = -Math.PI / 2;
    group.add(tip);

    group.position.copy(origin);
    this.scene.add(group);

    const proj: ThrownProjectile = {
      id: `spear_proj_${Date.now()}`,
      type: 'spear',
      group,
      x: origin.x,
      y: origin.y,
      z: origin.z,
      vx: velocity.x,
      vy: velocity.y,
      vz: velocity.z,
      lifeTime: 0,
      hasSplashedWater: false,
      hasHitGround: false
    };

    this.worldObjects.projectiles.push(proj);
    return proj;
  }

  public spawnThrownRock(origin: THREE.Vector3, velocity: THREE.Vector3): ThrownProjectile {
    const group = new THREE.Group();
    const rockMesh = this.createRockMesh(0.26);
    group.add(rockMesh);
    group.position.copy(origin);
    this.scene.add(group);

    const proj: ThrownProjectile = {
      id: `rock_proj_${Date.now()}`,
      type: 'rock',
      group,
      x: origin.x,
      y: origin.y,
      z: origin.z,
      vx: velocity.x,
      vy: velocity.y,
      vz: velocity.z,
      lifeTime: 0,
      hasSplashedWater: false,
      hasHitGround: false
    };

    this.worldObjects.projectiles.push(proj);
    return proj;
  }

  // --- WATER SPLASH PARTICLES ---
  public createSplashEffect(x: number, z: number) {
    const splashGroup = new THREE.Group();
    splashGroup.position.set(x, 0.05, z);

    const particles: THREE.Mesh[] = [];
    const velocities: THREE.Vector3[] = [];
    const splashMat = new THREE.MeshStandardMaterial({
      color: '#E0F7FA',
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    const numDrops = 8;
    for (let i = 0; i < numDrops; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 5, 5), splashMat);
      splashGroup.add(drop);
      particles.push(drop);

      const angle = (i / numDrops) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 1.2 + Math.random() * 1.5;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * speed,
        2.0 + Math.random() * 1.5,
        Math.sin(angle) * speed
      ));
    }

    this.scene.add(splashGroup);
    this.worldObjects.waterSplashes.push({
      group: splashGroup,
      particles,
      velocities,
      life: 0.6
    });
  }

  // --- RAFT SYSTEM (Placement, Sail Upgrade, Expansion & Water Floating) ---
  public placeRaft(x: number, z: number, hasSail: boolean = false, isExpanded: boolean = false): PlacedRaft {
    const group = new THREE.Group();
    const logMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9, flatShading: true });
    const ropeMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.8 });
    const plankMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.85 });

    // Main raft deck logs (5 parallel tied logs)
    const numLogs = 5;
    for (let l = 0; l < numLogs; l++) {
      const logGeom = new THREE.CylinderGeometry(0.18, 0.18, 2.6, 6);
      logGeom.rotateX(Math.PI / 2);
      const log = new THREE.Mesh(logGeom, logMat);
      log.position.set((l - 2) * 0.38, 0, 0);
      log.castShadow = true;
      group.add(log);
    }

    // Cross-tie bindings
    for (let c = -1; c <= 1; c += 2) {
      const crossGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 5);
      crossGeom.rotateZ(Math.PI / 2);
      const cross = new THREE.Mesh(crossGeom, logMat);
      cross.position.set(0, 0.15, c * 0.8);
      group.add(cross);

      // Rope bindings
      for (let r = 0; r < numLogs; r++) {
        const rope = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 4, 8), ropeMat);
        rope.position.set((r - 2) * 0.38, 0.14, c * 0.8);
        rope.rotation.x = Math.PI / 2;
        group.add(rope);
      }
    }

    // Wooden deck slats
    for (let s = -4; s <= 4; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.18), plankMat);
      slat.position.set(0, 0.18, s * 0.25);
      slat.receiveShadow = true;
      group.add(slat);
    }

    let sailMesh: THREE.Mesh | null = null;
    let expansionGroup: THREE.Group | null = null;

    if (hasSail) {
      sailMesh = this.attachRaftSailMesh(group);
    }

    if (isExpanded) {
      expansionGroup = this.attachRaftExpansionMesh(group);
    }

    group.position.set(x, 0.06, z);
    this.scene.add(group);

    const raftData: PlacedRaft = {
      id: `raft_${Date.now()}`,
      group,
      sailMesh,
      expansionGroup,
      x,
      y: 0.06,
      z,
      rotY: 0,
      hasSail,
      isExpanded,
      speed: 0,
      turnSpeed: 0
    };

    this.worldObjects.placedRafts.push(raftData);
    return raftData;
  }

  private attachRaftSailMesh(raftGroup: THREE.Group): THREE.Mesh {
    const mastMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
    const sailMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.6, side: THREE.DoubleSide });

    // Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.8, 6), mastMat);
    mast.position.set(0, 1.4, 0.4);
    mast.castShadow = true;
    raftGroup.add(mast);

    // Boom / Yard
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), mastMat);
    boom.rotation.z = Math.PI / 2;
    boom.position.set(0, 2.5, 0.4);
    raftGroup.add(boom);

    // Woven Palm Canvas Sail
    const sailGeom = new THREE.PlaneGeometry(1.6, 1.8, 6, 6);
    const sail = new THREE.Mesh(sailGeom, sailMat);
    sail.position.set(0, 1.6, 0.4);
    sail.castShadow = true;
    raftGroup.add(sail);

    return sail;
  }

  private attachRaftExpansionMesh(raftGroup: THREE.Group): THREE.Group {
    const expGroup = new THREE.Group();
    const logMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const plankMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.85 });

    // Outer outrigger logs on left and right
    for (let side = -1; side <= 1; side += 2) {
      const outLog = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 6), logMat);
      outLog.rotateX(Math.PI / 2);
      outLog.position.set(side * 1.4, 0, 0);
      expGroup.add(outLog);

      // Deck extensions
      for (let s = -4; s <= 4; s++) {
        const extPlank = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.18), plankMat);
        extPlank.position.set(side * 1.1, 0.18, s * 0.25);
        expGroup.add(extPlank);
      }
    }

    raftGroup.add(expGroup);
    return expGroup;
  }

  public upgradeRaftSail(raft: PlacedRaft): boolean {
    if (raft.hasSail) return false;
    raft.hasSail = true;
    raft.sailMesh = this.attachRaftSailMesh(raft.group);
    return true;
  }

  public upgradeRaftExpansion(raft: PlacedRaft): boolean {
    if (raft.isExpanded) return false;
    raft.isExpanded = true;
    raft.expansionGroup = this.attachRaftExpansionMesh(raft.group);
    return true;
  }

  // --- CRAFTING TABLE STATION SYSTEM ---
  public placeCraftingTable(x: number, z: number, rotY: number = 0): PlacedCraftingTable {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85, flatShading: true });
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#71717a', roughness: 0.9, flatShading: true });
    const ropeMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.9 });

    // Tabletop heavy slab
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.9), woodMat);
    top.position.y = 0.85;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Stone anvil slab on top
    const stoneAnvil = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.4), stoneMat);
    stoneAnvil.position.set(0.3, 0.98, 0);
    stoneAnvil.castShadow = true;
    group.add(stoneAnvil);

    // 4 Sturdy Log Legs
    for (let lx = -1; lx <= 1; lx += 2) {
      for (let lz = -1; lz <= 1; lz += 2) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.85, 6), woodMat);
        leg.position.set(lx * 0.65, 0.425, lz * 0.35);
        leg.castShadow = true;
        group.add(leg);

        // Rope lashings on joints
        const jointRope = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 4, 8), ropeMat);
        jointRope.position.set(lx * 0.65, 0.78, lz * 0.35);
        jointRope.rotation.x = Math.PI / 2;
        group.add(jointRope);
      }
    }

    // Cross braces
    const braceX = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), woodMat);
    braceX.position.set(0, 0.3, 0);
    group.add(braceX);

    const y = Math.max(0.1, this.getTerrainHeight(x, z));
    group.position.set(x, y, z);
    group.rotation.y = rotY;
    this.scene.add(group);

    const tableData: PlacedCraftingTable = {
      id: `table_${Date.now()}`,
      group,
      x,
      y,
      z,
      rotY
    };

    this.worldObjects.placedCraftingTables.push(tableData);
    return tableData;
  }

  // --- STRUCTURES ---
  public createStructureMesh(type: StructureType, isGhost: boolean = false): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: '#78350f',
      roughness: 0.85,
      transparent: isGhost,
      opacity: isGhost ? 0.55 : 1.0
    });

    if (type === 'foundation') {
      const geom = new THREE.BoxGeometry(3.2, 0.3, 3.2);
      const mesh = new THREE.Mesh(geom, woodMat);
      mesh.position.y = 0.15;
      mesh.castShadow = !isGhost;
      mesh.receiveShadow = !isGhost;
      group.add(mesh);
    } else if (type === 'wall') {
      const geom = new THREE.BoxGeometry(3.2, 2.4, 0.2);
      const mesh = new THREE.Mesh(geom, woodMat);
      mesh.position.y = 1.2;
      mesh.castShadow = !isGhost;
      mesh.receiveShadow = !isGhost;
      group.add(mesh);
    } else if (type === 'roof') {
      const geom = new THREE.ConeGeometry(2.5, 1.2, 4);
      geom.rotateY(Math.PI / 4);
      const mesh = new THREE.Mesh(geom, woodMat);
      mesh.position.y = 0.6;
      mesh.castShadow = !isGhost;
      group.add(mesh);
    } else {
      // Pillar
      const geom = new THREE.CylinderGeometry(0.18, 0.22, 2.4, 6);
      const mesh = new THREE.Mesh(geom, woodMat);
      mesh.position.y = 1.2;
      mesh.castShadow = !isGhost;
      group.add(mesh);
    }

    return group;
  }

  public placeStructure(type: StructureType, x: number, y: number, z: number, rotY: number): PlacedStructure {
    const group = this.createStructureMesh(type, false);
    group.position.set(x, y, z);
    group.rotation.y = rotY;
    this.scene.add(group);

    const struct: PlacedStructure = {
      id: `struct_${Date.now()}`,
      type,
      group,
      x,
      y,
      z,
      rotY
    };
    this.worldObjects.structures.push(struct);
    return struct;
  }

  public updateGhostStructure(type: StructureType, x: number, y: number, z: number, rotY: number) {
    while (this.ghostGroup.children.length > 0) {
      this.ghostGroup.remove(this.ghostGroup.children[0]);
    }
    const ghost = this.createStructureMesh(type, true);
    this.ghostGroup.add(ghost);
    this.ghostGroup.position.set(x, y, z);
    this.ghostGroup.rotation.y = rotY;
    this.ghostGroup.visible = true;
  }

  public hideGhostStructure() {
    this.ghostGroup.visible = false;
  }

  public plantSeed(x: number, z: number): PlantedTree | null {
    const y = this.getTerrainHeight(x, z);
    if (y < 0.1) return null; // Can't plant underwater in lagoon

    const group = new THREE.Group();
    const stemGeom = new THREE.CylinderGeometry(0.04, 0.06, 0.4, 5);
    const stemMat = new THREE.MeshStandardMaterial({ color: '#65a30d', roughness: 0.8 });
    const stem = new THREE.Mesh(stemGeom, stemMat);
    stem.position.y = 0.2;
    group.add(stem);

    const leafMat = new THREE.MeshStandardMaterial({ color: '#22c55e', side: THREE.DoubleSide });
    for (let l = 0; l < 2; l++) {
      const leafGeom = new THREE.ConeGeometry(0.15, 0.4, 3);
      leafGeom.rotateZ(l === 0 ? 0.7 : -0.7);
      const leaf = new THREE.Mesh(leafGeom, leafMat);
      leaf.position.set(l === 0 ? 0.12 : -0.12, 0.35, 0);
      group.add(leaf);
    }

    group.position.set(x, y, z);
    this.scene.add(group);

    const treeData: PlantedTree = {
      id: `planted_${Date.now()}`,
      x,
      z,
      plantedAt: Date.now(),
      stage: 0,
      health: 100
    };

    this.worldObjects.plantedTrees.push({
      ...treeData,
      group
    });

    return treeData;
  }

  public placeFishTrap(x: number, z: number): PlacedTrap {
    const y = Math.min(-0.25, this.getTerrainHeight(x, z) + 0.25);
    const group = new THREE.Group();

    // Wicker cylindrical cage with entrance funnel
    const trapGeom = new THREE.CylinderGeometry(0.42, 0.48, 0.65, 8, 1, true);
    const trapMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.9, wireframe: true });
    const trapMesh = new THREE.Mesh(trapGeom, trapMat);
    group.add(trapMesh);

    // Inner group for visual bait and caught mini fish
    const fishMeshGroup = new THREE.Group();
    group.add(fishMeshGroup);

    // Floating buoy marker connected with rope
    const buoyGeom = new THREE.SphereGeometry(0.18, 8, 8);
    const buoyMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3 });
    const buoyMesh = new THREE.Mesh(buoyGeom, buoyMat);
    buoyMesh.position.y = 0.1 - y; // float at surface
    group.add(buoyMesh);

    // Rope
    const ropeGeom = new THREE.CylinderGeometry(0.02, 0.02, Math.abs(y) + 0.1, 4);
    const ropeMat = new THREE.MeshStandardMaterial({ color: '#d97706' });
    const rope = new THREE.Mesh(ropeGeom, ropeMat);
    rope.position.y = (buoyMesh.position.y) / 2;
    group.add(rope);

    group.position.set(x, y, z);
    this.scene.add(group);

    const trapData: PlacedTrap = {
      id: `trap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      group,
      fishMeshGroup,
      x,
      y,
      z,
      placedAt: Date.now(),
      bait: null,
      caughtFish: [],
      maxCapacity: 5
    };

    this.worldObjects.placedTraps.push(trapData);
    return trapData;
  }

  public updateTrapVisuals(trap: PlacedTrap) {
    if (!trap.fishMeshGroup) return;
    while (trap.fishMeshGroup.children.length > 0) {
      trap.fishMeshGroup.remove(trap.fishMeshGroup.children[0]);
    }

    // 1. If baited, add a small bait visual in the center
    if (trap.bait === 'crab') {
      const crabBait = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 6, 5),
        new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.6 })
      );
      crabBait.scale.set(1.2, 0.6, 1.0);
      crabBait.position.set(0, -0.1, 0);
      trap.fishMeshGroup.add(crabBait);
    } else if (trap.bait === 'fruit') {
      const fruitBait = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 7, 7),
        new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.7 })
      );
      fruitBait.position.set(0, -0.1, 0);
      trap.fishMeshGroup.add(fruitBait);
    } else if (trap.bait === 'scallop') {
      const scallopBait = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.03, 0.15, 6, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.5, side: THREE.DoubleSide })
      );
      scallopBait.position.set(0, -0.1, 0);
      trap.fishMeshGroup.add(scallopBait);
    } else if (trap.bait === 'barnacle') {
      const barnacleBait = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.08, 0.12, 5),
        new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.85 })
      );
      barnacleBait.position.set(0, -0.1, 0);
      trap.fishMeshGroup.add(barnacleBait);
    } else if (trap.bait === 'sea_grass' || trap.bait === 'kelp') {
      const plantBait = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.03, 4, 6),
        new THREE.MeshStandardMaterial({ color: trap.bait === 'kelp' ? '#a16207' : '#16a34a', roughness: 0.7 })
      );
      plantBait.position.set(0, -0.1, 0);
      trap.fishMeshGroup.add(plantBait);
    } else if (trap.bait === 'fish') {
      const fishBait = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.22, 4),
        new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.4 })
      );
      fishBait.position.set(0, -0.1, 0);
      trap.fishMeshGroup.add(fishBait);
    }

    // 2. Add visual mini fish inside for each trapped fish (up to 5)
    trap.caughtFish.forEach((fish, idx) => {
      const miniFishGeom = new THREE.ConeGeometry(0.07, 0.28, 4);
      miniFishGeom.rotateX(Math.PI / 2);
      const miniFishMat = new THREE.MeshStandardMaterial({
        color: idx % 2 === 0 ? '#38bdf8' : '#f59e0b',
        roughness: 0.4
      });
      const miniFish = new THREE.Mesh(miniFishGeom, miniFishMat);
      const angle = (idx / 5) * Math.PI * 2;
      miniFish.position.set(Math.cos(angle) * 0.2, (idx * 0.08) - 0.16, Math.sin(angle) * 0.2);
      miniFish.rotation.y = angle + Math.PI / 2;
      trap.fishMeshGroup.add(miniFish);
    });
  }

  // --- PHYSICAL FALLEN LOG CREATION ---
  public spawnFallenLog(x: number, z: number, rotationY: number = 0): FallenLog {
    const group = new THREE.Group();
    const barkMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9, flatShading: true });
    const innerWoodMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.8 });
    const frondMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.85, side: THREE.DoubleSide });

    // Main horizontal log
    const logGeom = new THREE.CylinderGeometry(0.32, 0.38, 4.8, 7);
    logGeom.rotateZ(Math.PI / 2);
    const logMesh = new THREE.Mesh(logGeom, barkMat);
    logMesh.castShadow = true;
    logMesh.receiveShadow = true;
    group.add(logMesh);

    // Cut stump base
    const stumpBaseGeom = new THREE.CylinderGeometry(0.39, 0.44, 0.5, 7);
    const stumpBase = new THREE.Mesh(stumpBaseGeom, barkMat);
    stumpBase.position.set(-2.4, 0.15, 0);
    stumpBase.castShadow = true;
    group.add(stumpBase);

    // Exposed wood ring at cut end
    const cutEndGeom = new THREE.CircleGeometry(0.37, 7);
    cutEndGeom.rotateY(-Math.PI / 2);
    const cutEnd = new THREE.Mesh(cutEndGeom, innerWoodMat);
    cutEnd.position.set(-2.41, 0.15, 0);
    group.add(cutEnd);

    // Fallen fronds lying scattered on ground at top end
    for (let f = 0; f < 5; f++) {
      const frondGeom = new THREE.ConeGeometry(0.6, 2.8, 3);
      frondGeom.rotateX(Math.PI / 2);
      const frond = new THREE.Mesh(frondGeom, frondMat);
      frond.position.set(2.2 + Math.cos(f) * 0.4, 0.05, Math.sin(f) * 0.7);
      frond.rotation.y = f * 0.8 + 0.4;
      frond.rotation.x = 0.1;
      frond.castShadow = true;
      group.add(frond);
    }

    const y = this.getTerrainHeight(x, z) + 0.25;
    group.position.set(x, y, z);
    group.rotation.y = rotationY;
    this.scene.add(group);

    const logData: FallenLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      group,
      x,
      y,
      z,
      woodRemaining: 2
    };

    this.worldObjects.fallenLogs.push(logData);
    return logData;
  }

  // --- DROPPED LOOT CONTAINERS (Non-Horror Supply Recovery) ---
  public spawnDroppedLootContainer(
    x: number,
    y: number,
    z: number,
    items: Record<string, number>,
    saveState: boolean = true
  ): DroppedLootContainer {
    const group = new THREE.Group();
    const terrainY = this.getTerrainHeight(x, z);
    const groundY = terrainY + 0.24;
    const isSubmerged = groundY < 0.0;

    // Actual placement Y: on the seabed or ground
    const bagY = isSubmerged ? groundY : y;

    // 1. Sturdy Explorer Knapsack Mesh
    const packMat = new THREE.MeshStandardMaterial({ color: '#4a3728', roughness: 0.8 });
    const flapMat = new THREE.MeshStandardMaterial({ color: '#322316', roughness: 0.7 });
    const strapMat = new THREE.MeshStandardMaterial({ color: '#d35400', roughness: 0.5 });
    const bedrollMat = new THREE.MeshStandardMaterial({ color: '#27ae60', roughness: 0.9 });

    // Main pack pouch
    const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.48, 0.4), packMat);
    packBody.castShadow = true;
    group.add(packBody);

    // Front pocket & top flap
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.67, 0.16, 0.42), flapMat);
    flap.position.y = 0.22;
    group.add(flap);

    // Leather Straps
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.42), strapMat);
    strapL.position.x = -0.18;
    group.add(strapL);
    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.42), strapMat);
    strapR.position.x = 0.18;
    group.add(strapR);

    // Bedroll tied to top
    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.68, 8), bedrollMat);
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.y = 0.34;
    group.add(bedroll);

    // Beacon glow light orb (Warm teal pulse beacon)
    const beaconMat = new THREE.MeshStandardMaterial({
      color: '#55EFC4',
      emissive: '#00B894',
      emissiveIntensity: 1.2,
      roughness: 0.2
    });
    const beaconOrb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), beaconMat);
    beaconOrb.position.y = 0.58;
    group.add(beaconOrb);

    let markerBuoy: THREE.Group | undefined;

    // 2. If underwater, add a floating marine marker buoy connected by a tether
    if (isSubmerged) {
      markerBuoy = new THREE.Group();
      markerBuoy.position.set(0, -bagY + 0.12, 0); // Position at water surface (y = 0.12)

      // Orange and white striped buoy float
      const buoyMatOrange = new THREE.MeshStandardMaterial({ color: '#e67e22', roughness: 0.4 });
      const buoyMatWhite = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
      const buoyTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 12), buoyMatOrange);
      const buoyBot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 12), buoyMatWhite);
      buoyBot.position.y = -0.22;
      markerBuoy.add(buoyTop);
      markerBuoy.add(buoyBot);

      // Flag mast
      const mastMat = new THREE.MeshStandardMaterial({ color: '#2d3436' });
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), mastMat);
      mast.position.y = 0.32;
      markerBuoy.add(mast);

      // Fluorescent rescue flag
      const flagMat = new THREE.MeshBasicMaterial({ color: '#ff7675' });
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.02), flagMat);
      flag.position.set(0.15, 0.5, 0);
      markerBuoy.add(flag);

      // Mooring rope from seabed pack to surface float
      const ropeHeight = Math.max(0.5, -bagY);
      const ropeGeom = new THREE.CylinderGeometry(0.015, 0.015, ropeHeight, 4);
      const ropeMat = new THREE.MeshBasicMaterial({ color: '#dfe6e9' });
      const rope = new THREE.Mesh(ropeGeom, ropeMat);
      rope.position.y = ropeHeight / 2;
      group.add(rope);

      group.add(markerBuoy);
    }

    group.position.set(x, bagY, z);
    this.scene.add(group);

    const containerData: DroppedLootContainer = {
      id: `loot_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      group,
      x,
      y: bagY,
      z,
      items,
      createdAt: Date.now(),
      markerMesh: markerBuoy
    };

    this.worldObjects.droppedLootContainers.push(containerData);

    if (saveState) {
      this.saveWorldState();
    }

    return containerData;
  }

  public removeDroppedLootContainer(id: string) {
    const idx = this.worldObjects.droppedLootContainers.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const container = this.worldObjects.droppedLootContainers[idx];
      this.scene.remove(container.group);
      this.worldObjects.droppedLootContainers.splice(idx, 1);
      this.saveWorldState();
    }
  }

  // --- UPDATE LOOP ---
  public update(delta: number) {
    const elapsed = this.clock.getElapsedTime();

    // Animate water transparency / wave pulse
    if (this.waterMaterial) {
      this.waterMaterial.opacity = 0.64 + Math.sin(elapsed * 1.5) * 0.04;
    }

    // Animate Placed Rafts (Buoyancy floating & sail wind ripple)
    for (let r = 0; r < this.worldObjects.placedRafts.length; r++) {
      const raft = this.worldObjects.placedRafts[r];
      // Gentle ocean bobbing
      const bob = Math.sin(elapsed * 1.8 + raft.x * 0.2 + raft.z * 0.2) * 0.035;
      const rockRoll = Math.cos(elapsed * 1.4 + raft.x * 0.1) * 0.03;
      const terrainY = this.getTerrainHeight(raft.x, raft.z);
      // Buoyancy: Water surface is at y = 0.0. Raft floats at sea level 0.06 + bob.
      // If pulled onto shallow shore or sandbank, it sits on sand (terrainY + 0.12), never sinking or clipping into ground!
      const targetY = Math.max(0.06, terrainY + 0.12) + bob;
      raft.y = targetY;
      raft.group.position.set(raft.x, targetY, raft.z);
      raft.group.rotation.z = rockRoll;

      if (raft.sailMesh) {
        // Wind billow
        raft.sailMesh.rotation.y = Math.sin(elapsed * 2.5) * 0.08;
      }
    }

    // Update ground items physics (falling, bouncing on terrain, floating if buoyant)
    for (let i = this.worldObjects.groundItems.length - 1; i >= 0; i--) {
      const item = this.worldObjects.groundItems[i];
      const isBuoyant = isItemBuoyant(item.type);
      const groundY = this.getTerrainHeight(item.x, item.z) + 0.12;

      if (isBuoyant && groundY < 0.0) {
        // Floating on water surface with gentle wave bobbing
        const waterSurfaceY = 0.04 + Math.sin(elapsed * 2.0 + item.x * 0.5 + item.z * 0.5) * 0.02;
        if (item.y > waterSurfaceY) {
          item.vy -= 9.8 * delta;
          item.y += item.vy * delta;
          if (item.y <= waterSurfaceY) {
            item.y = waterSurfaceY;
            item.vy = 0;
          }
        } else {
          item.y = waterSurfaceY;
          item.vy = 0;
        }
        item.vx *= Math.pow(0.2, delta * 4);
        item.vz *= Math.pow(0.2, delta * 4);
        item.x += item.vx * delta;
        item.z += item.vz * delta;
        item.group.position.set(item.x, item.y, item.z);
        item.group.rotation.y += delta * 0.5;
      } else {
        // Heavy item or item on dry land: gravity pulls down to ground/seabed
        if (item.y > groundY || Math.abs(item.vy) > 0.05 || Math.abs(item.vx) > 0.05 || Math.abs(item.vz) > 0.05) {
          const inWater = item.y < 0.0;
          const gravity = inWater ? 5.5 : 9.8;
          const drag = inWater ? 0.85 : 0.98;

          item.vy -= gravity * delta;
          item.vx *= Math.pow(drag, delta * 30);
          item.vz *= Math.pow(drag, delta * 30);

          item.x += item.vx * delta;
          item.y += item.vy * delta;
          item.z += item.vz * delta;

          if (item.y <= groundY) {
            item.y = groundY;
            item.vy = -item.vy * 0.25; // soft bounce
            item.vx *= 0.5;
            item.vz *= 0.5;
            if (Math.abs(item.vy) < 0.15) item.vy = 0;
            if (Math.abs(item.vx) < 0.05) item.vx = 0;
            if (Math.abs(item.vz) < 0.05) item.vz = 0;
          }
          item.group.position.set(item.x, item.y, item.z);
          item.group.rotation.x += delta * 1.5;
          item.group.rotation.y += delta * 2.0;
        } else {
          item.y = groundY;
          item.group.position.set(item.x, item.y, item.z);
        }
      }
    }

    // Update Projectiles (Spears / Rocks)
    for (let p = this.worldObjects.projectiles.length - 1; p >= 0; p--) {
      const proj = this.worldObjects.projectiles[p];
      proj.lifeTime += delta;

      const inWater = proj.y < 0;
      const gravity = inWater ? 4.0 : 9.8;
      const drag = inWater ? 0.94 : 0.995;

      proj.vy -= gravity * delta;
      proj.vx *= Math.pow(drag, delta * 60);
      proj.vz *= Math.pow(drag, delta * 60);

      proj.x += proj.vx * delta;
      proj.y += proj.vy * delta;
      proj.z += proj.vz * delta;

      proj.group.position.set(proj.x, proj.y, proj.z);

      if (proj.type === 'spear') {
        const dir = new THREE.Vector3(proj.vx, proj.vy, proj.vz).normalize();
        if (dir.lengthSq() > 0.1) {
          proj.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
        }
      } else {
        proj.group.rotation.x += delta * 5;
        proj.group.rotation.y += delta * 4;
      }

      // Water entry splash
      if (!proj.hasSplashedWater && proj.y <= 0 && proj.y > -0.5) {
        proj.hasSplashedWater = true;
        this.createSplashEffect(proj.x, proj.z);
      }

      // Ground collision
      const groundY = this.getTerrainHeight(proj.x, proj.z);
      if (proj.y <= groundY + 0.15) {
        proj.hasHitGround = true;
        this.scene.remove(proj.group);
        this.worldObjects.projectiles.splice(p, 1);
        this.spawnGroundItem(proj.type === 'spear' ? 'spear' : (proj.type === 'rock' ? 'rock' : 'stone'), proj.x, proj.z, false);
      } else if (proj.lifeTime > 8) {
        this.scene.remove(proj.group);
        this.worldObjects.projectiles.splice(p, 1);
      }
    }

    // Update Water Splash Particles
    for (let s = this.worldObjects.waterSplashes.length - 1; s >= 0; s--) {
      const splash = this.worldObjects.waterSplashes[s];
      splash.life -= delta;

      for (let d = 0; d < splash.particles.length; d++) {
        const p = splash.particles[d];
        const vel = splash.velocities[d];
        vel.y -= 9.8 * delta;
        p.position.x += vel.x * delta;
        p.position.y += vel.y * delta;
        p.position.z += vel.z * delta;
        p.scale.multiplyScalar(0.96);
      }

      if (splash.life <= 0) {
        this.scene.remove(splash.group);
        this.worldObjects.waterSplashes.splice(s, 1);
      }
    }

    // Update Rock Hit Sparks
    for (let k = this.worldObjects.rockSparks.length - 1; k >= 0; k--) {
      const spark = this.worldObjects.rockSparks[k];
      spark.life -= delta;

      for (let d = 0; d < spark.particles.length; d++) {
        const p = spark.particles[d];
        const vel = spark.velocities[d];
        vel.y -= 12 * delta;
        p.position.x += vel.x * delta;
        p.position.y += vel.y * delta;
        p.position.z += vel.z * delta;
        p.scale.multiplyScalar(0.92);
      }

      if (spark.life <= 0) {
        this.scene.remove(spark.group);
        this.worldObjects.rockSparks.splice(k, 1);
      }
    }

    // Animate Dropped Loot Containers (Buoy wave bobbing & beacon light pulse)
    for (let l = 0; l < this.worldObjects.droppedLootContainers.length; l++) {
      const loot = this.worldObjects.droppedLootContainers[l];
      if (loot.markerMesh) {
        const buoyBob = Math.sin(elapsed * 2.2 + loot.x * 0.3) * 0.04;
        const buoyTilt = Math.cos(elapsed * 1.8 + loot.z * 0.3) * 0.08;
        loot.markerMesh.position.y = -loot.y + 0.12 + buoyBob;
        loot.markerMesh.rotation.z = buoyTilt;
      }
    }

    // Planted trees growth
    const now = Date.now();
    for (let i = this.worldObjects.plantedTrees.length - 1; i >= 0; i--) {
      const pt = this.worldObjects.plantedTrees[i];
      const ageSec = (now - pt.plantedAt) / 1000;
      if (pt.stage === 0 && ageSec > 10) {
        pt.stage = 1;
        this.scene.remove(pt.group);
        const saplingGroup = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
        const sapTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.8, 6), trunkMat);
        sapTrunk.position.y = 0.9;
        saplingGroup.add(sapTrunk);

        const frondMat = new THREE.MeshStandardMaterial({ color: '#22c55e', side: THREE.DoubleSide });
        for (let f = 0; f < 5; f++) {
          const frondGeom = new THREE.ConeGeometry(0.4, 1.6, 4);
          frondGeom.rotateX(Math.PI / 2);
          const frond = new THREE.Mesh(frondGeom, frondMat);
          frond.position.set(0, 1.8, 0);
          frond.rotation.y = (f / 5) * Math.PI * 2;
          frond.rotation.x = 0.4;
          saplingGroup.add(frond);
        }
        const y = this.getTerrainHeight(pt.x, pt.z);
        saplingGroup.position.set(pt.x, y, pt.z);
        this.scene.add(saplingGroup);
        pt.group = saplingGroup;
      } else if (pt.stage === 1 && ageSec > 25) {
        pt.stage = 2;
        this.scene.remove(pt.group);
        const fullTree = this.createPalmTreeMesh();
        const y = this.getTerrainHeight(pt.x, pt.z);
        fullTree.position.set(pt.x, y, pt.z);
        this.scene.add(fullTree);

        this.worldObjects.palmTrees.push({
          group: fullTree,
          x: pt.x,
          z: pt.z,
          health: 4,
          initialY: y,
          isChopped: false
        });

        this.worldObjects.plantedTrees.splice(i, 1);
      }
    }

    // Animate Sea Grass Beds (gentle current sway & respawn timers)
    for (let b = 0; b < this.worldObjects.seaGrassBeds.length; b++) {
      const bed = this.worldObjects.seaGrassBeds[b];
      if (!bed.hasGrass) {
        bed.respawnTimer -= delta;
        if (bed.respawnTimer <= 0) {
          bed.hasGrass = true;
          bed.group.scale.set(1.0, 1.0, 1.0);
        }
      } else {
        const sway = Math.sin(elapsed * 2.2 + bed.x * 0.3 + bed.z * 0.3) * 0.18;
        for (let i = 0; i < bed.blades.length; i++) {
          bed.blades[i].rotation.z = sway + (i % 2 === 0 ? 0.05 : -0.05);
        }
      }
    }

    // Animate Kelp Forests (deep ocean wave swell & respawn timers)
    for (let k = 0; k < this.worldObjects.kelpForest.length; k++) {
      const kelp = this.worldObjects.kelpForest[k];
      if (!kelp.hasKelp) {
        kelp.respawnTimer -= delta;
        if (kelp.respawnTimer <= 0) {
          kelp.hasKelp = true;
          kelp.group.scale.set(1.0, 1.0, 1.0);
        }
      } else {
        const swell = Math.sin(elapsed * 1.2 + kelp.x * 0.15 + kelp.z * 0.15) * 0.22;
        const frondFlutter = Math.cos(elapsed * 2.0 + k) * 0.12;
        kelp.group.rotation.z = swell;
        for (let f = 0; f < kelp.fronds.length; f++) {
          kelp.fronds[f].rotation.z = frondFlutter;
        }
      }
    }

    // Animate Chum Scent Clouds (particle drift, diffusion, and countdown)
    for (let c = this.worldObjects.chumClouds.length - 1; c >= 0; c--) {
      const cloud = this.worldObjects.chumClouds[c];
      cloud.life -= delta;
      const progress = 1 - (cloud.life / cloud.maxLife);
      
      // Expand and diffuse
      const scale = 1.0 + progress * 1.5;
      cloud.group.scale.set(scale, scale, scale);
      
      // Slow ocean current drift
      cloud.x += Math.sin(elapsed * 0.5) * 0.08 * delta;
      cloud.z += Math.cos(elapsed * 0.4) * 0.08 * delta;
      cloud.group.position.set(cloud.x, cloud.y, cloud.z);

      const mat = cloud.particles.material as THREE.PointsMaterial;
      if (mat) {
        mat.opacity = Math.max(0, (cloud.life / cloud.maxLife) * 0.75);
      }

      if (cloud.life <= 0) {
        this.scene.remove(cloud.group);
        this.worldObjects.chumClouds.splice(c, 1);
      }
    }

    // Animate Scallop Beds Respawn
    for (let s = 0; s < this.worldObjects.scallopBeds.length; s++) {
      const scallop = this.worldObjects.scallopBeds[s];
      if (scallop.isCollected) {
        scallop.respawnTimer -= delta;
        if (scallop.respawnTimer <= 0) {
          scallop.isCollected = false;
          scallop.group.visible = true;
        }
      }
    }

    // Animate Barnacle Clusters Respawn
    for (let b = 0; b < this.worldObjects.barnacleClusters.length; b++) {
      const cluster = this.worldObjects.barnacleClusters[b];
      if (cluster.isDepleted) {
        cluster.respawnTimer -= delta;
        if (cluster.respawnTimer <= 0) {
          cluster.isDepleted = false;
          cluster.count = cluster.initialCount;
          for (let c = 0; c < cluster.group.children.length; c++) {
            cluster.group.children[c].visible = true;
          }
        }
      }
    }

    // Dynamic Underwater vs Above-Water Visual Effects & Depth Attenuation
    const isCameraUnderwater = this.camera.position.y < 0.0;
    if (isCameraUnderwater) {
      const depth = Math.abs(this.camera.position.y);
      if (depth > 6.0) {
        // Deep trench / abyssal shelf mood
        if (this.scene.fog) {
          (this.scene.fog as THREE.FogExp2).color.set('#031d44');
          (this.scene.fog as THREE.FogExp2).density = 0.065;
        }
        this.scene.background = new THREE.Color('#031d44');
        this.ambientLight.color.set('#0077b6');
        this.ambientLight.intensity = 0.6;
      } else {
        // Coral reef / lagoon turquoise mood
        if (this.scene.fog) {
          (this.scene.fog as THREE.FogExp2).color.set('#0077b6');
          (this.scene.fog as THREE.FogExp2).density = 0.038;
        }
        this.scene.background = new THREE.Color('#0077b6');
        this.ambientLight.color.set('#48cae4');
        this.ambientLight.intensity = 0.95;
      }
    } else {
      if (this.scene.fog) {
        (this.scene.fog as THREE.FogExp2).color.set('#74B9FF');
        (this.scene.fog as THREE.FogExp2).density = 0.008;
      }
      this.scene.background = new THREE.Color('#87CEEB');
      this.ambientLight.color.set('#87CEEB');
      this.ambientLight.intensity = 1.1;
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  public setGraphicsQuality(quality: GraphicsQuality) {
    if (quality === 'low') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
      this.renderer.shadowMap.enabled = false;
      if (this.underwaterParticles) this.underwaterParticles.visible = false;
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      if (this.underwaterParticles) this.underwaterParticles.visible = true;
    } else if (quality === 'high') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (this.underwaterParticles) this.underwaterParticles.visible = true;
    } else {
      // Desktop / Ultra
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (this.underwaterParticles) this.underwaterParticles.visible = true;
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  private onWindowResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public destroy() {
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // --- PERSISTENT WORLD STATE MANAGEMENT ---
  public saveWorldState() {
    try {
      const data = {
        palmTrees: this.worldObjects.palmTrees.map((t) => ({ x: t.x, z: t.z, health: t.health, isChopped: t.isChopped })),
        fallenLogs: this.worldObjects.fallenLogs.map((l) => ({ x: l.x, z: l.z, woodRemaining: l.woodRemaining })),
        groundRocks: this.worldObjects.groundRocks.map((r) => ({ id: r.id, health: r.health, isPicked: r.isPicked })),
        bushes: this.worldObjects.bushes.map((b) => ({ x: b.x, z: b.z, hasFiber: b.hasFiber })),
        scallopBeds: this.worldObjects.scallopBeds.map((s) => ({ id: s.id, isCollected: s.isCollected, respawnTimer: s.respawnTimer })),
        barnacleClusters: this.worldObjects.barnacleClusters.map((bc) => ({ id: bc.id, count: bc.count, isDepleted: bc.isDepleted, respawnTimer: bc.respawnTimer })),
        seaGrassBeds: this.worldObjects.seaGrassBeds.map((sg) => ({ id: sg.id, hasGrass: sg.hasGrass, respawnTimer: sg.respawnTimer })),
        kelpForest: this.worldObjects.kelpForest.map((kp) => ({ id: kp.id, hasKelp: kp.hasKelp, respawnTimer: kp.respawnTimer })),
        placedTraps: this.worldObjects.placedTraps.map((tp) => ({ x: tp.x, z: tp.z, bait: tp.bait, caughtFish: tp.caughtFish })),
        placedCraftingTables: this.worldObjects.placedCraftingTables.map((ct) => ({ x: ct.x, z: ct.z, rotY: ct.rotY })),
        placedRafts: this.worldObjects.placedRafts.map((rf) => ({ x: rf.x, z: rf.z, rotY: rf.rotY, hasSail: rf.hasSail, isExpanded: rf.isExpanded, speed: rf.speed })),
        structures: this.worldObjects.structures.map((st) => ({ type: st.type, x: st.x, y: st.y, z: st.z, rotY: st.rotY })),
        plantedTrees: this.worldObjects.plantedTrees.map((pt) => ({ x: pt.x, z: pt.z, stage: pt.stage, plantedAt: pt.plantedAt, health: pt.health })),
        groundItems: this.worldObjects.groundItems.map((gi) => ({ type: gi.type, x: gi.x, z: gi.z })),
        droppedLootContainers: this.worldObjects.droppedLootContainers.map((dl) => ({ id: dl.id, x: dl.x, y: dl.y, z: dl.z, items: dl.items, createdAt: dl.createdAt }))
      };
      localStorage.setItem('wtf_island_world_state_v2', JSON.stringify(data));
    } catch {
      // Ignore local storage quota limits
    }
  }

  public loadWorldState() {
    try {
      const raw = localStorage.getItem('wtf_island_world_state_v2');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data) return;

      if (Array.isArray(data.palmTrees)) {
        data.palmTrees.forEach((savedTree: { x: number; z: number; health: number; isChopped: boolean }) => {
          const tree = this.worldObjects.palmTrees.find((t) => Math.abs(t.x - savedTree.x) < 0.5 && Math.abs(t.z - savedTree.z) < 0.5);
          if (tree) {
            tree.health = savedTree.health;
            tree.isChopped = savedTree.isChopped;
            if (tree.isChopped) {
              this.scene.remove(tree.group);
            }
          }
        });
      }

      if (Array.isArray(data.fallenLogs)) {
        data.fallenLogs.forEach((savedLog: { x: number; z: number; woodRemaining: number }) => {
          const log = this.spawnFallenLog(savedLog.x, savedLog.z, 0);
          log.woodRemaining = savedLog.woodRemaining;
        });
      }

      if (Array.isArray(data.groundRocks)) {
        data.groundRocks.forEach((savedRock: { id: string; health: number; isPicked: boolean }) => {
          const rock = this.worldObjects.groundRocks.find((r) => r.id === savedRock.id);
          if (rock) {
            rock.health = savedRock.health;
            rock.isPicked = savedRock.isPicked;
            if (rock.isPicked) {
              this.scene.remove(rock.mesh);
            }
          }
        });
      }

      if (Array.isArray(data.bushes)) {
        data.bushes.forEach((savedBush: { x: number; z: number; hasFiber: boolean }) => {
          const bush = this.worldObjects.bushes.find((b) => Math.abs(b.x - savedBush.x) < 0.5 && Math.abs(b.z - savedBush.z) < 0.5);
          if (bush) {
            bush.hasFiber = savedBush.hasFiber;
            if (!bush.hasFiber) {
              bush.group.scale.set(0.6, 0.6, 0.6);
            }
          }
        });
      }

      if (Array.isArray(data.scallopBeds)) {
        data.scallopBeds.forEach((savedScallop: { id: string; isCollected: boolean; respawnTimer: number }) => {
          const sc = this.worldObjects.scallopBeds.find((s) => s.id === savedScallop.id);
          if (sc) {
            sc.isCollected = savedScallop.isCollected;
            sc.respawnTimer = savedScallop.respawnTimer;
            if (sc.isCollected) sc.group.visible = false;
          }
        });
      }

      if (Array.isArray(data.barnacleClusters)) {
        data.barnacleClusters.forEach((savedBarnacle: { id: string; count: number; isDepleted: boolean; respawnTimer: number }) => {
          const bc = this.worldObjects.barnacleClusters.find((b) => b.id === savedBarnacle.id);
          if (bc) {
            bc.count = savedBarnacle.count;
            bc.isDepleted = savedBarnacle.isDepleted;
            bc.respawnTimer = savedBarnacle.respawnTimer;
            for (let c = 0; c < bc.group.children.length; c++) {
              bc.group.children[c].visible = c < bc.count;
            }
          }
        });
      }

      if (Array.isArray(data.seaGrassBeds)) {
        data.seaGrassBeds.forEach((savedSG: { id: string; hasGrass: boolean; respawnTimer: number }) => {
          const sg = this.worldObjects.seaGrassBeds.find((s) => s.id === savedSG.id);
          if (sg) {
            sg.hasGrass = savedSG.hasGrass;
            sg.respawnTimer = savedSG.respawnTimer;
            if (!sg.hasGrass) sg.group.scale.set(0.2, 0.2, 0.2);
          }
        });
      }

      if (Array.isArray(data.kelpForest)) {
        data.kelpForest.forEach((savedKelp: { id: string; hasKelp: boolean; respawnTimer: number }) => {
          const kp = this.worldObjects.kelpForest.find((k) => k.id === savedKelp.id);
          if (kp) {
            kp.hasKelp = savedKelp.hasKelp;
            kp.respawnTimer = savedKelp.respawnTimer;
            if (!kp.hasKelp) kp.group.scale.set(0.3, 0.3, 0.3);
          }
        });
      }

      if (Array.isArray(data.placedTraps)) {
        data.placedTraps.forEach((savedTrap: { x: number; z: number; bait: BaitType | null; caughtFish: Array<{ speciesId: string; sizeCm: number; caughtAt: number }> }) => {
          const trap = this.placeFishTrap(savedTrap.x, savedTrap.z);
          trap.bait = savedTrap.bait;
          trap.caughtFish = savedTrap.caughtFish || [];
          this.updateTrapVisuals(trap);
        });
      }

      if (Array.isArray(data.placedCraftingTables)) {
        data.placedCraftingTables.forEach((savedTable: { x: number; z: number; rotY: number }) => {
          this.placeCraftingTable(savedTable.x, savedTable.z, savedTable.rotY);
        });
      }

      if (Array.isArray(data.placedRafts)) {
        data.placedRafts.forEach((savedRaft: { x: number; z: number; rotY: number; hasSail: boolean; isExpanded: boolean }) => {
          this.placeRaft(savedRaft.x, savedRaft.z, savedRaft.hasSail, savedRaft.isExpanded);
        });
      }

      if (Array.isArray(data.structures)) {
        data.structures.forEach((savedStruct: { type: StructureType; x: number; y: number; z: number; rotY: number }) => {
          this.placeStructure(savedStruct.type, savedStruct.x, savedStruct.y, savedStruct.z, savedStruct.rotY);
        });
      }

      if (Array.isArray(data.groundItems)) {
        data.groundItems.forEach((gi: { type: ToolType; x: number; z: number }) => {
          this.spawnGroundItem(gi.type, gi.x, gi.z, false);
        });
      }

      if (Array.isArray(data.droppedLootContainers)) {
        data.droppedLootContainers.forEach((savedLoot: { id: string; x: number; y: number; z: number; items: Record<string, number> }) => {
          this.spawnDroppedLootContainer(savedLoot.x, savedLoot.y, savedLoot.z, savedLoot.items, false);
        });
      }
    } catch {
      // Ignore corrupted state
    }
  }
}
