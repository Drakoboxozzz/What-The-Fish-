/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolType = 
  | 'none'
  | 'hands'
  | 'rock'
  | 'stone'
  | 'wood'
  | 'fiber'
  | 'rope'
  | 'palm_shell'
  | 'live_fish_shell'
  | 'stone_axe'
  | 'stone_pickaxe'
  | 'spear'
  | 'crafting_table'
  | 'simple_raft'
  | 'raft_sail'
  | 'raft_expansion'
  | 'wood_structure'
  | 'fish_trap'
  | 'seed'
  | 'crab'
  | 'fruit'
  | 'fish'
  | 'scallop'
  | 'barnacle'
  | 'chum'
  | 'sea_grass'
  | 'kelp';

export type StructureType = 'foundation' | 'wall' | 'roof' | 'pillar';

export type CatchMethod = 'spear' | 'hands' | 'trap' | 'palm_shell' | 'rod';

export type BaitType = 'crab' | 'fruit' | 'fish' | 'scallop' | 'barnacle' | 'sea_grass' | 'kelp';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'desktop';

export type EcologicalRole = 
  | 'herbivore'           // Grazes on algae, sea grass, kelp
  | 'small_omnivore'      // Feeds on crumbs, fruit, micro-fauna
  | 'invertebrate_feeder' // Hunts crabs, scallops, barnacles, mollusks
  | 'mid_carnivore'       // Hunts smaller fish, crabs, scallops
  | 'apex_predator';      // Large hunters patrolling deep water, hunting fish

export type FishBehaviorState = 
  | 'CALM' 
  | 'ALERT' 
  | 'FLEE' 
  | 'HIDE' 
  | 'FEED' 
  | 'SCHOOL' 
  | 'HUNT' 
  | 'REST'
  | 'CHUM_ATTRACTED';

export type HabitatZone = 
  | 'shoreline_shallows' 
  | 'lagoon_channel' 
  | 'coral_reef' 
  | 'seagrass_bed' 
  | 'kelp_forest' 
  | 'open_sea' 
  | 'deep_trench';

export interface FishSpecies {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  funFact: string;
  habitat: string;
  habitatZone?: HabitatZone;
  minSizeCm: number;
  maxSizeCm: number;
  baseRarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  depthPreference: 'surface' | 'mid' | 'bottom' | 'abyssal';
  swimSpeed: number;
  spookDistance: number;
  primaryColor: string;
  secondaryColor: string;
  shape: 'torpedo' | 'flat' | 'oval' | 'shark' | 'spiky' | 'slender' | 'box' | 'disc' | 'needle' | 'trigger' | 'grouper' | 'anthias' | 'trevally' | 'goatfish' | 'hammerhead' | 'barracuda';
  handCatchDifficulty: 'very_easy' | 'easy' | 'moderate' | 'hard' | 'impossible';
  role: EcologicalRole;
  isPredator?: boolean;
  isLargePredator?: boolean;
  isSchooling?: boolean;
  isSolitary?: boolean;
  isPairing?: boolean;
  preferredBaits: BaitType[];
  preferredBait?: 'crab' | 'fruit' | 'fish' | 'scallop' | 'barnacle' | 'sea_grass' | 'both';
  maxPreySizeRatio?: number; // Maximum ratio of prey size relative to predator (e.g. 0.45)
}

export interface FishRecord {
  speciesId: string;
  caught: boolean;
  count: number;
  maxSizeCm: number;
  caughtMethods: Record<CatchMethod, boolean>;
}

export interface InventoryItem {
  id: string;
  toolType: ToolType;
  name: string;
  count: number;
  icon: string;
  description: string;
  category: 'tool' | 'resource' | 'bait' | 'fish' | 'structure';
}

export interface CraftingRecipe {
  id: string;
  resultTool: ToolType;
  resultName: string;
  resultCount: number;
  icon: string;
  description: string;
  station: 'pocket' | 'crafting_table';
  requirements: {
    wood?: number;
    rock?: number;
    stone?: number;
    fiber?: number;
    rope?: number;
    seed?: number;
    palm_shell?: number;
    crab?: number;
    fish?: number;
    scallop?: number;
    barnacle?: number;
    sea_grass?: number;
    kelp?: number;
  };
}

export interface PlacedStructure {
  id: string;
  type: StructureType;
  group: any;
  x: number;
  y: number;
  z: number;
  rotY: number;
}

export interface PlacedRaft {
  id: string;
  group: any;
  sailMesh: any;
  expansionGroup: any;
  x: number;
  y: number;
  z: number;
  rotY: number;
  hasSail: boolean;
  isExpanded: boolean;
  speed: number;
  turnSpeed: number;
}

export interface PlacedCraftingTable {
  id: string;
  group: any;
  x: number;
  y: number;
  z: number;
  rotY: number;
}

export interface PlantedTree {
  id: string;
  x: number;
  z: number;
  plantedAt: number; // timestamp
  stage: number; // 0: sprout, 1: sapling, 2: adult
  health: number;
}

export interface TrappedFish {
  speciesId: string;
  sizeCm: number;
  caughtAt: number;
}

export interface PlacedTrap {
  id: string;
  group?: any;
  fishMeshGroup?: any;
  x: number;
  y: number;
  z: number;
  placedAt: number;
  bait: BaitType | null;
  caughtFish: TrappedFish[];
  maxCapacity: 5;
}

export interface CaughtEvent {
  species: FishSpecies;
  sizeCm: number;
  method: CatchMethod;
  timestamp: number;
  firstTimeForMethod: boolean;
  firstTimeForSpecies: boolean;
}

export interface LiveFishHolding {
  species: FishSpecies;
  sizeCm: number;
}

