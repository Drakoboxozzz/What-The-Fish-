/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ToolType, CatchMethod, StructureType, PlacedRaft, PlacedTrap, BaitType, DroppedLootContainer } from '../types';
import { FISH_SPECIES } from '../data/fishData';
import { sound } from '../audio/soundEngine';
import { IslandThreeEngine } from './threeEngine';
import { Ecosystem, FishInstance } from './ecosystem';

export interface PlayerControllerCallbacks {
  onCatchFish: (fish: FishInstance, method: CatchMethod) => void;
  onPickupItem: (type: string, count: number) => void;
  onConsumeAuthoritativeItem?: (itemKey: string) => boolean;
  getAuthoritativeItemCount?: (itemKey: string) => number;
  onToolChanged?: (newTool: ToolType) => void;
  onNotification: (msg: string) => void;
  onBoundaryWarning: (warn: boolean) => void;
  onWaterStateChange: (inWater: boolean, depth: number, isSwimming: boolean, isDiving: boolean, airPercent: number) => void;
  onSneakChange: (isSneaking: boolean) => void;
  onRodStateChange: (state: 'idle' | 'cast' | 'nibble' | 'hooked', tension: number) => void;
  onPlaceStructure: (type: StructureType) => void;
  onRaftBoardStateChange?: (onRaft: boolean) => void;
  onHealthChange?: (health: number, maxHealth: number, wasDamaged?: boolean) => void;
  onPlayerDeath?: (deathPos: { x: number; y: number; z: number }) => void;
  onRecoverLoot?: (items: Record<string, number>) => void;
}

export class PlayerController {
  private engine: IslandThreeEngine;
  private ecosystem: Ecosystem;
  private callbacks: PlayerControllerCallbacks;

  // Position & Physics
  public position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private isGrounded: boolean = true;
  private isSneaking: boolean = false;
  private isSprinting: boolean = false;
  private isWading: boolean = false;
  public isSwimming: boolean = false;
  public isDiving: boolean = false;
  private waterDepth: number = 0;

  // Health, Survival & Spawn
  public health: number = 100;
  public maxHealth: number = 100;
  public invulnerabilityTimer: number = 0;
  public timeSinceLastDamage: number = 0;
  public isDead: boolean = false;
  public activeSpawnPoint = { x: -4, y: 1.5, z: 4, name: 'Castaway Lagoon' };

  // Independent touch diving controls
  public touchDive: boolean = false;
  public touchAscend: boolean = false;

  // Raft Piloting State
  public pilotingRaft: PlacedRaft | null = null;

  // Air & Oxygen System
  public airLevel: number = 100;
  private lastSwimStrokeTime: number = 0;
  private lastAirWarningTime: number = 0;
  private wasDivingLastFrame: boolean = false;

  // Throw debounce & state (prevents duplication and rapid spam)
  private lastThrowTimestamp: number = 0;
  private isThrowingState: boolean = false;

  // View & Camera
  public yaw: number = 0;
  public pitch: number = 0;
  public characterFacingYaw: number = 0;
  public isThirdPerson: boolean = false;
  private cameraDistance: number = 3.8;
  private isDraggingMouse: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private isMouseDown: boolean = false;
  private mouseDragDistance: number = 0;
  private isPointerLocked: boolean = false;

  // Visual Character Mesh (for 3D world & 3rd person)
  public playerGroup: THREE.Group;
  public bodyMesh: THREE.Mesh;
  public headMesh: THREE.Mesh;
  public armRight: THREE.Group;
  public armLeft: THREE.Group;
  public legRight: THREE.Group;
  public legLeft: THREE.Group;
  public handToolGroup: THREE.Group;

