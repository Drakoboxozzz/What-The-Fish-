/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
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
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchId = useRef<number | null>(null);

  const lookTouchId = useRef<number | null>(null);
  const lastLookTouchPos = useRef<{ x: number; y: number } | null>(null);

  // Joystick touch handlers with touch-identifier tracking & deadzone
  const handleJoystickStart = (e: React.TouchEvent) => {
    if (!joystickBaseRef.current) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setIsJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (joystickTouchId.current === null || !joystickBaseRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = 46;
    const deadZone = 5;
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

    // Normalized smooth response
    const effectiveDist = (dist - deadZone) / (maxRadius - deadZone);
    const response = Math.min(1.0, Math.pow(effectiveDist, 1.15));
    const normX = Math.cos(angle) * response;
    const normZ = Math.sin(angle) * response;
    const isSprint = effectiveDist > 0.82;

    onMove(normX, normZ, isSprint);
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    if (joystickTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        setIsJoystickActive(false);
        setStickPos({ x: 0, y: 0 });
        onMove(0, 0, false);
        break;
      }
    }
  };

  // Reset touch positions on blur / focus / hide
  useEffect(() => {
    const handleReset = () => {
      joystickTouchId.current = null;
      lookTouchId.current = null;
      setIsJoystickActive(false);
      setStickPos({ x: 0, y: 0 });
      lastLookTouchPos.current = null;
      onMove(0, 0, false);
    };

    window.addEventListener('blur', handleReset);
    window.addEventListener('focus', handleReset);
    document.addEventListener('visibilitychange', handleReset);
    window.addEventListener('pagehide', handleReset);

    return () => {
      window.removeEventListener('blur', handleReset);
      window.removeEventListener('focus', handleReset);
      document.removeEventListener('visibilitychange', handleReset);
      window.removeEventListener('pagehide', handleReset);
    };
  }, [onMove]);

  // Right touch pad for camera look with touch-identifier tracking & clamping
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
        // Clamp extreme jumps between frames for smooth camera panning
        const dx = Math.max(-50, Math.min(50, rawDx));
        const dy = Math.max(-50, Math.min(50, rawDy));
        lastLookTouchPos.current = { x: touch.clientX, y: touch.clientY };
        onLook(dx, dy);
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

  const canThrow = equippedTool === 'spear' || equippedTool === 'rock';
  const isBuilding = equippedTool === 'wood_structure';

  const getToolActionIcon = () => {
    switch (equippedTool) {
      case 'stone_axe': return '🪓';
      case 'stone_pickaxe': return '⛏️';
      case 'spear': return '🔱';
      case 'wood_structure': return '🛖';
      case 'chum': return '🐟';
      case 'sea_grass':
      case 'kelp': return '🌿';
      case 'scallop': return '🦪';
      case 'barnacle': return '🐚';
      case 'fish_trap': return '🧺';
      case 'crafting_table': return '🔨';
      case 'simple_raft': return '⛵';
      case 'rock':
      case 'stone': return '🪨';
      case 'palm_shell': return '🥥';
      case 'fruit': return '🥭';
      case 'crab': return '🦀';
      case 'seed': return '🌱';
      default: return '⚡';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex justify-between select-none font-sans">
      {/* Left side: Virtual Joystick */}
      <div className="w-1/2 h-full relative flex items-end p-4 sm:p-6 pb-6">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/90 backdrop-blur-md border-4 border-[#2D3436] pointer-events-auto flex items-center justify-center relative touch-none shadow-[4px_4px_0px_0px_#2D3436] transition-opacity ${
            isJoystickActive ? 'opacity-100' : 'opacity-85'
          }`}
        >
          {/* Inner stick */}
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF7675] shadow-md border-3 border-[#2D3436] will-change-transform pointer-events-none"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            }}
          />
        </div>
      </div>

      {/* Right side: Look Pad & Action buttons */}
      <div
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        onTouchCancel={handleLookTouchEnd}
        className="w-1/2 h-full pointer-events-auto relative flex flex-col justify-end items-end p-4 sm:p-6 pb-6 gap-2.5 touch-none"
      >
        {/* Throw / Cycle Button if applicable */}
        {canThrow && onThrow && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onThrow();
            }}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[#FF7675] text-white font-black text-xs border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] pointer-events-auto cursor-pointer flex items-center gap-1.5 uppercase"
          >
            <span>🎯 Throw</span>
          </button>
        )}

        {isBuilding && onCycleStructure && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCycleStructure();
            }}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[#FFEAA7] text-[#2D3436] font-black text-xs border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] pointer-events-auto cursor-pointer flex items-center gap-1.5 uppercase"
          >
            <span>🔄 Cycle Piece</span>
          </button>
        )}

        {/* Primary Action Button & Jump */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onJump && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJump();
              }}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#74B9FF] hover:bg-[#81ECEC] active:scale-95 text-[#2D3436] font-black shadow-[3px_3px_0px_0px_#2D3436] border-3 border-[#2D3436] flex items-center justify-center text-lg sm:text-xl cursor-pointer pointer-events-auto active:translate-x-[2px] active:translate-y-[2px]"
              title="Jump / Swim Up"
            >
              🌊
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#FDCB6E] hover:bg-[#FFEAA7] active:scale-95 text-[#2D3436] font-black shadow-[4px_4px_0px_0px_#2D3436] border-3 sm:border-4 border-[#2D3436] flex items-center justify-center text-2xl sm:text-3xl cursor-pointer pointer-events-auto active:translate-x-[2px] active:translate-y-[2px]"
          >
            {getToolActionIcon()}
          </button>
        </div>

        {/* Sneak / Dive Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSneakToggle();
          }}
          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-black border-3 border-[#2D3436] transition-colors pointer-events-auto shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] ${
            isSneaking
              ? 'bg-[#55EFC4] text-[#2D3436]'
              : 'bg-white text-[#2D3436]'
          }`}
        >
          {isSneaking ? '🤿 Diving' : '🚶 Sneak / Dive'}
        </button>
      </div>
    </div>
  );
};
