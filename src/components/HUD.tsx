/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ToolType, StructureType, GraphicsQuality } from '../types';
import { Volume2, VolumeX, BookOpen, Hammer, HelpCircle, AlertTriangle, Waves, Footprints, Eye, Sparkles, Anchor } from 'lucide-react';
import { ITEM_DATABASE } from './InventoryModal';

interface HUDProps {
  equippedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  inventory: Record<string, number>;
  hotbarSlots: (string | null)[];
  selectedStructureType: StructureType;
  onCycleStructureType: () => void;
  isThirdPerson: boolean;
  onToggleCamera: () => void;
  promptText: string | null;
  notification: string | null;
  boundaryWarning: boolean;
  inWater: boolean;
  waterDepth: number;
  isSwimming: boolean;
  isDiving: boolean;
  airPercent: number;
  isSneaking: boolean;
  isPilotingRaft?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  graphicsQuality?: GraphicsQuality;
  onToggleQuality?: () => void;
  onOpenInventory: () => void;
  onOpenFishodex: () => void;
  onOpenCrafting: () => void;
  onOpenGuide: () => void;
  rodState: {
    state: 'idle' | 'cast' | 'nibble' | 'hooked';
    tension: number;
  };
  totalFishCaughtCount: number;
}

export const HUD: React.FC<HUDProps> = ({
  equippedTool,
  onSelectTool,
  inventory,
  hotbarSlots,
  selectedStructureType,
  onCycleStructureType,
  isThirdPerson,
  onToggleCamera,
  promptText,
  notification,
  boundaryWarning,
  inWater,
  waterDepth,
  isSwimming,
  isDiving,
  airPercent,
  isSneaking,
  isPilotingRaft,
  isMuted,
  onToggleMute,
  graphicsQuality,
  onToggleQuality,
  onOpenInventory,
  onOpenFishodex,
  onOpenCrafting,
  onOpenGuide,
  rodState,
  totalFishCaughtCount,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-4 md:p-6 select-none font-sans">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {/* Title / Mini Info */}
        <div
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-white/95 text-[#2D3436] border-3 sm:border-4 border-[#2D3436] rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-[4px_4px_0px_0px_#2D3436] sm:shadow-[6px_6px_0px_0px_#2D3436] flex items-center gap-2 sm:gap-3 pointer-events-auto"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FF7675] border-2 border-[#2D3436] flex items-center justify-center text-white font-black text-base sm:text-lg shadow-[2px_2px_0px_0px_#2D3436]">
            🐟
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-[10px] sm:text-xs font-black tracking-tight uppercase text-[#2D3436]">WHAT THE FISH?</h1>
              <span className="hidden sm:inline bg-[#55EFC4] text-[#00B894] border-2 border-[#2D3436] px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black tracking-wider uppercase">
                LAGOON
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] sm:text-xs font-black uppercase text-[#2D3436] tracking-tight">
                Discovered: <strong className="text-[#FF7675]">{totalFishCaughtCount}</strong> / 16
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto flex-wrap justify-end"
        >
          {/* Inventory / Pack Button */}
          <button
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onOpenInventory}
            className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#55EFC4] hover:bg-[#A8E6CF] text-[#2D3436] border-3 sm:border-4 border-[#2D3436] text-[11px] sm:text-xs font-black shadow-[3px_3px_0px_0px_#2D3436] sm:shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
            title="Open Backpack / Inventory (Key: E or I)"
          >
            <span className="text-xs sm:text-sm">🎒</span>
            <span className="uppercase tracking-wider hidden sm:inline">Pack</span>
            <kbd className="text-[9px] sm:text-[10px] bg-white text-[#2D3436] px-1 sm:px-1.5 py-0.5 rounded border border-[#2D3436] font-mono hidden sm:inline">E</kbd>
          </button>

          {/* Camera View Toggle Button */}
          <button
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onToggleCamera}
            className={`px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-[#2D3436] text-[11px] sm:text-xs font-black shadow-[3px_3px_0px_0px_#2D3436] sm:shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
              isThirdPerson ? 'bg-[#A29BFE] text-white' : 'bg-white text-[#2D3436]'
            }`}
            title="Toggle 1st / 3rd Person View (Key: V)"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            <span className="uppercase tracking-wider hidden sm:inline">{isThirdPerson ? '3rd' : '1st'}</span>
            <kbd className="text-[9px] sm:text-[10px] bg-[#DFE6E9] text-[#2D3436] px-1 sm:px-1.5 py-0.5 rounded border border-[#2D3436] font-mono hidden sm:inline">V</kbd>
          </button>

          {/* Fishodex Button */}
          <button
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onOpenFishodex}
            className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-[#FFEAA7] text-[#2D3436] border-3 sm:border-4 border-[#2D3436] text-[11px] sm:text-xs font-black shadow-[3px_3px_0px_0px_#2D3436] sm:shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] text-[#00B894]" />
            <span className="uppercase tracking-wider hidden sm:inline">Fishodex</span>
            <kbd className="text-[9px] sm:text-[10px] bg-[#DFE6E9] text-[#2D3436] px-1 sm:px-1.5 py-0.5 rounded border border-[#2D3436] font-mono hidden sm:inline">B</kbd>
          </button>

          {/* Crafting Button */}
          <button
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onOpenCrafting}
            className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#FDCB6E] hover:bg-[#FFEAA7] text-[#2D3436] border-3 sm:border-4 border-[#2D3436] text-[11px] sm:text-xs font-black shadow-[3px_3px_0px_0px_#2D3436] sm:shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
          >
            <Hammer className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] text-[#2D3436]" />
            <span className="uppercase tracking-wider hidden sm:inline">Craft</span>
            <kbd className="text-[9px] sm:text-[10px] bg-white text-[#2D3436] px-1 sm:px-1.5 py-0.5 rounded border border-[#2D3436] font-mono hidden sm:inline">Tab</kbd>
          </button>

          {/* Graphics Quality Toggle Button */}
          {onToggleQuality && (
            <button
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onToggleQuality}
              className="px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-[#FFEAA7] text-[#2D3436] border-3 sm:border-4 border-[#2D3436] text-[10px] sm:text-[11px] font-black shadow-[3px_3px_0px_0px_#2D3436] sm:shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer uppercase"
              title={`Graphics Quality: ${(graphicsQuality || 'high').toUpperCase()}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E17055]" />
              <span className="hidden md:inline">Quality:</span>
              <span className="text-[#0984E3]">{graphicsQuality?.toUpperCase() || 'HIGH'}</span>
            </button>
          )}

          {/* Guide Button */}
          <button
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onOpenGuide}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#74B9FF] hover:bg-[#87CEEB] text-[#2D3436] border-3 sm:border-4 border-[#2D3436] flex items-center justify-center shadow-[3px_3px_0px_0px_#2D3436] sm:shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
            title="Help / Controls (Key: H)"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </button>

          {/* Audio Button */}
          <button
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onToggleMute}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${
              isMuted ? 'bg-[#FF7675] text-white' : 'bg-[#55EFC4] text-[#2D3436]'
            } hover:brightness-105 border-3 sm:border-4 border-[#2D3436] flex items-center justify-center shadow-[3px_3px_0px_0px_#2D3436] sm:shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer`}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />}
          </button>
        </div>
      </div>

      {/* CENTER NOTIFICATION & RETICLE */}
      <div className="flex flex-col items-center justify-center pointer-events-none space-y-2 sm:space-y-3">
        {/* Notification Banner */}
        {notification && (
          <div className="bg-[#2D3436] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-[#00B894] shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)] text-xs sm:text-sm font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-150 text-center max-w-sm sm:max-w-md">
            {notification}
          </div>
        )}

        {/* Boundary Warning */}
        {boundaryWarning && (
          <div className="bg-[#FF7675] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-[#2D3436] text-[11px] sm:text-xs font-black shadow-[4px_4px_0px_0px_#2D3436] flex items-center gap-2 animate-bounce uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-white stroke-[3]" />
            Lagoon Boundary: Outer ocean current ahead!
          </div>
        )}

        {/* Raft Steering Overlay */}
        {isPilotingRaft && (
          <div className="bg-[#00CEC9] text-[#2D3436] px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-[#2D3436] shadow-[5px_5px_0px_0px_#2D3436] text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2.5 animate-pulse text-center">
            <Anchor className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3] shrink-0" />
            <span>⛵ Piloting Raft — Steer with joystick/WASD. Press Space/Jump to Disembark.</span>
          </div>
        )}

        {/* Center Reticle */}
        {!isPilotingRaft && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white/80 bg-white/20 flex items-center justify-center shadow-md">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2D3436] border border-white" />
          </div>
        )}

        {/* Contextual Interaction Prompt */}
        {promptText && (
          <div className="bg-white text-[#2D3436] px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] text-[11px] sm:text-xs font-black uppercase tracking-wider animate-pulse text-center max-w-xs">
            {promptText}
          </div>
        )}

        {/* Special Tool Context Helper */}
        {equippedTool === 'wood_structure' && (
          <div
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="bg-white/95 text-[#2D3436] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] text-[10px] sm:text-xs font-black uppercase tracking-tight flex items-center gap-2"
          >
            <span>Piece: <strong className="text-[#FF7675]">{selectedStructureType.toUpperCase()}</strong></span>
            <button
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onCycleStructureType}
              className="pointer-events-auto bg-[#FFEAA7] hover:bg-[#FDCB6E] text-[#2D3436] px-2 py-0.5 rounded-lg border-2 border-[#2D3436] text-[9px] font-black uppercase cursor-pointer"
            >
              Cycle Piece
            </button>
          </div>
        )}

        {/* Rod Reel Minigame Widget */}
        {rodState.state === 'hooked' && (
          <div
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="bg-white text-[#2D3436] border-4 border-[#2D3436] p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[6px_6px_0px_0px_#2D3436] text-center space-y-2 w-64 sm:w-72 animate-in zoom-in-95 pointer-events-auto"
          >
            <div className="text-xs sm:text-sm font-black text-[#FF7675] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>🎣 FISH HOOKED! REEL IN!</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#636E72]">Tap REEL to keep tension inside the green zone!</p>

            {/* Tension Bar */}
            <div className="w-full h-5 sm:h-6 bg-[#DFE6E9] rounded-full border-2 sm:border-3 border-[#2D3436] relative overflow-hidden">
              <div className="absolute left-[35%] w-[40%] h-full bg-[#55EFC4] border-x-2 border-[#00B894]" />
              <div
                className={`h-full transition-all duration-75 ${
                  rodState.tension >= 35 && rodState.tension <= 75 ? 'bg-[#00B894]' : 'bg-[#FF7675]'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, rodState.tension))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION (Supplies + Oxygen Gauge + Tool Hotbar) */}
      <div className="flex flex-col items-center gap-2">
        {/* Oxygen / Air Gauge while Diving */}
        {(inWater || isDiving || airPercent < 98) && (
          <div
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="bg-white/95 border-2 sm:border-3 border-[#2D3436] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-[3px_3px_0px_0px_#2D3436] flex items-center gap-2 sm:gap-3 text-xs font-black pointer-events-auto"
          >
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#00B894] flex items-center gap-1">
              🫁 Air:
            </span>
            <div className="w-24 sm:w-32 h-3.5 sm:h-4 bg-[#DFE6E9] rounded-full border-2 border-[#2D3436] overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  airPercent > 40 ? 'bg-[#00CEC9]' : airPercent > 20 ? 'bg-[#FDCB6E]' : 'bg-[#FF7675] animate-pulse'
                }`}
                style={{ width: `${airPercent}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#2D3436]">{Math.round(airPercent)}%</span>
          </div>
        )}

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          {inWater && (
            <div className="bg-[#4DD0E1] text-[#2D3436] border-2 sm:border-3 border-[#2D3436] px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_0px_#2D3436] flex items-center gap-1 uppercase">
              <Waves className="w-3.5 h-3.5 stroke-[3]" />
              {isDiving ? 'Diving' : isSwimming ? 'Swimming' : `Wading (${waterDepth.toFixed(1)}m)`}
            </div>
          )}
          {isSneaking && (
            <div className="bg-[#FFEAA7] text-[#2D3436] border-2 sm:border-3 border-[#2D3436] px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_0px_#2D3436] flex items-center gap-1 uppercase">
              <Footprints className="w-3.5 h-3.5 stroke-[3]" />
              {isSwimming ? 'Diving Underwater' : 'Sneaking Stealth'}
            </div>
          )}
        </div>

        {/* Hotbar - 6 Quick-Access Grid Slots */}
        <div
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-white/95 border-3 sm:border-4 border-[#2D3436] rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-[5px_5px_0px_0px_#2D3436] flex items-center gap-1.5 sm:gap-2 pointer-events-auto overflow-x-auto max-w-full"
        >
          {hotbarSlots.map((itemKey, index) => {
            const meta = itemKey ? ITEM_DATABASE[itemKey] : null;
            const count = itemKey ? (inventory[itemKey] ?? 0) : 0;
            const isEquipped = meta?.toolType && equippedTool === meta.toolType;
            const keyLabel = (index + 1).toString();

            return (
              <button
                key={`hud_hb_${index}`}
                onTouchStart={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  if (meta?.toolType) {
                    onSelectTool(meta.toolType);
                  } else if (!itemKey) {
                    onSelectTool('hands');
                  }
                }}
                className={`relative rounded-xl sm:rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer select-none ${
                  itemKey
                    ? isEquipped
                      ? 'w-12 h-14 sm:w-15 sm:h-17 bg-[#FF7675] text-white border-3 sm:border-4 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] -translate-y-1 scale-105'
                      : 'w-11 h-13 sm:w-14 sm:h-16 bg-white text-[#2D3436] hover:bg-[#FFEAA7] border-2 sm:border-3 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]'
                    : 'w-11 h-13 sm:w-14 sm:h-16 bg-[#DFE6E9]/40 border-2 border-dashed border-[#B2BEC3] text-[#B2BEC3]'
                }`}
              >
                {itemKey && meta ? (
                  <>
                    <span className="text-lg sm:text-2xl leading-none">{meta.icon}</span>
                    <span className={`text-[7px] sm:text-[9px] font-black uppercase truncate max-w-[44px] sm:max-w-[52px] mt-0.5 ${isEquipped ? 'text-white' : 'text-[#2D3436]'}`}>
                      {meta.name}
                    </span>
                    <span className={`absolute top-0.5 right-1 text-[7px] sm:text-[8px] font-black font-mono ${isEquipped ? 'text-white' : 'text-[#636E72]'}`}>
                      {keyLabel}
                    </span>

                    {count > 0 && itemKey !== 'hands' && (
                      <span className="absolute -bottom-1 -right-1 bg-[#FDCB6E] text-[#2D3436] border-2 border-[#2D3436] text-[7px] sm:text-[8px] font-black px-1 rounded-full shadow-[1px_1px_0px_0px_#2D3436]">
                        {count}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] font-mono font-bold">[{keyLabel}]</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
