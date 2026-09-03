/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ToolType } from '../types';

interface TouchControlsProps {
  onMove: (vx: number, vz: number, isSprinting: boolean) => void;
  onLook: (dx: number, dy: number) => void;
  onAction: () => void;
  onJump?: () => void;
  onThrow?: () => void;
  onCycleStructure?: () => void;
  equippedTool: ToolType;
  onSneakToggle: () => void;
  isSneaking: boolean;
  inWater?: boolean;
  isSwimming?: boolean;
  isDiving?: boolean;
  promptText?: string | null;
  onOpenInventory?: () => void;
  rodState?: 'idle' | 'cast' | 'nibble' | 'hooked';
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onLook,
  onAction,
  onJump,
  onThrow,
  onCycleStructure,
  equippedTool,
  onSneakToggle,
  isSneaking,
  inWater = false,
  isSwimming = false,
  isDiving = false,
  promptText = null,
  onOpenInventory,
  rodState = 'idle'
}) => {
  // Joystick State
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchId = useRef<number | null>(null);
  const joystickOrigin = useRef<{ x: number; y: number } | null>(null);

  // Camera Look Touch State
  const lookTouchId = useRef<number | null>(null);
  const lastLookTouchPos = useRef<{ x: number; y: number } | null>(null);

  // Reset all touch inputs safely
  const resetAllTouchInputs = useCallback(() => {
    joystickTouchId.current = null;
    joystickOrigin.current = null;
    lookTouchId.current = null;
    lastLookTouchPos.current = null;
    setIsJoystickActive(false);
    setStickPos({ x: 0, y: 0 });
    onMove(0, 0, false);
  }, [onMove]);

  // Window / App event listeners for input recovery
  useEffect(() => {
    const handleReset = () => resetAllTouchInputs();

    window.addEventListener('blur', handleReset);
    window.addEventListener('focus', handleReset);
    document.addEventListener('visibilitychange', handleReset);
    window.addEventListener('pagehide', handleReset);
    window.addEventListener('orientationchange', handleReset);
    window.addEventListener('resize', handleReset);

    return () => {
      window.removeEventListener('blur', handleReset);
      window.removeEventListener('focus', handleReset);
      document.removeEventListener('visibilitychange', handleReset);
      window.removeEventListener('pagehide', handleReset);
      window.removeEventListener('orientationchange', handleReset);
      window.removeEventListener('resize', handleReset);
    };
  }, [resetAllTouchInputs]);

  // ----------------------------------------------------
  // LEFT SIDE: VIRTUAL JOYSTICK
  // ----------------------------------------------------
  const handleJoystickZoneStart = (e: React.TouchEvent) => {
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setIsJoystickActive(true);

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      joystickOrigin.current = { x: centerX, y: centerY };
      updateJoystickFromPoint(touch.clientX, touch.clientY, centerX, centerY);
    }
  };

  const handleJoystickZoneMove = (e: React.TouchEvent) => {
    if (joystickTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current && joystickOrigin.current) {
        updateJoystickFromPoint(
          touch.clientX,
          touch.clientY,
          joystickOrigin.current.x,
          joystickOrigin.current.y
        );
        break;
      }
    }
  };

  const updateJoystickFromPoint = (clientX: number, clientY: number, originX: number, originY: number) => {
    const dx = clientX - originX;
    const dy = clientY - originY;
    const maxRadius = 52; // Comfortable travel distance
    const deadZone = 6;   // Resistant to accidental jitter
    const rawDist = Math.sqrt(dx * dx + dy * dy);

    if (rawDist < deadZone) {
      setStickPos({ x: 0, y: 0 });
      onMove(0, 0, false);
      return;
    }

    const dist = Math.min(maxRadius, rawDist);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * dist;
    const stickY = Math.sin(angle) * dist;
    setStickPos({ x: stickX, y: stickY });

    // Smooth normalized response curve: small nudge = slow sneak/walk, full push = run/sprint
    const effectiveDist = (dist - deadZone) / (maxRadius - deadZone);
    const response = Math.min(1.0, Math.pow(effectiveDist, 1.1));
    const normX = Math.cos(angle) * response;
    const normZ = Math.sin(angle) * response;
    const isSprint = effectiveDist > 0.80;

    onMove(normX, normZ, isSprint);
  };

  const handleJoystickZoneEnd = (e: React.TouchEvent) => {
    if (joystickTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        joystickOrigin.current = null;
        setIsJoystickActive(false);
        setStickPos({ x: 0, y: 0 });
        onMove(0, 0, false);
        break;
      }
    }
  };

  // ----------------------------------------------------
  // RIGHT SIDE: CAMERA LOOK PAD
  // ----------------------------------------------------
  const handleLookTouchStart = (e: React.TouchEvent) => {
    if (lookTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchId.current = touch.identifier;
    lastLookTouchPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (lookTouchId.current === null || !lastLookTouchPos.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const rawDx = touch.clientX - lastLookTouchPos.current.x;
        const rawDy = touch.clientY - lastLookTouchPos.current.y;

        // Smooth 1:1 camera rotation without artificial clamping lag
        lastLookTouchPos.current = { x: touch.clientX, y: touch.clientY };
        onLook(rawDx, rawDy);
        break;
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent) => {
    if (lookTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        lastLookTouchPos.current = null;
        break;
      }
    }
  };

  // ----------------------------------------------------
  // CONTEXTUAL TOOL & ACTION ICONS
  // ----------------------------------------------------
  const canThrow = equippedTool === 'spear' || equippedTool === 'rock';
  const isBuilding = equippedTool === 'wood_structure';

  const getToolActionMeta = () => {
    if (rodState === 'cast') {
      return { icon: '⏳', label: 'Waiting...' };
    }
    if (rodState === 'hooked') {
      return { icon: '🎣', label: 'REEL!' };
    }

    switch (equippedTool) {
      case 'stone_axe':
        return { icon: '🪓', label: 'Chop' };
      case 'stone_pickaxe':
        return { icon: '⛏️', label: 'Mine' };
      case 'spear':
        return { icon: '🔱', label: 'Thrust' };
      case 'wood_structure':
        return { icon: '🛖', label: 'Place' };
      case 'chum':
        return { icon: '🐟', label: 'Toss Chum' };
      case 'sea_grass':
      case 'kelp':
        return { icon: '🌿', label: 'Drop Flora' };
      case 'scallop':
      case 'barnacle':
        return { icon: '🦪', label: 'Place Shell' };
      case 'fish_trap':
        return { icon: '🧺', label: 'Set Trap' };
      case 'crafting_table':
        return { icon: '🔨', label: 'Place Table' };
      case 'simple_raft':
        return { icon: '⛵', label: 'Launch Raft' };
      case 'rock':
      case 'stone':
        return { icon: '🪨', label: 'Drop / Break' };
      case 'palm_shell':
        return { icon: '🥥', label: 'Scoop Fish' };
      case 'live_fish_shell':
        return { icon: '🐟', label: 'Release Fish' };
      case 'fish_meat':
        return { icon: '🥩', label: 'Drop Meat' };
      case 'fruit':
        return { icon: '🥭', label: 'Eat / Drop' };
      case 'crab':
        return { icon: '🦀', label: 'Place Crab' };
      case 'seed':
        return { icon: '🌱', label: 'Plant Palm' };
      default:
        return { icon: '⚡', label: 'Grab / Punch' };
    }
  };

  const actionMeta = getToolActionMeta();

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none font-sans overflow-hidden">
      {/* 1. LEFT TOUCH REGION: Joystick Touch Capture (Bottom-Left quadrant) */}
      <div
        onTouchStart={handleJoystickZoneStart}
        onTouchMove={handleJoystickZoneMove}
        onTouchEnd={handleJoystickZoneEnd}
        onTouchCancel={handleJoystickZoneEnd}
        className="absolute left-0 bottom-0 w-[38vw] max-w-[210px] h-[48vh] pointer-events-auto flex items-end p-3 sm:p-6 pb-5 touch-none"
      >
        <div
          ref={joystickBaseRef}
          className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white/90 backdrop-blur-md border-4 border-[#2D3436] flex items-center justify-center relative touch-none shadow-[5px_5px_0px_0px_#2D3436] transition-opacity duration-150 ${
            isJoystickActive ? 'opacity-100 scale-105' : 'opacity-80 scale-100'
          }`}
        >
          {/* Directional crosshair accents */}
          <div className="absolute w-2 h-2 rounded-full bg-[#B2BEC3] top-2" />
          <div className="absolute w-2 h-2 rounded-full bg-[#B2BEC3] bottom-2" />
          <div className="absolute w-2 h-2 rounded-full bg-[#B2BEC3] left-2" />
          <div className="absolute w-2 h-2 rounded-full bg-[#B2BEC3] right-2" />

          {/* Inner stick with spring return */}
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#FF7675] shadow-lg border-3 border-[#2D3436] will-change-transform pointer-events-none flex items-center justify-center text-white text-xs font-black"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            🕹️
          </div>
        </div>
      </div>

      {/* 2. PERMANENT FLOATING MOBILE INVENTORY BUTTON (Top-Left under HUD header) */}
      {onOpenInventory && (
        <button
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onOpenInventory();
          }}
          className="pointer-events-auto absolute left-3 top-20 sm:left-5 sm:top-24 z-40 px-3.5 py-2.5 rounded-2xl bg-[#55EFC4] hover:bg-[#A8E6CF] text-[#2D3436] font-black text-xs sm:text-sm border-4 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436] cursor-pointer flex items-center gap-2 uppercase tracking-wide transition-all"
          title="Open Inventory / Backpack"
        >
          <span className="text-base sm:text-lg">🎒</span>
          <span className="font-extrabold tracking-wider">BACKPACK</span>
        </button>
      )}

      {/* 3. RIGHT TOUCH REGION: Camera Look Pad (Behind action buttons, leaving bottom hotbar clear) */}
      <div
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        onTouchCancel={handleLookTouchEnd}
        className="absolute right-0 top-0 w-[55vw] h-[calc(100%-85px)] pointer-events-auto touch-none"
      />

      {/* 4. CONTEXTUAL ACTION BUTTONS (Thumb Arc on Bottom Right) */}
      <div className="absolute right-3 sm:right-6 bottom-4 sm:bottom-6 pointer-events-none flex flex-col items-end gap-2.5 z-40">
        {/* Contextual Interact Prompt Button (When near a harvestable tree, rock, crab, or raft) */}
        {promptText && (
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="pointer-events-auto px-4 py-2.5 rounded-2xl bg-[#FFEAA7] hover:bg-[#FDCB6E] text-[#2D3436] font-black text-xs sm:text-sm border-4 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436] cursor-pointer flex items-center gap-2 animate-bounce uppercase tracking-wider"
          >
            <span className="text-base">👋</span>
            <span>INTERACT / HARVEST</span>
          </button>
        )}

        {/* Secondary Action Row (Throw / Cycle Piece / Quick Backpack) */}
        <div className="flex items-center gap-2">
          {canThrow && onThrow && (
            <button
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onThrow();
              }}
              className="pointer-events-auto px-3.5 py-2 rounded-2xl bg-[#FF7675] text-white font-black text-xs border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#2D3436] cursor-pointer flex items-center gap-1.5 uppercase"
            >
              <span>🎯 Throw</span>
            </button>
          )}

          {isBuilding && onCycleStructure && (
            <button
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onCycleStructure();
              }}
              className="pointer-events-auto px-3.5 py-2 rounded-2xl bg-[#FFEAA7] text-[#2D3436] font-black text-xs border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#2D3436] cursor-pointer flex items-center gap-1.5 uppercase"
            >
              <span>🔄 Piece</span>
            </button>
          )}

          {onOpenInventory && (
            <button
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenInventory();
              }}
              className="pointer-events-auto px-3.5 py-2 rounded-2xl bg-[#55EFC4] text-[#2D3436] font-black text-xs border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#2D3436] cursor-pointer flex items-center gap-1.5 uppercase"
            >
              <span>🎒 Pack</span>
            </button>
          )}
        </div>

        {/* Primary Action & Jump/Surface Row */}
        <div className="flex items-center gap-3">
          {/* Jump (on land) OR Surface/Ascend (in water) */}
          {onJump && (
            <button
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onJump();
              }}
              className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#74B9FF] hover:bg-[#81ECEC] active:scale-95 text-[#2D3436] font-black shadow-[4px_4px_0px_0px_#2D3436] border-4 border-[#2D3436] flex flex-col items-center justify-center cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436]"
              title={inWater || isSwimming ? 'Surface / Swim Up' : 'Jump'}
            >
              <span className="text-xl leading-none">{inWater || isSwimming ? '🌊' : '🦘'}</span>
              <span className="text-[9px] font-black tracking-tight uppercase mt-0.5">
                {inWater || isSwimming ? 'Surface' : 'Jump'}
              </span>
            </button>
          )}

          {/* Primary Tool / Action / Grab Button */}
          <button
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className={`pointer-events-auto w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-[#2D3436] flex flex-col items-center justify-center cursor-pointer shadow-[6px_6px_0px_0px_#2D3436] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0px_0px_#2D3436] active:scale-95 transition-all ${
              rodState === 'hooked'
                ? 'bg-[#FF7675] text-white animate-pulse'
                : 'bg-[#FDCB6E] hover:bg-[#FFEAA7] text-[#2D3436]'
            }`}
          >
            <span className="text-2xl sm:text-3xl leading-none">{actionMeta.icon}</span>
            <span className="text-[10px] sm:text-[11px] font-black tracking-tight uppercase mt-1">
              {actionMeta.label}
            </span>
          </button>
        </div>

        {/* Sneak (on land) OR Dive/Descend (in water) */}
        <button
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onSneakToggle();
          }}
          className={`pointer-events-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-black border-3 border-[#2D3436] transition-colors shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#2D3436] flex items-center gap-1.5 uppercase ${
            isSneaking || isDiving
              ? 'bg-[#55EFC4] text-[#2D3436]'
              : 'bg-white text-[#2D3436]'
          }`}
        >
          <span>{inWater || isSwimming ? '🤿' : '🚶'}</span>
          <span>
            {inWater || isSwimming
              ? isDiving
                ? 'Diving (Descend)'
                : 'Dive / Descend'
              : isSneaking
              ? 'Sneaking'
              : 'Sneak'}
          </span>
        </button>
      </div>
    </div>
  );
};