  // Movement Input state & Lock
  public isInputLocked: boolean = false;
  private keys: Record<string, boolean> = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
    sprint: false,
    sneak: false
  };
  private touchMove: { x: number; z: number; isSprinting: boolean } = { x: 0, z: 0, isSprinting: false };

  // Tool & Action state
  public equippedTool: ToolType = 'hands';
  public selectedStructureType: StructureType = 'foundation';
  private isSwinging: boolean = false;
  private swingProgress: number = 0;
  private swingType: 'chop' | 'thrust' | 'throw' | 'scoop' | 'mine' = 'chop';

  // Fishing Rod State
  private rodState: 'idle' | 'cast' | 'nibble' | 'hooked' = 'idle';
  private rodBobberMesh: THREE.Mesh | null = null;
  private rodBobberPos: THREE.Vector3 = new THREE.Vector3();
  private rodLineMesh: THREE.Line | null = null;
  private biteTimer: number = 0;
  private tension: number = 50; // 0 to 100
  private targetedFish: FishInstance | null = null;

  // Bound event listener references for proper cleanup
  private handleKeyDownBound: (e: KeyboardEvent) => void;
  private handleKeyUpBound: (e: KeyboardEvent) => void;
  private handleMouseDownBound: (e: MouseEvent) => void;
  private handleMouseMoveBound: (e: MouseEvent) => void;
  private handleMouseUpBound: () => void;
  private handleContextMenuBound: (e: MouseEvent) => void;
  private handleWindowBlurBound: () => void;
  private handleVisibilityChangeBound: () => void;
  private handleWindowFocusBound: () => void;
  private handlePageHideBound: () => void;
  private handlePointerCancelBound: () => void;

  constructor(engine: IslandThreeEngine, ecosystem: Ecosystem, callbacks: PlayerControllerCallbacks) {
    this.engine = engine;
    this.ecosystem = ecosystem;
    this.callbacks = callbacks;

    // Initialize bound event listeners
    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleKeyUpBound = this.handleKeyUp.bind(this);
    this.handleMouseDownBound = this.handleMouseDown.bind(this);
    this.handleMouseMoveBound = this.handleMouseMove.bind(this);
    this.handleMouseUpBound = this.handleMouseUp.bind(this);
    this.handleContextMenuBound = (e: MouseEvent) => e.preventDefault();
    this.handleWindowBlurBound = this.handleWindowBlur.bind(this);
    this.handleVisibilityChangeBound = this.handleVisibilityChange.bind(this);
    this.handleWindowFocusBound = this.handleWindowFocus.bind(this);
    this.handlePageHideBound = this.handlePageHide.bind(this);
    this.handlePointerCancelBound = this.handlePointerCancel.bind(this);

    // Start on sandy beach near gentle lagoon shore
    this.position = new THREE.Vector3(-4, 0, 4);
    this.position.y = this.engine.getTerrainHeight(this.position.x, this.position.z) + 1.2;
    this.velocity = new THREE.Vector3();

    // Create 3D Character Model
    this.playerGroup = this.createCharacterModel();
    this.engine.scene.add(this.playerGroup);

    // Setup input listeners
    this.setupEventListeners();

    // Connect predator attack callback
    this.ecosystem.onPlayerAttackedByPredator = (predatorName: string, damage: number) => {
      this.applyDamage(damage, predatorName);
    };
  }

  // --- CHARACTER 3D AVATAR (Polished tropical explorer model) ---
  private createCharacterModel(): THREE.Group {
    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: '#f5d0b0', roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: '#FF7675', roughness: 0.7, flatShading: true });
    const vestMat = new THREE.MeshStandardMaterial({ color: '#E17055', roughness: 0.8, flatShading: true });
    const shortsMat = new THREE.MeshStandardMaterial({ color: '#2D3436', roughness: 0.8, flatShading: true });
    const strawMat = new THREE.MeshStandardMaterial({ color: '#F9CA24', roughness: 0.85 });
    const ribbonMat = new THREE.MeshStandardMaterial({ color: '#00B894', roughness: 0.5 });
    const maskMat = new THREE.MeshStandardMaterial({ color: '#0984E3', roughness: 0.3, transparent: true, opacity: 0.85 });
    const darkMat = new THREE.MeshBasicMaterial({ color: '#2D3436' });

    // Torso (Explorer Shirt + Open Vest)
    this.bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.28), shirtMat);
    this.bodyMesh.position.y = 0.95;
    this.bodyMesh.castShadow = true;
    group.add(this.bodyMesh);

    // Explorer Vest overlay panels
    const vestL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 0.31), vestMat);
    vestL.position.set(0.19, 0, 0);
    this.bodyMesh.add(vestL);
    const vestR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 0.31), vestMat);
    vestR.position.set(-0.19, 0, 0);
    this.bodyMesh.add(vestR);

    // Head
    this.headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.32), skinMat);
    this.headMesh.position.y = 1.48;
    this.headMesh.castShadow = true;
    group.add(this.headMesh);

    // Stylized friendly eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), darkMat);
    eyeL.position.set(0.08, 0.04, -0.17);
    this.headMesh.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), darkMat);
    eyeR.position.set(-0.08, 0.04, -0.17);
    this.headMesh.add(eyeR);

    // Upgraded Straw Hat with Teal Ribbon Band
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.16, 12), strawMat);
    hatCrown.position.y = 0.24;
    hatCrown.castShadow = true;
    this.headMesh.add(hatCrown);

    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.04, 14), strawMat);
    hatBrim.position.y = 0.17;
    hatBrim.castShadow = true;
    this.headMesh.add(hatBrim);

    const hatRibbon = new THREE.Mesh(new THREE.CylinderGeometry(0.262, 0.262, 0.045, 12), ribbonMat);
    hatRibbon.position.y = 0.19;
    this.headMesh.add(hatRibbon);

    // Snorkel Mask Visor & Breathing Tube
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.06), maskMat);
    mask.position.set(0, 0.04, -0.18);
    this.headMesh.add(mask);

    const snorkelTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6), ribbonMat);
    snorkelTube.position.set(0.18, 0.22, -0.05);
    snorkelTube.rotation.z = -0.25;
    this.headMesh.add(snorkelTube);

    // Arms
    this.armLeft = new THREE.Group();
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), skinMat);
    armL.position.y = -0.22;
    armL.castShadow = true;
    this.armLeft.position.set(0.32, 1.22, 0);
    this.armLeft.add(armL);
    group.add(this.armLeft);

    // Wrist watch/compass on left arm
    const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8), darkMat);
    watch.position.set(0, -0.36, 0);
    this.armLeft.add(watch);

    this.armRight = new THREE.Group();
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), skinMat);
    armR.position.y = -0.22;
    armR.castShadow = true;
    this.armRight.position.set(-0.32, 1.22, 0);
    this.armRight.add(armR);
    group.add(this.armRight);

    // Held Tool container in right hand
    this.handToolGroup = new THREE.Group();
    this.handToolGroup.position.set(0, -0.42, 0.18);
    this.armRight.add(this.handToolGroup);

    // Legs with Island Cargo Shorts
    this.legLeft = new THREE.Group();
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), shortsMat);
    legL.position.y = -0.32;
    legL.castShadow = true;
    this.legLeft.position.set(0.15, 0.65, 0);
    this.legLeft.add(legL);
    group.add(this.legLeft);

    this.legRight = new THREE.Group();
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), shortsMat);
    legR.position.y = -0.32;
    legR.castShadow = true;
    this.legRight.position.set(-0.15, 0.65, 0);
    this.legRight.add(legR);
    group.add(this.legRight);

    return group;
  }

  // --- HEALTH & DEATH SYSTEM (Relaxing exploration, non-horror) ---
  public applyDamage(amount: number, reason: string): boolean {
    if (this.isDead || this.invulnerabilityTimer > 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.invulnerabilityTimer = 1.8;
    this.timeSinceLastDamage = 0;
    sound.playPlayerHurt();
    this.callbacks.onHealthChange?.(this.health, this.maxHealth, true);

    if (reason) {
      this.callbacks.onNotification(`⚠️ ${reason}!`);
    }

    if (this.health <= 0) {
      this.handlePlayerDeath();
    }
    return true;
  }

  public handlePlayerDeath() {
    if (this.isDead) return;
    this.isDead = true;
    this.isInputLocked = true;
    this.resetAllInputs();

    const deathPos = {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z
    };

    this.callbacks.onNotification('😴 You exhausted yourself! Washing ashore at Castaway Lagoon...');
    this.callbacks.onPlayerDeath?.(deathPos);

    // Gentle fade/transition back to Castaway Lagoon spawn
    setTimeout(() => {
      this.respawnPlayer();
    }, 2400);
  }

  public respawnPlayer() {
    const terrainH = this.engine.getTerrainHeight(this.activeSpawnPoint.x, this.activeSpawnPoint.z);
    this.position.set(
      this.activeSpawnPoint.x,
      Math.max(this.activeSpawnPoint.y, terrainH + 1.2),
      this.activeSpawnPoint.z
    );
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.airLevel = 100;
    this.isDead = false;
    this.isInputLocked = false;
    this.invulnerabilityTimer = 2.5;
    this.timeSinceLastDamage = 0;
    this.equippedTool = 'hands';
    this.callbacks.onToolChanged?.('hands');
    sound.playPlayerRespawn();
    this.callbacks.onHealthChange?.(this.health, this.maxHealth, false);
    this.callbacks.onWaterStateChange(false, 0, false, false, 100);
    this.callbacks.onNotification('🌊 Resurfaced at Castaway Lagoon. Look for your beacon buoy to recover your supplies!');
  }

  public recoverDroppedSupplies(container: DroppedLootContainer) {
    if (!container || !container.items) return;
    this.callbacks.onRecoverLoot?.(container.items);
    sound.playRecoveryChime();
    this.engine.removeDroppedLootContainer(container.id);
    this.callbacks.onNotification('✨ Supplies Recovered! Picked up all your lost items.');
  }

  public setTouchDive(active: boolean) {
    this.touchDive = active;
  }

  public setTouchAscend(active: boolean) {
    this.touchAscend = active;
  }

  // --- INPUT RESET & SAFETY ---

  /**
   * Immediately clears ALL active movement, interaction, camera dragging, and touch states.
   * Resets horizontal momentum so the player/raft never continues drifting or turning unintentionally.
   */
  public resetAllInputs() {
    for (const key of Object.keys(this.keys)) {
      this.keys[key] = false;
    }
    this.touchMove = { x: 0, z: 0, isSprinting: false };
    this.isDraggingMouse = false;
    this.velocity.x = 0;
    this.velocity.z = 0;
  }

  public setTouchMove(x: number, z: number, isSprinting: boolean = false) {
    if (this.isInputLocked) {
      this.touchMove = { x: 0, z: 0, isSprinting: false };
      return;
    }
    this.touchMove = { x, z, isSprinting };
  }

  public applyTouchLook(dx: number, dy: number) {
    if (this.isInputLocked) return;
    const sensitivity = 0.0046;
    this.yaw -= dx * sensitivity;
    this.pitch -= dy * sensitivity;
    this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
  }

  public triggerJump() {
    if (this.isInputLocked) return;
    sound.resume();
    if (this.pilotingRaft) {
      this.disembarkRaft();
    } else if (this.isSwimming) {
      this.velocity.y = 4.0;
    } else if (this.isGrounded) {
      this.velocity.y = 5.2;
      this.isGrounded = false;
      sound.playFootstep(this.isWading);
    }
  }

  public toggleSneak() {
    if (this.isInputLocked) return;
    this.isSneaking = !this.isSneaking;
    this.callbacks.onSneakChange(this.isSneaking);
  }

  private handleWindowBlur() {
    this.resetAllInputs();
  }

  private handleVisibilityChange() {
    if (typeof document !== 'undefined' && document.hidden) {
      this.resetAllInputs();
    }
  }

  private handleWindowFocus() {
    // When returning to the game, ensure clean slate (do not assume keys are still pressed)
    this.resetAllInputs();
  }

  private handlePageHide() {
    this.resetAllInputs();
  }

  private handlePointerCancel() {
    this.resetAllInputs();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.isInputLocked) return;
    sound.resume();
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
      case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
      case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
      case 'KeyQ': this.keys.turnLeft = true; break;
      case 'KeyE':
        if (this.pilotingRaft) {
          this.disembarkRaft();
        } else {
          const nearbyRaft = this.checkAimAtRaft();
          if (nearbyRaft) {
            this.boardRaft(nearbyRaft);
          } else {
            this.keys.turnRight = true;
          }
        }
        break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
      case 'KeyC':
      case 'ControlLeft':
      case 'ControlRight':
        this.keys.sneak = true;
        this.keys.dive = true;
        this.isSneaking = !this.isSneaking;
        this.callbacks.onSneakChange(this.isSneaking);
        break;
      case 'KeyV':
        this.isThirdPerson = !this.isThirdPerson;
        this.callbacks.onNotification(this.isThirdPerson ? 'Camera: 3rd Person' : 'Camera: 1st Person');
        break;
      case 'KeyR':
        if (this.equippedTool === 'wood_structure') {
          this.cycleStructureType();
        } else if (this.equippedTool === 'spear' || this.equippedTool === 'rock') {
          this.triggerThrowAction();
        }
        break;
      case 'Space':
        this.keys.jump = true;
        this.keys.ascend = true;
        if (this.pilotingRaft) {
          this.disembarkRaft();
        } else if (!this.isSwimming && this.isGrounded) {
          this.velocity.y = 5.2;
          this.isGrounded = false;
          sound.playFootstep(this.isWading);
        }
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
      case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
      case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
      case 'KeyQ': this.keys.turnLeft = false; break;
      case 'KeyE': this.keys.turnRight = false; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
      case 'KeyC':
      case 'ControlLeft':
      case 'ControlRight':
        this.keys.sneak = false;
        this.keys.dive = false;
        break;
      case 'Space':
        this.keys.jump = false;
        this.keys.ascend = false;
        break;
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.isInputLocked) return;
    sound.resume();
    this.isMouseDown = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.mouseDragDistance = 0;

    if (this.isPointerLocked) {
      if (e.button === 0) {
        this.triggerPrimaryAction();
      } else if (e.button === 2) {
        e.preventDefault();
        this.triggerThrowAction();
      }
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isInputLocked) return;

    if (this.isPointerLocked) {
      const deltaX = e.movementX || 0;
      const deltaY = e.movementY || 0;
      this.yaw -= deltaX * 0.0028;
      this.pitch -= deltaY * 0.0028;
      this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
      return;
    }

    if (!this.isMouseDown) return;

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    this.mouseDragDistance += Math.abs(deltaX) + Math.abs(deltaY);

    const sensitivity = 0.0035;
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;

    // Clamp vertical pitch to prevent gimbal lock
    this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
  }

  private handleMouseUp(e: MouseEvent) {
    if (!this.isPointerLocked && this.isMouseDown) {
      // If mouse moved less than 6px total, this is a clean deliberate CLICK (not a camera rotation drag)
      if (this.mouseDragDistance < 6) {
        if (e.button === 0) {
          this.triggerPrimaryAction();
        } else if (e.button === 2) {
          e.preventDefault();
          this.triggerThrowAction();
        }
      }
    }
    this.isMouseDown = false;
    this.isDraggingMouse = false;
    this.mouseDragDistance = 0;
  }

  // --- INPUT EVENT LISTENERS ---
  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDownBound);
    window.addEventListener('keyup', this.handleKeyUpBound);

    // Canvas click requests pointer lock for desktop PC camera control
    this.engine.container.addEventListener('click', () => {
      if (!('ontouchstart' in window) && document.pointerLockElement !== this.engine.container && !this.isInputLocked) {
        try {
          this.engine.container.requestPointerLock?.();
        } catch {
          // Pointer lock optional
        }
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.engine.container;
    });

    // Mouse drag turning & Canvas Interaction
    this.engine.container.addEventListener('mousedown', this.handleMouseDownBound);
    window.addEventListener('mousemove', this.handleMouseMoveBound);
    window.addEventListener('mouseup', this.handleMouseUpBound);
    this.engine.container.addEventListener('contextmenu', this.handleContextMenuBound);

    // Browser focus, tab switching & visibility safeguards
    window.addEventListener('blur', this.handleWindowBlurBound);
    document.addEventListener('visibilitychange', this.handleVisibilityChangeBound);
    window.addEventListener('focus', this.handleWindowFocusBound);
    window.addEventListener('pagehide', this.handlePageHideBound);
    window.addEventListener('pointercancel', this.handlePointerCancelBound);
  }

  // --- TOOL SWITCHING & VISUAL TOOL MESHES ---
  public setEquippedTool(tool: ToolType) {
    this.equippedTool = tool;
    this.cancelRod();

    while (this.handToolGroup.children.length > 0) {
      this.handToolGroup.remove(this.handToolGroup.children[0]);
    }

    if (tool === 'hands' || tool === 'none') {
      return;
    } else if (tool === 'stone_axe') {
      const handleMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
      const stoneMat = new THREE.MeshStandardMaterial({ color: '#71717a', roughness: 0.9, flatShading: true });
      const ropeMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.8 });

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.7, 5), handleMat);
      handle.position.y = 0.2;
      this.handToolGroup.add(handle);

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.06), stoneMat);
      blade.position.set(0.08, 0.45, 0);
      this.handToolGroup.add(blade);

      const binding = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.02, 4, 6), ropeMat);
      binding.position.set(0, 0.45, 0);
      binding.rotation.x = Math.PI / 2;
      this.handToolGroup.add(binding);
    } else if (tool === 'stone_pickaxe') {
      const handleMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
      const stoneMat = new THREE.MeshStandardMaterial({ color: '#576574', roughness: 0.9, flatShading: true });
      const ropeMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.8 });

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.75, 5), handleMat);
      handle.position.y = 0.2;
      this.handToolGroup.add(handle);

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), stoneMat);
      head.position.set(0, 0.48, 0);
      head.rotation.z = Math.PI / 2;
      this.handToolGroup.add(head);

      const binding = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.02, 4, 6), ropeMat);
      binding.position.set(0, 0.48, 0);
      this.handToolGroup.add(binding);
    } else if (tool === 'spear') {
      const shaftMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
      const tipMat = new THREE.MeshStandardMaterial({ color: '#71717a', roughness: 0.9 });

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.4, 5), shaftMat);
      shaft.position.y = 0.4;
      this.handToolGroup.add(shaft);

      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.25, 4), tipMat);
      tip.position.y = 1.15;
      this.handToolGroup.add(tip);
    } else if (tool === 'rock' || tool === 'stone') {
      const rockMesh = this.engine.createRockMesh(tool === 'stone' ? 0.2 : 0.26);
      rockMesh.position.set(0, 0.1, 0);
      this.handToolGroup.add(rockMesh);
    } else if (tool === 'palm_shell') {
      const shellMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8, side: THREE.DoubleSide });
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), shellMat);
      shell.rotation.x = Math.PI;
      shell.position.set(0, 0.1, 0);
      this.handToolGroup.add(shell);
    } else if (tool === 'live_fish_shell') {
      const shellMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8, side: THREE.DoubleSide });
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), shellMat);
      shell.rotation.x = Math.PI;
      shell.position.set(0, 0.1, 0);
      this.handToolGroup.add(shell);
      // Tiny swimming fish in shell
      const fishMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.3 });
      const miniFish = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 5), fishMat);
      miniFish.position.set(0, 0.12, 0);
      miniFish.rotation.x = Math.PI / 2;
      this.handToolGroup.add(miniFish);
    } else if (tool === 'fish_meat') {
      const meatMat = new THREE.MeshStandardMaterial({ color: '#f87171', roughness: 0.6 });
      const meatChunk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.14), meatMat);
      meatChunk.position.set(0, 0.1, 0);
      this.handToolGroup.add(meatChunk);
    } else if (tool === 'crab') {
      const crabMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.6 });
      const crab = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.15), crabMat);
      crab.position.set(0, 0.1, 0);
      this.handToolGroup.add(crab);
    } else if (tool === 'fruit') {
      const fruitMat = new THREE.MeshStandardMaterial({ color: '#8b5cf6', roughness: 0.4 });
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), fruitMat);
      fruit.position.set(0, 0.1, 0);
      this.handToolGroup.add(fruit);
    } else if (tool === 'crafting_table') {
      const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
      const miniTable = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.22), woodMat);
      miniTable.position.set(0, 0.15, 0);
      this.handToolGroup.add(miniTable);
    } else if (tool === 'simple_raft' || tool === 'raft_sail' || tool === 'raft_expansion') {
      const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
      const miniRaft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.35), woodMat);
      miniRaft.position.set(0, 0.15, 0);
      this.handToolGroup.add(miniRaft);
    } else if (tool === 'fish_trap') {
      const trapMat = new THREE.MeshStandardMaterial({ color: '#92400e', wireframe: true });
      const trap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 6, 1, true), trapMat);
      trap.position.set(0, 0.2, 0);
      this.handToolGroup.add(trap);
    } else if (tool === 'seed') {
      const seedMat = new THREE.MeshStandardMaterial({ color: '#713f12' });
      const seed = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), seedMat);
      seed.position.set(0, 0.1, 0);
      this.handToolGroup.add(seed);
    } else if (tool === 'wood_structure') {
      const paperMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.6 });
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6), paperMat);
      roll.position.set(0, 0.15, 0);
      roll.rotation.z = Math.PI / 4;
      this.handToolGroup.add(roll);
    } else if (tool === 'chum') {
      const chumMat = new THREE.MeshStandardMaterial({ color: '#be123c', roughness: 0.8 });
      const chumBucket = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.22, 6), chumMat);
      chumBucket.position.set(0, 0.1, 0);
      this.handToolGroup.add(chumBucket);
    } else if (tool === 'sea_grass' || tool === 'kelp') {
      const plantMat = new THREE.MeshStandardMaterial({ color: tool === 'kelp' ? '#3f6212' : '#15803d', roughness: 0.7 });
      const frond = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.02), plantMat);
      frond.position.set(0, 0.15, 0);
      frond.rotation.z = 0.2;
      this.handToolGroup.add(frond);
    }
  }

  // --- ACTIONS ---

  // 1. PRIMARY ACTION (Chop, Mine Rock, Board Raft, Grab Fish, Place Station/Raft, Harvest Plants, Release Chum)
  public triggerPrimaryAction() {
    const cameraDir = new THREE.Vector3();
    this.engine.camera.getWorldDirection(cameraDir);

    // Immediately face the action direction
    this.characterFacingYaw = this.yaw + Math.PI;

    // If piloting raft, click does not swing on foot
    if (this.pilotingRaft) {
      this.disembarkRaft();
      return;
    }

    // Release Live Fish from Palm Shell into water
    if (this.equippedTool === 'live_fish_shell') {
      const tossX = this.position.x + cameraDir.x * 1.5;
      const tossZ = this.position.z + cameraDir.z * 1.5;
      this.ecosystem.releaseLiveFish('clownfish', 20, tossX, tossZ);
      sound.playSplashWater();
      this.callbacks.onPickupItem('live_fish_shell', -1);
      this.callbacks.onPickupItem('palm_shell', 1);
      this.callbacks.onNotification('🐟 Released live fish safely back into the ocean! (Empty Palm Shell returned)');
      this.setEquippedTool('palm_shell');
      return;
    }

    // Chum Deployment (Toss chum into water to attract fish)
    if (this.equippedTool === 'chum') {
      const tossX = this.position.x + cameraDir.x * 2.0;
      const tossZ = this.position.z + cameraDir.z * 2.0;
      const tossY = Math.min(-0.2, this.position.y);
      this.engine.createChumScentCloud(tossX, tossY, tossZ, 30);
      sound.playSplashWater();
      this.callbacks.onPickupItem('chum', -1);
      this.callbacks.onNotification('🐟 Scent of Fish Chum released into the current! Nearby fish will swarm the area.');
      this.setEquippedTool('hands');
      return;
    }

    // Wood Structure Placement
    if (this.equippedTool === 'wood_structure') {
      this.placeCurrentStructure();
      return;
    }

    // Crafting Table Placement
    if (this.equippedTool === 'crafting_table') {
      const placeX = this.position.x + cameraDir.x * 2.2;
      const placeZ = this.position.z + cameraDir.z * 2.2;
      this.engine.placeCraftingTable(placeX, placeZ, this.yaw);
      sound.playWoodHit();
      this.callbacks.onPickupItem('crafting_table', -1);
      this.callbacks.onNotification('🔨 Sturdy Crafting Table placed! Use it to craft advanced tools.');
      this.setEquippedTool('hands');
      return;
    }

    // Simple Raft Placement
    if (this.equippedTool === 'simple_raft') {
      const placeX = this.position.x + cameraDir.x * 3.2;
      const placeZ = this.position.z + cameraDir.z * 3.2;
      const groundAtPos = this.engine.getTerrainHeight(placeX, placeZ);
      if (groundAtPos > 0.3) {
        this.callbacks.onNotification('Place the raft in the lagoon water!');
        return;
      }
      this.engine.placeRaft(placeX, placeZ, false, false);
      sound.playSplashWater();
      this.callbacks.onPickupItem('simple_raft', -1);
      this.callbacks.onNotification('⛵ Placed Simple Raft in the lagoon! Press E or Click to board.');
      this.setEquippedTool('hands');
      return;
    }

    // Raft Sail Attachment
    if (this.equippedTool === 'raft_sail') {
      const nearbyRaft = this.checkAimAtRaft();
      if (nearbyRaft && !nearbyRaft.hasSail) {
        this.engine.upgradeRaftSail(nearbyRaft);
        sound.playWoodHit();
        this.callbacks.onPickupItem('raft_sail', -1);
        this.callbacks.onNotification('⛵ Fitted Woven Palm Sail to Raft! Sailing speed increased.');
        this.setEquippedTool('hands');
        return;
      } else {
        this.callbacks.onNotification('Aim at a placed raft without a sail to attach it.');
      }
    }

    // Raft Expansion
    if (this.equippedTool === 'raft_expansion') {
      const nearbyRaft = this.checkAimAtRaft();
      if (nearbyRaft && !nearbyRaft.isExpanded) {
        this.engine.upgradeRaftExpansion(nearbyRaft);
        sound.playWoodHit();
        this.callbacks.onPickupItem('raft_expansion', -1);
        this.callbacks.onNotification('⛵ Expanded Raft Platform with wide timber outriggers!');
        this.setEquippedTool('hands');
        return;
      } else {
        this.callbacks.onNotification('Aim at a placed raft to expand its deck.');
      }
    }

    // Check if near placed raft to board
    const aimRaft = this.checkAimAtRaft();
    if (aimRaft && (this.equippedTool === 'hands' || this.equippedTool === 'none')) {
      this.boardRaft(aimRaft);
      return;
    }

    // Trigger swing animation
    this.isSwinging = true;
    this.swingProgress = 0;
    this.swingType = this.equippedTool === 'spear' ? 'thrust' : (this.equippedTool === 'stone_pickaxe' ? 'mine' : 'chop');

    // Check if near Shore Crab
    const crabHit = this.checkAimAtCrab();
    if (crabHit) {
      sound.playCrabCatch();
      this.ecosystem.catchCrabInstance(crabHit);
      this.callbacks.onPickupItem('crab', 1);
      this.callbacks.onNotification('🦀 Snatched a Shore Crab! (Can be used as bait or resource)');
      return;
    }

    // Check if aiming at a Placed Fish Trap
    const trapHit = this.checkAimAtTrap();
    if (trapHit) {
      // 1. If trap has caught fish -> Harvest caught fish!
      if (trapHit.caughtFish && trapHit.caughtFish.length > 0) {
        sound.playInstantCatchChime();
        const fishCount = trapHit.caughtFish.length;
        trapHit.caughtFish.forEach((trapped) => {
          const sp = FISH_SPECIES.find((s) => s.id === trapped.speciesId) || FISH_SPECIES[0];
          const dummyFish: any = {
            id: `${sp.id}_trap_${Date.now()}`,
            species: sp,
            sizeCm: trapped.sizeCm,
            x: trapHit.x,
            y: trapHit.y,
            z: trapHit.z
          };
          this.callbacks.onCatchFish(dummyFish, 'trap');
        });
        this.ecosystem.telemetry.playerCatches += fishCount;
        trapHit.caughtFish = [];
        this.engine.updateTrapVisuals(trapHit);
        this.callbacks.onNotification(`🧺 Emptied Fish Trap! Collected ${fishCount} fish into your catch log.`);
        return;
      }

      // 2. If holding Bait (Crab, Fruit, Scallop, Barnacle, Sea Grass, Kelp, Fish) -> Insert Bait into Trap
      if (
        this.equippedTool === 'crab' ||
        this.equippedTool === 'fruit' ||
        this.equippedTool === 'scallop' ||
        this.equippedTool === 'barnacle' ||
        this.equippedTool === 'sea_grass' ||
        this.equippedTool === 'kelp' ||
        this.equippedTool === 'fish'
      ) {
        const baitType = this.equippedTool as BaitType;
        trapHit.bait = baitType;
        this.engine.updateTrapVisuals(trapHit);
        sound.playSplashWater();
        this.callbacks.onPickupItem(this.equippedTool, -1);
        this.callbacks.onNotification(`🧺 Baited Fish Trap with ${baitType.replace('_', ' ').toUpperCase()}! Nearby fish will be drawn to it.`);
        this.setEquippedTool('hands');
        return;
      }

      // 3. If hands and trap is empty -> Pick up trap
      if ((this.equippedTool === 'hands' || this.equippedTool === 'none') && !trapHit.bait) {
        sound.playGatherItem();
        this.engine.scene.remove(trapHit.group);
        const trapIdx = this.engine.worldObjects.placedTraps.indexOf(trapHit);
        if (trapIdx !== -1) {
          this.engine.worldObjects.placedTraps.splice(trapIdx, 1);
        }
        this.callbacks.onPickupItem('fish_trap', 1);
        this.callbacks.onNotification('🧺 Picked up Fish Trap.');
        return;
      }

      if (trapHit.bait) {
        this.callbacks.onNotification(`🧺 Fish Trap currently baited with ${trapHit.bait.toUpperCase()} (0/${trapHit.maxCapacity || 5} fish caught).`);
        return;
      }
    }

    // Check if aiming at a Standing Palm Tree
    const treeHit = this.checkAimAtTree();
    if (treeHit) {
      if (this.equippedTool === 'hands' || this.equippedTool === 'none') {
        sound.playPunchDull();
        this.callbacks.onNotification("Bare hands can't cut thick palm trees! Use a stone axe or batter with a rock.");
        return;
      } else if (this.equippedTool === 'rock') {
        sound.playWoodHit();
        treeHit.health -= 1;
        this.callbacks.onNotification(`Battering palm tree with rock... (${treeHit.health} hits remaining)`);
        if (treeHit.health <= 0) this.fellTree(treeHit);
        return;
      } else if (this.equippedTool === 'stone_axe') {
        sound.playAxeChop();
        treeHit.health -= 2;
        this.callbacks.onNotification(`Chopping palm tree with axe! (${Math.max(0, treeHit.health)} hits remaining)`);
        if (treeHit.health <= 0) this.fellTree(treeHit);
        return;
      }
    }

    // Check if aiming at a Fallen Log
    const logHit = this.checkAimAtFallenLog();
    if (logHit) {
      if (this.equippedTool === 'stone_axe' || this.equippedTool === 'stone_pickaxe' || this.equippedTool === 'rock') {
        if (this.equippedTool === 'stone_axe') {
          sound.playAxeChop();
        } else {
          sound.playWoodHit();
        }
        logHit.woodRemaining -= 1;
        this.callbacks.onPickupItem('wood', 1);
        this.callbacks.onNotification(`🪵 Split log! Gathered 1 Palm Wood (${logHit.woodRemaining} remaining in log).`);

        if (logHit.woodRemaining <= 0) {
          this.engine.scene.remove(logHit.group);
          const idx = this.engine.worldObjects.fallenLogs.indexOf(logHit);
          if (idx !== -1) {
            this.engine.worldObjects.fallenLogs.splice(idx, 1);
          }
        }
        return;
      }
    }

    // Check if aiming at Large Boulder or Ground Rock (Mining / Smashing into Stone)
    const rockHit = this.checkAimAtGroundRock();
    if (rockHit && !rockHit.isPicked) {
      if (this.equippedTool === 'stone_pickaxe') {
        sound.playPickaxeStrike();
        this.engine.createRockHitSparks(rockHit.x, rockHit.mesh.position.y + 0.3, rockHit.z);
        rockHit.health -= 50;

        if (rockHit.health <= 0) {
          rockHit.isPicked = true;
          this.engine.scene.remove(rockHit.mesh);
          // Drop 2-3 stone items
          this.engine.spawnGroundItem('stone', rockHit.x + 0.4, rockHit.z, true);
          this.engine.spawnGroundItem('stone', rockHit.x - 0.4, rockHit.z + 0.3, true);
          if (rockHit.isLargeBoulder) {
            this.engine.spawnGroundItem('stone', rockHit.x, rockHit.z - 0.5, true);
          }
          this.callbacks.onNotification('💥 Smashed Boulder into workable Stone chunks!');
        } else {
          this.callbacks.onNotification(`Mining boulder with Pickaxe... (${rockHit.health}% health)`);
        }
        return;
      } else if (this.equippedTool === 'stone_axe') {
        sound.playWoodHit();
        this.engine.createRockHitSparks(rockHit.x, rockHit.mesh.position.y + 0.3, rockHit.z);
        rockHit.health -= 25;

        if (rockHit.health <= 0) {
          rockHit.isPicked = true;
          this.engine.scene.remove(rockHit.mesh);
          this.engine.spawnGroundItem('stone', rockHit.x + 0.3, rockHit.z, true);
          this.engine.spawnGroundItem('stone', rockHit.x - 0.3, rockHit.z, true);
          this.callbacks.onNotification('🪨 Cracked rock into Stone chunks!');
        } else {
          this.callbacks.onNotification(`Chipping rock with Axe... (${rockHit.health}% health)`);
        }
        return;
      } else if (!rockHit.isLargeBoulder) {
        sound.playGatherItem();
        rockHit.isPicked = true;
        this.engine.scene.remove(rockHit.mesh);
        this.callbacks.onPickupItem('rock', 1);
        this.callbacks.onNotification('🪨 Picked up a Large Usable Rock!');
        return;
      }
    }

    // Check if aiming at a Plant Bush (Harvest Fiber)
    const bushHit = this.checkAimAtBush();
    if (bushHit && bushHit.hasFiber) {
      sound.playGatherItem();
      bushHit.hasFiber = false;
      bushHit.group.scale.set(0.6, 0.6, 0.6);
      this.callbacks.onPickupItem('fiber', 2);
      this.callbacks.onNotification('🌿 Harvested 2 Palm Fiber!');
      return;
    }

    // Check if aiming at Sea Grass Bed (Harvest Sea Grass)
    const seaGrassHit = this.checkAimAtSeaGrass();
    if (seaGrassHit && seaGrassHit.hasGrass) {
      const harvested = this.engine.harvestSeaGrassBed(seaGrassHit);
      if (harvested) {
        sound.playGatherItem();
        this.callbacks.onPickupItem('sea_grass', 1);
        this.callbacks.onNotification('🌿 Harvested Fresh Sea Grass! Can be used as bait or crafted into chum.');
        return;
      }
    }

    // Check if aiming at Kelp Stalk (Harvest Kelp)
    const kelpHit = this.checkAimAtKelp();
    if (kelpHit && kelpHit.hasKelp) {
      const harvested = this.engine.harvestKelpStalk(kelpHit);
      if (harvested) {
        sound.playGatherItem();
        this.callbacks.onPickupItem('kelp', 1);
        this.callbacks.onNotification('🌿 Harvested Kelp Fronds! Rich in nutrients and strong marine fiber.');
        return;
      }
    }

    // Check if aiming at Scallop Bed (Collect Scallop)
    const scallopHit = this.checkAimAtScallop();
    if (scallopHit && !scallopHit.isCollected) {
      const collected = this.engine.collectScallop(scallopHit);
      if (collected) {
        sound.playGatherItem();
        this.callbacks.onPickupItem('scallop', 1);
        this.callbacks.onNotification('🦪 Collected Live Scallop! High-value shellfish bait.');
        return;
      }
    }

    // Check if aiming at Barnacle Cluster (Harvest Barnacles)
    const barnacleHit = this.checkAimAtBarnacle();
    if (barnacleHit && !barnacleHit.isDepleted) {
      const harvested = this.engine.harvestBarnacle(barnacleHit);
      if (harvested) {
        sound.playWoodHit();
        this.callbacks.onPickupItem('barnacle', 1);
        this.callbacks.onNotification('🐚 Harvested Sharp Barnacles! Excellent bait for reef fish & crustaceans.');
        return;
      }
    }

    // Plant Coconut Seed
    if (this.equippedTool === 'seed') {
      const planted = this.engine.plantSeed(this.position.x + cameraDir.x * 2.0, this.position.z + cameraDir.z * 2.0);
      if (planted) {
        sound.playPlantSeed();
        this.callbacks.onNotification('🥥 Planted a Coconut Palm seed in the sand!');
        this.callbacks.onPickupItem('seed', -1);
      }
      return;
    }

    // Place Fish Trap
    if (this.equippedTool === 'fish_trap' && this.isWading) {
      this.engine.placeFishTrap(this.position.x, this.position.z);
      sound.playSplashWater();
      this.callbacks.onNotification('🧺 Placed Fish Trap on lagoon floor!');
      this.callbacks.onPickupItem('fish_trap', -1);
      return;
    }

    // Active Fishing in water
    if (this.isWading || this.isSwimming || this.waterDepth > 0 || this.pilotingRaft) {
      this.attemptActiveFishing(cameraDir);
    }
  }

  // --- RAFT BOARDING & PILOTING ---
  public boardRaft(raft: PlacedRaft) {
    this.pilotingRaft = raft;
    sound.playRaftBoard();
    this.callbacks.onNotification('⛵ Boarded Raft! WASD to steer across the lagoon. Press E or Space to disembark.');
    if (this.callbacks.onRaftBoardStateChange) {
      this.callbacks.onRaftBoardStateChange(true);
    }
  }

  public disembarkRaft() {
    if (!this.pilotingRaft) return;
    this.pilotingRaft = null;
    sound.playSplashWater();
    this.callbacks.onNotification('Disembarked from raft.');
    if (this.callbacks.onRaftBoardStateChange) {
      this.callbacks.onRaftBoardStateChange(false);
    }
  }

  private checkAimAtRaft(): PlacedRaft | null {
    for (const raft of this.engine.worldObjects.placedRafts) {
      const dx = raft.x - this.position.x;
      const dz = raft.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3.2) {
        return raft;
      }
    }
    return null;
  }

  // 2. THROW ACTION (Right click / [R])
  public triggerThrowAction() {
    if (this.isInputLocked) return;
    const now = Date.now();
    if (now - this.lastThrowTimestamp < 450 || this.isThrowingState) {
      return; // Debounce throw actions
    }

    const cameraDir = new THREE.Vector3();
    this.engine.camera.getWorldDirection(cameraDir);

    // Instant turning alignment towards throw target
    this.characterFacingYaw = this.yaw + Math.PI;

    if (this.equippedTool === 'spear') {
      const currentCount = this.callbacks.getAuthoritativeItemCount ? this.callbacks.getAuthoritativeItemCount('spear') : 0;
      if (currentCount <= 0) {
        this.setEquippedTool('hands');
        this.callbacks.onToolChanged?.('hands');
        this.callbacks.onNotification('No spears in inventory to throw!');
        return;
      }

      this.lastThrowTimestamp = now;
      this.isThrowingState = true;

      // Authoritative consumption: decrement inventory FIRST before projectile creation
      let consumed = false;
      if (this.callbacks.onConsumeAuthoritativeItem) {
        consumed = this.callbacks.onConsumeAuthoritativeItem('spear');
      } else {
        this.callbacks.onPickupItem('spear', -1);
        consumed = true;
      }

      if (consumed) {
        sound.playThrowWhoosh();
        const origin = new THREE.Vector3().copy(this.position).add(new THREE.Vector3(0, 0.4, 0));
        const velocity = new THREE.Vector3().copy(cameraDir).multiplyScalar(18).add(new THREE.Vector3(0, 2.5, 0));
        this.engine.spawnThrownSpear(origin, velocity);
        this.callbacks.onNotification('🔱 Threw Stone Spear!');

        const remaining = this.callbacks.getAuthoritativeItemCount ? this.callbacks.getAuthoritativeItemCount('spear') : 0;
        if (remaining <= 0) {
          this.setEquippedTool('hands');
          this.callbacks.onToolChanged?.('hands');
        }
      } else {
        this.setEquippedTool('hands');
        this.callbacks.onToolChanged?.('hands');
      }
      setTimeout(() => { this.isThrowingState = false; }, 350);

    } else if (this.equippedTool === 'rock' || this.equippedTool === 'stone') {
      const itemKey = this.equippedTool;
      const currentCount = this.callbacks.getAuthoritativeItemCount ? this.callbacks.getAuthoritativeItemCount(itemKey) : 0;
      if (currentCount <= 0) {
        this.setEquippedTool('hands');
        this.callbacks.onToolChanged?.('hands');
        this.callbacks.onNotification(`No ${itemKey === 'stone' ? 'stone chunks' : 'rocks'} remaining to throw!`);
        return;
      }

      this.lastThrowTimestamp = now;
      this.isThrowingState = true;

      // Authoritative consumption: decrement inventory FIRST before projectile creation
      let consumed = false;
      if (this.callbacks.onConsumeAuthoritativeItem) {
        consumed = this.callbacks.onConsumeAuthoritativeItem(itemKey);
      } else {
        this.callbacks.onPickupItem(itemKey, -1);
        consumed = true;
      }

      if (consumed) {
        sound.playThrowWhoosh();
        const origin = new THREE.Vector3().copy(this.position).add(new THREE.Vector3(0, 0.3, 0));
        const velocity = new THREE.Vector3().copy(cameraDir).multiplyScalar(14).add(new THREE.Vector3(0, 2.0, 0));
        this.engine.spawnThrownRock(origin, velocity);
        this.callbacks.onNotification(itemKey === 'stone' ? '🪨 Threw Stone Chunk!' : '🪨 Threw Rock!');

        // If that was the last rock/stone, unequip immediately and inform UI
        const remaining = this.callbacks.getAuthoritativeItemCount ? this.callbacks.getAuthoritativeItemCount(itemKey) : 0;
        if (remaining <= 0) {
          this.setEquippedTool('hands');
          this.callbacks.onToolChanged?.('hands');
        }
      } else {
        this.setEquippedTool('hands');
        this.callbacks.onToolChanged?.('hands');
      }
      setTimeout(() => { this.isThrowingState = false; }, 350);
    }
  }

  // --- FORGIVING FISH GRABBING & SPEAR FISHING ---
  private attemptActiveFishing(cameraDir: THREE.Vector3) {
    const reachDistance = this.equippedTool === 'spear' ? 3.6 : 2.4;
    const handOrigin = new THREE.Vector3()
      .copy(this.position)
      .add(cameraDir.clone().multiplyScalar(1.0))
      .setY(this.position.y - 0.2);

    let closestFish: FishInstance | null = null;
    let minDistance = reachDistance;

    this.ecosystem.fishList.forEach((fish) => {
      if (fish.isTrapped) return;
      const dx = fish.x - handOrigin.x;
      const dy = fish.y - handOrigin.y;
      const dz = fish.z - handOrigin.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < minDistance) {
        minDistance = dist;
        closestFish = fish;
      }
    });

    if (closestFish) {
      const fish = closestFish as FishInstance;

      // Realistic Handling Limits:
      // Bare hands cannot grab large predators or sharks (>40cm)
      if ((this.equippedTool === 'hands' || this.equippedTool === 'none') && (fish.sizeCm > 40 || fish.species.isLargePredator || fish.species.role === 'apex_predator' || fish.species.shape === 'shark' || fish.species.shape === 'hammerhead')) {
        sound.playSplashWater();
        this.ecosystem.spookFishInRadius(this.position.x, this.position.z, 4.0);
        this.callbacks.onNotification(`⚠️ The ${fish.species.name} is too large and dangerous to grab bare-handed! Use a Spear.`);
        return;
      }

      // Palm Shell container can only hold small live fish (<= 25cm)
      if (this.equippedTool === 'palm_shell' && (fish.sizeCm > 25 || fish.species.isLargePredator || fish.species.role === 'apex_predator')) {
        sound.playSplashWater();
        this.ecosystem.spookFishInRadius(this.position.x, this.position.z, 3.5);
        this.callbacks.onNotification(`⚠️ The ${fish.species.name} (${fish.sizeCm}cm) is too large to fit in a Palm Shell!`);
        return;
      }

      // Forgiving catch probability
      let isSuccess = false;

      if (minDistance <= 1.6) {
        // Very close -> 100% Guaranteed catch!
        isSuccess = true;
      } else if (minDistance <= reachDistance) {
        if (this.isSneaking || this.isDiving || fish.species.handCatchDifficulty === 'very_easy' || fish.species.handCatchDifficulty === 'easy') {
          isSuccess = true;
        } else if (fish.species.handCatchDifficulty === 'moderate') {
          isSuccess = Math.random() < 0.90;
        } else {
          isSuccess = Math.random() < 0.80;
        }
      }

      if (isSuccess) {
        sound.playInstantCatchChime();
        const method: CatchMethod = this.equippedTool === 'spear' ? 'spear' : (this.equippedTool === 'palm_shell' ? 'palm_shell' : 'hands');

        this.callbacks.onCatchFish(fish, method);
        this.ecosystem.catchFishInstance(fish);
        this.ecosystem.telemetry.playerCatches++;

        if (this.equippedTool === 'palm_shell') {
          this.callbacks.onPickupItem('palm_shell', -1);
          this.callbacks.onPickupItem('live_fish_shell', 1);
          this.setEquippedTool('live_fish_shell');
          this.callbacks.onNotification(`🐠 Captured live ${fish.species.name} in Palm Shell container!`);
        } else {
          this.callbacks.onNotification(`✨ Caught ${fish.species.name}! (${fish.sizeCm}cm)`);
        }
      } else {
        sound.playSplashWater();
        this.ecosystem.spookFishInRadius(this.position.x, this.position.z, 3.5);
        this.callbacks.onNotification(`💨 The ${fish.species.name} darted past! Step a little closer to grab.`);
      }
    } else {
      sound.playSplashWater();
      this.ecosystem.spookFishInRadius(this.position.x, this.position.z, 2.5);
    }
  }

  // --- CASTING & ROD MINIGAME ---
  private castRod() {
    const cameraDir = new THREE.Vector3();
    this.engine.camera.getWorldDirection(cameraDir);

    const castDistance = 8.5;
    this.rodBobberPos.set(
      this.position.x + cameraDir.x * castDistance,
      0.05,
      this.position.z + cameraDir.z * castDistance
    );

    const groundAtBobber = this.engine.getTerrainHeight(this.rodBobberPos.x, this.rodBobberPos.z);
    if (groundAtBobber >= 0) {
      this.callbacks.onNotification('Cast the bobber into the lagoon water!');
      return;
    }

    sound.playCastWhoosh();
    sound.playSplashWater();

    if (!this.rodBobberMesh) {
      const bobberMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.2 });
      this.rodBobberMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), bobberMat);
      this.engine.scene.add(this.rodBobberMesh);
    }
    this.rodBobberMesh.position.copy(this.rodBobberPos);
    this.rodBobberMesh.visible = true;

    this.rodState = 'cast';
    this.biteTimer = 3.0 + Math.random() * 4.0;
    this.tension = 50;
    this.callbacks.onRodStateChange('cast', this.tension);
    this.callbacks.onNotification('🎣 Bobber cast... Waiting for a bite!');
  }

  private cancelRod() {
    this.rodState = 'idle';
    if (this.rodBobberMesh) this.rodBobberMesh.visible = false;
    if (this.rodLineMesh) this.rodLineMesh.visible = false;
    this.callbacks.onRodStateChange('idle', 50);
  }

  // --- DETECTION HELPERS ---
  private checkAimAtTree() {
    for (const tree of this.engine.worldObjects.palmTrees) {
      if (tree.isChopped) continue;
      const dx = tree.x - this.position.x;
      const dz = tree.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3.2) return tree;
    }
    return null;
  }

  private checkAimAtFallenLog() {
    for (const log of this.engine.worldObjects.fallenLogs) {
      if (log.woodRemaining <= 0) continue;
      const dx = log.x - this.position.x;
      const dz = log.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3.0) return log;
    }
    return null;
  }

  private checkAimAtCrab() {
    for (const crab of this.ecosystem.crabs) {
      const dx = crab.x - this.position.x;
      const dz = crab.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2.4) return crab;
    }
    return null;
  }

  private checkAimAtTrap(): PlacedTrap | null {
    if (!this.engine.worldObjects.placedTraps) return null;
    for (const trap of this.engine.worldObjects.placedTraps) {
      const dx = trap.x - this.position.x;
      const dz = trap.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3.2) return trap;
    }
    return null;
  }

  private checkAimAtBush() {
    for (const bush of this.engine.worldObjects.bushes) {
      const dx = bush.x - this.position.x;
      const dz = bush.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2.8) return bush;
    }
    return null;
  }

  private checkAimAtSeaGrass() {
    if (!this.engine.worldObjects.seaGrassBeds) return null;
    for (const bed of this.engine.worldObjects.seaGrassBeds) {
      if (!bed.hasGrass) continue;
      const dx = bed.x - this.position.x;
      const dy = bed.y - this.position.y;
      const dz = bed.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 3.2) return bed;
    }
    return null;
  }

  private checkAimAtKelp() {
    if (!this.engine.worldObjects.kelpForest) return null;
    for (const stalk of this.engine.worldObjects.kelpForest) {
      if (!stalk.hasKelp) continue;
      const dx = stalk.x - this.position.x;
      const dz = stalk.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3.6) return stalk;
    }
    return null;
  }

  private checkAimAtScallop() {
    if (!this.engine.worldObjects.scallopBeds) return null;
    for (const scallop of this.engine.worldObjects.scallopBeds) {
      if (scallop.isCollected) continue;
      const dx = scallop.x - this.position.x;
      const dy = scallop.y - this.position.y;
      const dz = scallop.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 3.2) return scallop;
    }
    return null;
  }

  private checkAimAtBarnacle() {
    if (!this.engine.worldObjects.barnacleClusters) return null;
    for (const cluster of this.engine.worldObjects.barnacleClusters) {
      if (cluster.isDepleted) continue;
      const dx = cluster.x - this.position.x;
      const dy = cluster.y - this.position.y;
      const dz = cluster.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 3.2) return cluster;
    }
    return null;
  }

  private checkAimAtGroundRock() {
    for (const rock of this.engine.worldObjects.groundRocks) {
      if (rock.isPicked) continue;
      const dx = rock.x - this.position.x;
      const dz = rock.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3.2) return rock;
    }
    return null;
  }

  private fellTree(tree: { group: THREE.Group; x: number; z: number; health: number; initialY: number; isChopped: boolean }) {
    tree.isChopped = true;
    sound.playTreeFall();

    const toppleAngle = Math.random() * Math.PI * 2;
    const startTime = Date.now();
    const animateTopple = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed < 1.0) {
        tree.group.rotation.z = (elapsed / 1.0) * (Math.PI / 2);
        requestAnimationFrame(animateTopple);
      } else {
        this.engine.scene.remove(tree.group);
        this.engine.spawnFallenLog(tree.x, tree.z, toppleAngle);
      }
    };
    animateTopple();

    this.engine.spawnGroundItem('wood', tree.x + 0.8, tree.z, true);
    this.engine.spawnGroundItem('wood', tree.x - 0.8, tree.z + 0.5, true);
    this.engine.spawnGroundItem('fiber', tree.x + 0.3, tree.z - 0.7, true);
    this.engine.spawnGroundItem('seed', tree.x, tree.z + 1.0, true);

    this.callbacks.onNotification('🌴 Palm Tree felled! Physical log, wood, and coconut seeds dropped.');
  }

  // --- STRUCTURE PLACEMENT ---
  private cycleStructureType() {
    const types: StructureType[] = ['foundation', 'wall', 'pillar', 'roof'];
    const currIdx = types.indexOf(this.selectedStructureType);
    this.selectedStructureType = types[(currIdx + 1) % types.length];
    this.callbacks.onNotification(`Building mode: ${this.selectedStructureType.toUpperCase()}`);
  }

  private placeCurrentStructure() {
    const cameraDir = new THREE.Vector3();
    this.engine.camera.getWorldDirection(cameraDir);

    const placeX = Math.round((this.position.x + cameraDir.x * 2.8) / 1.2) * 1.2;
    const placeZ = Math.round((this.position.z + cameraDir.z * 2.8) / 1.2) * 1.2;
    const placeY = this.engine.getTerrainHeight(placeX, placeZ);

    sound.playPlaceStructure();
    this.engine.placeStructure(this.selectedStructureType, placeX, placeY, placeZ, this.yaw);
    this.callbacks.onPlaceStructure(this.selectedStructureType);
    this.callbacks.onPickupItem('wood_structure', -1);
    this.callbacks.onNotification(`🛖 Placed ${this.selectedStructureType.toUpperCase()}!`);
  }

  // --- MAIN UPDATE LOOP ---
  public update(delta: number) {
    const now = Date.now();

    // 0. Continuous Safety Check: If document has lost focus, is hidden, or input is locked, force reset all inputs
    if (typeof document !== 'undefined' && (!document.hasFocus() || document.hidden || this.isInputLocked)) {
      this.resetAllInputs();
    }

    // 1. If Piloting Raft: Move Raft with WASD or Touch
    if (this.pilotingRaft) {
      const raft = this.pilotingRaft;
      let turnInput = 0;
      let thrustInput = 0;

      if (!this.isInputLocked) {
        if (this.keys.left || this.keys.turnLeft || this.touchMove.x < -0.2) turnInput += 1.8;
        if (this.keys.right || this.keys.turnRight || this.touchMove.x > 0.2) turnInput -= 1.8;
        if (this.keys.forward || this.touchMove.z < -0.2) thrustInput += 1.0;
        if (this.keys.backward || this.touchMove.z > 0.2) thrustInput -= 0.6;
      }

      raft.rotY += turnInput * delta;
      raft.group.rotation.y = raft.rotY;

      const baseSpeed = raft.hasSail ? 6.5 : 3.8;
      const targetSpeed = thrustInput * baseSpeed;
      // Smooth deceleration to 0 when thrustInput is 0 (prevents runaway drift)
      raft.speed += (targetSpeed - raft.speed) * delta * 2.5;

      const forwardX = -Math.sin(raft.rotY);
      const forwardZ = -Math.cos(raft.rotY);

      raft.x += forwardX * raft.speed * delta;
      raft.z += forwardZ * raft.speed * delta;

      // Keep raft within lagoon
      const raftGroundY = this.engine.getTerrainHeight(raft.x, raft.z);
      if (raftGroundY > 0.0) {
        raft.x -= forwardX * raft.speed * delta * 1.2;
        raft.z -= forwardZ * raft.speed * delta * 1.2;
        raft.speed = 0;
      }

      const raftTerrainY = this.engine.getTerrainHeight(raft.x, raft.z);
      const bob = Math.sin(now * 0.0018 + raft.x * 0.2 + raft.z * 0.2) * 0.035;
      const floatingY = Math.max(0.06, raftTerrainY + 0.12) + bob;
      raft.group.position.set(raft.x, floatingY, raft.z);

      // Pin player position onto raft deck
      this.position.set(raft.x, floatingY + 0.65, raft.z);
      this.yaw = raft.rotY;
      this.characterFacingYaw = raft.rotY;
      this.velocity.set(0, 0, 0);

      this.callbacks.onWaterStateChange(true, 1.5, false, false, 100);
      this.updateCharacterVisuals(delta, new THREE.Vector3(forwardX * raft.speed, 0, forwardZ * raft.speed));
      return;
    }

    // Keyboard manual camera rotation helpers (Q and E if not piloting)
    if (!this.isInputLocked) {
      if (this.keys.turnLeft) this.yaw += 2.4 * delta;
      if (this.keys.turnRight) this.yaw -= 2.4 * delta;
    }

    // 2. Camera-Relative Movement Vector
    const moveVector = new THREE.Vector3();
    if (!this.isInputLocked) {
      if (this.keys.forward) moveVector.z -= 1;
      if (this.keys.backward) moveVector.z += 1;
      if (this.keys.left) moveVector.x -= 1;
      if (this.keys.right) moveVector.x += 1;

      // Virtual joystick touch inputs
      if (Math.abs(this.touchMove.x) > 0.04 || Math.abs(this.touchMove.z) > 0.04) {
        moveVector.x += this.touchMove.x;
        moveVector.z += this.touchMove.z;
      }
    }

    // Terrain & Water check (with raft deck standing support)
    const terrainHeight = this.engine.getTerrainHeight(this.position.x, this.position.z);
    let effectiveGroundHeight = terrainHeight;
    let isStandingOnRaftDeck = false;

    // Check if player is standing on any placed raft deck
    for (const raft of this.engine.worldObjects.placedRafts) {
      const dx = this.position.x - raft.x;
      const dz = this.position.z - raft.z;
      const deckRadius = raft.isExpanded ? 2.6 : 1.7;
      if (dx * dx + dz * dz < deckRadius * deckRadius) {
        const deckHeight = raft.group.position.y + 0.16;
        if (deckHeight > effectiveGroundHeight) {
          effectiveGroundHeight = deckHeight;
          isStandingOnRaftDeck = true;
        }
      }
    }

    const seaLevel = 0.0;
    this.waterDepth = isStandingOnRaftDeck ? 0 : Math.max(0, seaLevel - terrainHeight);
    this.isWading = !isStandingOnRaftDeck && this.waterDepth > 0.15;
    this.isSwimming = !isStandingOnRaftDeck && this.waterDepth > 1.2;

    const isDiveHeld = (this.keys.sneak || this.keys.dive || this.touchDive) && !this.isInputLocked;
    const isAscendHeld = (this.keys.jump || this.keys.ascend || this.touchAscend) && !this.isInputLocked;

    if (this.isSwimming && (isDiveHeld || this.position.y < -0.2)) {
      this.isDiving = true;
    } else {
      this.isDiving = false;
    }

    if (this.isDiving) {
      if (!this.wasDivingLastFrame) sound.playDiveSubmerge();
      this.airLevel = Math.max(0, this.airLevel - 5.5 * delta);

      if (this.airLevel < 25 && now - this.lastAirWarningTime > 2500) {
        sound.playLowAirWarning();
        this.lastAirWarningTime = now;
      }

      if (this.airLevel <= 0) {
        this.applyDamage(8.0 * delta, 'Out of air');
      }
    } else {
      if (this.wasDivingLastFrame) sound.playSurfaceGasp();
      this.airLevel = Math.min(100, this.airLevel + 40 * delta);
    }
    this.wasDivingLastFrame = this.isDiving;

    // Gradual health regeneration when safe (not drowning, not recently damaged)
    this.timeSinceLastDamage += delta;
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - delta);
    }
    if (!this.isDead && this.health < this.maxHealth && this.timeSinceLastDamage > 5.0 && this.airLevel > 35) {
      this.health = Math.min(this.maxHealth, this.health + 3.0 * delta);
      this.callbacks.onHealthChange?.(this.health, this.maxHealth, false);
    }

    this.callbacks.onWaterStateChange(this.isWading, this.waterDepth, this.isSwimming, this.isDiving, this.airLevel);

    let worldMove = new THREE.Vector3();
    if (moveVector.lengthSq() > 0 && !this.isInputLocked) {
      const inputMagnitude = Math.min(1.0, moveVector.length());
      moveVector.normalize();
      // Rotate input by camera yaw so W is always camera-forward and A/D strafes relative to camera
      worldMove = moveVector.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      let speed = 4.2;
      const isSprinting = this.keys.sprint || this.touchMove.isSprinting;
      if (this.isSneaking && !this.isSwimming) {
        speed = 2.0;
      } else if (isSprinting) {
        speed = 7.0;
      }

      if (this.isSwimming) {
        speed = 3.6;
        if (now - this.lastSwimStrokeTime > 850) {
          sound.playSwimStroke();
          this.lastSwimStrokeTime = now;
        }
      } else if (this.isWading) {
        speed *= 0.68;
      }

      this.velocity.x = worldMove.x * speed * inputMagnitude;
      this.velocity.z = worldMove.z * speed * inputMagnitude;

      // Immediate, crisp turning authority with responsive visual alignment
      const targetFacing = Math.atan2(worldMove.x, worldMove.z) + Math.PI;
      let diff = (targetFacing - this.characterFacingYaw) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      const turnSpeed = 26.0;
      this.characterFacingYaw += diff * Math.min(1.0, turnSpeed * delta);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;

      // When standing still or aiming, smoothly and responsively turn character to face camera aim
      const cameraFacing = this.yaw + Math.PI;
      let idleDiff = (cameraFacing - this.characterFacingYaw) % (Math.PI * 2);
      if (idleDiff < -Math.PI) idleDiff += Math.PI * 2;
      if (idleDiff > Math.PI) idleDiff -= Math.PI * 2;
      if (Math.abs(idleDiff) > 0.8) {
        const turnSpeed = 14.0;
        this.characterFacingYaw += Math.sign(idleDiff) * (Math.abs(idleDiff) - 0.7) * Math.min(1.0, turnSpeed * delta);
      }
    }

    if (this.isSwimming) {
      // True Free Diving: Pitch controls camera view ONLY, not vertical swimming!
      if (isDiveHeld) {
        this.velocity.y = -2.8;
      } else if (isAscendHeld) {
        this.velocity.y = 3.0;
      } else {
        // Neutral Buoyancy: retain current depth cleanly underwater!
        if (this.position.y < -0.15) {
          this.velocity.y *= Math.pow(0.04, delta * 4.0);
          if (Math.abs(this.velocity.y) < 0.02) this.velocity.y = 0;
        } else {
          // At surface: comfortably bob at sea level
          const targetSwimY = 0.05;
          this.velocity.y = (targetSwimY - this.position.y) * 4.0;
        }
      }
    } else {
      this.velocity.y -= 15 * delta;
    }

    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // Prevent swimming above water surface
    if (this.isSwimming && this.position.y > 0.08) {
      this.position.y = 0.08;
    }

    const minHeightFromGround = this.isDiving ? 0.35 : (this.isSneaking ? 0.9 : 1.6);
    if (this.position.y <= effectiveGroundHeight + minHeightFromGround) {
      if (!this.isSwimming && !this.isGrounded && this.velocity.y < -12.5) {
        const fallSpeed = Math.abs(this.velocity.y);
        const fallDmg = Math.min(50, Math.round((fallSpeed - 11.5) * 5));
        if (fallDmg >= 10) {
          this.applyDamage(fallDmg, 'High fall');
        }
      }
      this.position.y = effectiveGroundHeight + minHeightFromGround;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Boundary distance check for expanded ocean (Radius 145m)
    const distFromIslandCenter = Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z);
    this.callbacks.onBoundaryWarning(distFromIslandCenter > 145);

    const projHit = this.ecosystem.checkProjectileHits(this.engine.worldObjects.projectiles);
    if (projHit.caughtFish) {
      sound.playInstantCatchChime();
      this.callbacks.onCatchFish(projHit.caughtFish, projHit.method);
      this.ecosystem.catchFishInstance(projHit.caughtFish);
      this.ecosystem.telemetry.playerCatches++;
      this.callbacks.onNotification(`✨ Caught ${projHit.caughtFish.species.name}! (${projHit.caughtFish.sizeCm}cm)`);
    }

    // Pick up loose ground items
    for (let i = this.engine.worldObjects.groundItems.length - 1; i >= 0; i--) {
      const item = this.engine.worldObjects.groundItems[i];
      const dx = item.x - this.position.x;
      const dz = item.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.8) {
        sound.playGatherItem();
        this.callbacks.onPickupItem(item.type, 1);
        this.engine.scene.remove(item.group);
        this.engine.worldObjects.groundItems.splice(i, 1);
        this.callbacks.onNotification(`Picked up ${item.type.toUpperCase()}`);
      }
    }

    // Recover nearby dropped supplies containers (lost knapsack / marine buoy)
    for (let i = this.engine.worldObjects.droppedLootContainers.length - 1; i >= 0; i--) {
      const container = this.engine.worldObjects.droppedLootContainers[i];
      const dx = container.x - this.position.x;
      const dz = container.z - this.position.z;
      const dy = Math.abs(container.y - this.position.y);
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2.5 && dy < 3.2) {
        this.recoverDroppedSupplies(container);
        break;
      }
    }

    // Update Fishing Rod
    this.updateRodMinigame(delta);

    // Update Structure Ghost Preview
    if (this.equippedTool === 'wood_structure') {
      const cameraDir = new THREE.Vector3();
      this.engine.camera.getWorldDirection(cameraDir);
      const placeX = Math.round((this.position.x + cameraDir.x * 2.8) / 1.2) * 1.2;
      const placeZ = Math.round((this.position.z + cameraDir.z * 2.8) / 1.2) * 1.2;
      const placeY = this.engine.getTerrainHeight(placeX, placeZ);
      this.engine.updateGhostStructure(this.selectedStructureType, placeX, placeY, placeZ, this.yaw);
    } else {
      this.engine.hideGhostStructure();
    }

    this.updateCharacterVisuals(delta, worldMove);
  }

  private updateRodMinigame(delta: number) {
    if (this.rodState === 'cast') {
      this.biteTimer -= delta;
      if (this.rodBobberMesh) {
        this.rodBobberMesh.position.y = 0.05 + Math.sin(Date.now() * 0.005) * 0.04;
      }

      if (this.biteTimer <= 0) {
        this.rodState = 'hooked';
        sound.playBiteAlert();
        this.callbacks.onNotification('🎣 BITE! CLICK RAPIDLY TO REEL!');
        this.targetedFish = this.ecosystem.fishList[Math.floor(Math.random() * this.ecosystem.fishList.length)];
      }
      this.callbacks.onRodStateChange(this.rodState, this.tension);
    } else if (this.rodState === 'hooked') {
      this.tension -= 18 * delta;
      if (this.rodBobberMesh) {
        this.rodBobberMesh.position.y = -0.15 + Math.sin(Date.now() * 0.02) * 0.1;
      }

      this.callbacks.onRodStateChange(this.rodState, this.tension);

      if (this.tension >= 85) {
        sound.playLineSnap();
        this.callbacks.onNotification('💥 Line snapped! Tension was too high!');
        this.cancelRod();
      } else if (this.tension <= 10) {
        this.callbacks.onNotification('💨 Fish slipped off the hook! Reel was too loose.');
        this.cancelRod();
      } else if (this.tension >= 65 && Math.random() < 0.03) {
        if (this.targetedFish) {
          sound.playInstantCatchChime();
          this.callbacks.onCatchFish(this.targetedFish, 'rod');
          this.ecosystem.catchFishInstance(this.targetedFish);
          this.ecosystem.telemetry.playerCatches++;
          this.callbacks.onNotification(`✨ Caught ${this.targetedFish.species.name}! (${this.targetedFish.sizeCm}cm)`);
        }
        this.cancelRod();
      }
    }
  }

  private updateCharacterVisuals(delta: number, worldMove: THREE.Vector3) {
    const baseYOffset = this.isSneaking && !this.isSwimming ? -1.85 : -1.6;
    this.playerGroup.position.set(this.position.x, this.position.y + baseYOffset, this.position.z);
    this.playerGroup.rotation.y = this.characterFacingYaw;

    // Pitch tilt for head/mask
    this.headMesh.rotation.x = this.pitch * 0.45;

    if (this.isDead) {
      // Gentle exhausted resting pose
      this.playerGroup.rotation.x = -1.45;
      this.playerGroup.rotation.z = 0.2;
      this.legLeft.rotation.x = 0;
      this.legRight.rotation.x = 0;
      this.armLeft.rotation.x = 0;
    } else if (this.isSwimming) {
      // Natural swimming/diving tilt and crawl stroke
      this.playerGroup.rotation.x = this.isDiving ? 1.35 : 0.7;
      this.playerGroup.rotation.z = 0;

      const swimCycle = Date.now() * 0.007;
      this.legLeft.rotation.x = Math.sin(swimCycle) * 0.55;
      this.legRight.rotation.x = -Math.sin(swimCycle) * 0.55;
      this.armLeft.rotation.x = -0.75 + Math.sin(swimCycle) * 0.45;
    } else {
      this.playerGroup.rotation.x = 0;
      this.playerGroup.rotation.z = 0;

      if (worldMove.lengthSq() > 0.01) {
        const walkFreq = (this.keys.sprint || this.touchMove.isSprinting) ? 14 : 8;
        const legAngle = Math.sin(Date.now() * 0.008 * (walkFreq / 8)) * 0.65;
        this.legLeft.rotation.x = legAngle;
        this.legRight.rotation.x = -legAngle;
        this.armLeft.rotation.x = -legAngle * 0.7;
      } else {
        this.legLeft.rotation.x = 0;
        this.legRight.rotation.x = 0;
        this.armLeft.rotation.x = 0;
      }
    }

    if (this.isSwinging) {
      this.swingProgress += delta * 7.5;
      if (this.swingType === 'chop' || this.swingType === 'mine') {
        const swing = Math.sin(this.swingProgress * Math.PI);
        this.armRight.rotation.x = -0.5 - swing * 1.4;
      } else if (this.swingType === 'thrust') {
        const thrust = Math.sin(this.swingProgress * Math.PI);
        this.armRight.position.z = 0.2 + thrust * 0.5;
      }
      if (this.swingProgress >= 1.0) {
        this.isSwinging = false;
        this.armRight.rotation.x = 0;
        this.armRight.position.z = 0;
      }
    }

    // Invulnerability blink effect when damaged
    const isFlickerVisible = this.invulnerabilityTimer <= 0 || Math.floor(Date.now() / 100) % 2 === 0;

    if (this.isThirdPerson) {
      const camOffset = new THREE.Vector3(
        -Math.sin(this.yaw) * this.cameraDistance * Math.cos(this.pitch),
        Math.sin(this.pitch) * this.cameraDistance + 1.4,
        -Math.cos(this.yaw) * this.cameraDistance * Math.cos(this.pitch)
      );

      this.engine.camera.position.copy(this.position).add(camOffset);
      this.engine.camera.lookAt(this.position.x, this.position.y + 0.3, this.position.z);
      this.playerGroup.visible = isFlickerVisible;
    } else {
      this.engine.camera.position.copy(this.position);
      this.engine.camera.rotation.set(0, 0, 0);
      this.engine.camera.rotation.y = this.yaw;
      this.engine.camera.rotation.x = this.pitch;
      this.playerGroup.visible = false;
    }
  }

  public destroy() {
    this.resetAllInputs();

    window.removeEventListener('keydown', this.handleKeyDownBound);
    window.removeEventListener('keyup', this.handleKeyUpBound);
    this.engine.container.removeEventListener('mousedown', this.handleMouseDownBound);
    window.removeEventListener('mousemove', this.handleMouseMoveBound);
    window.removeEventListener('mouseup', this.handleMouseUpBound);
    this.engine.container.removeEventListener('contextmenu', this.handleContextMenuBound);

    window.removeEventListener('blur', this.handleWindowBlurBound);
    document.removeEventListener('visibilitychange', this.handleVisibilityChangeBound);
    window.removeEventListener('focus', this.handleWindowFocusBound);
    window.removeEventListener('pagehide', this.handlePageHideBound);
    window.removeEventListener('pointercancel', this.handlePointerCancelBound);

    this.engine.scene.remove(this.playerGroup);
  }
}
