/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ToolType, StructureType, GraphicsQuality } from '../types';
import { Volume2, VolumeX, BookOpen, Hammer, HelpCircle, AlertTriangle, Waves, Footprints, Eye, Compass, Anchor, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-4">
        {/* Title / Mini Info */}
        <div className="bg-white/95 text-[#2D3436] border-4 border-[#2D3436] rounded-3xl p-3 shadow-[6px_6px_0px_0px_#2D3436] flex items-center gap-3 pointer-events-auto transition-transform hover:scale-[1.01]">
          <div className="w-11 h-11 rounded-2xl bg-[#FF7675] border-2 border-[#2D3436] flex items-center justify-center text-white font-black text-xl shadow-[2px_2px_0px_0px_#2D3436]">
            🐟
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black tracking-tight uppercase text-[#2D3436]">WHAT THE FISH?</h1>
              <span className="bg-[#55EFC4] text-[#00B894] border-2 border-[#2D3436] px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase shadow-[1px_1px_0px_0px_#2D3436]">
                LAGOON ECOSYSTEM
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-black uppercase text-[#2D3436] tracking-tight">
                Species Discovered: <strong className="text-[#FF7675] text-sm">{totalFishCaughtCount}</strong> / 16
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Inventory / Pack Button */}
          <button
            onClick={onOpenInventory}
            className="px-4 py-2.5 rounded-2xl bg-[#55EFC4] hover:bg-[#A8E6CF] text-[#2D3436] border-4 border-[#2D3436] text-xs font-black shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436] flex items-center gap-2 transition-all cursor-pointer"
            title="Open Backpack / Inventory (Key: E or I)"
          >
            <span className="text-sm">🎒</span>
            <span className="uppercase tracking-wider hidden sm:inline">Pack</span>
            <kbd className="text-[10px] bg-white text-[#2D3436] px-1.5 py-0.5 rounded border border-[#2D3436] font-mono">E</kbd>
          </button>

          {/* Camera View Toggle Button */}
          <button
            onClick={onToggleCamera}
            className={`px-3.5 py-2.5 rounded-2xl border-4 border-[#2D3436] text-xs font-black shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436] flex items-center gap-1.5 transition-all cursor-pointer ${
              isThirdPerson ? 'bg-[#A29BFE] text-white' : 'bg-white text-[#2D3436]'
            }`}
            title="Toggle 1st / 3rd Person View (Key: V)"
          >
            <Eye className="w-4 h-4 stroke-[3]" />
            <span className="uppercase tracking-wider hidden sm:inline">{isThirdPerson ? '3rd Person' : '1st Person'}</span>
            <kbd className="text-[10px] bg-[#DFE6E9] text-[#2D3436] px-1.5 py-0.5 rounded border border-[#2D3436] font-mono">V</kbd>
          </button>

          {/* Fishodex Button */}
          <button
            onClick={onOpenFishodex}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FFEAA7] text-[#2D3436] border-4 border-[#2D3436] text-xs font-black shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436] flex items-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 stroke-[3] text-[#00B894]" />
            <span className="uppercase tracking-wider hidden sm:inline">Fishodex</span>
            <kbd className="text-[10px] bg-[#DFE6E9] text-[#2D3436] px-1.5 py-0.5 rounded border border-[#2D3436] font-mono">B</kbd>
          </button>

          {/* Crafting Button */}
          <button
            onClick={onOpenCrafting}
            className="px-4 py-2.5 rounded-2xl bg-[#FDCB6E] hover:bg-[#FFEAA7] text-[#2D3436] border-4 border-[#2D3436] text-xs font-black shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Hammer className="w-4 h-4 stroke-[3] text-[#2D3436]" />
            <span className="uppercase tracking-wider">Craft</span>
            <kbd className="text-[10px] bg-white text-[#2D3436] px-1.5 py-0.5 rounded border border-[#2D3436] font-mono">Tab</kbd>
          </button>

          {/* Graphics Quality Toggle Button */}
          {onToggleQuality && (
            <button
              onClick={onToggleQuality}
              className="px-3 py-2.5 rounded-2xl bg-white hover:bg-[#FFEAA7] text-[#2D3436] border-4 border-[#2D3436] text-[11px] font-black shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436] flex items-center gap-1.5 transition-all cursor-pointer uppercase"
              title={`Graphics Quality: ${(graphicsQuality || 'high').toUpperCase()}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E17055]" />
              <span className="hidden sm:inline">Quality:</span>
              <span className="text-[#0984E3]">{graphicsQuality?.toUpperCase() || 'HIGH'}</span>
            </button>
          )}

          {/* Guide Button */}
          <button
            onClick={onOpenGuide}
            className="w-11 h-11 rounded-2xl bg-[#74B9FF] hover:bg-[#87CEEB] text-[#2D3436] border-4 border-[#2D3436] flex items-center justify-center shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436] transition-all cursor-pointer"
            title="Help / Controls (Key: H)"
          >
            <HelpCircle className="w-5 h-5 stroke-[3]" />
          </button>

          {/* Audio Button */}
          <button
            onClick={onToggleMute}
            className={`w-11 h-11 rounded-2xl ${isMuted ? 'bg-[#FF7675] text-white' : 'bg-[#55EFC4] text-[#2D3436]'} hover:brightness-105 border-4 border-[#2D3436] flex items-center justify-center shadow-[4px_4px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2D3436] transition-all cursor-pointer`}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 stroke-[3]" /> : <Volume2 className="w-5 h-5 stroke-[3]" />}
          </button>
        </div>
      </div>

      {/* CENTER NOTIFICATION & RETICLE */}
      <div className="flex flex-col items-center justify-center pointer-events-none space-y-3">
        {/* Notification Banner */}
        {notification && (
          <div className="bg-[#2D3436] text-white px-6 py-3 rounded-2xl border-4 border-[#00B894] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] text-xs md:text-sm font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-150">
            {notification}
          </div>
        )}

        {/* Boundary Warning */}
        {boundaryWarning && (
          <div className="bg-[#FF7675] text-white px-5 py-2.5 rounded-2xl border-4 border-[#2D3436] text-xs font-black shadow-[6px_6px_0px_0px_#2D3436] flex items-center gap-2 animate-bounce uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-white stroke-[3]" />
            Lagoon Boundary: Outer ocean current ahead!
          </div>
        )}

        {/* Raft Steering Overlay */}
        {isPilotingRaft && (
          <div className="bg-[#00CEC9] text-[#2D3436] px-6 py-3 rounded-2xl border-4 border-[#2D3436] shadow-[6px_6px_0px_0px_#2D3436] text-xs font-black uppercase tracking-wider flex items-center gap-2.5 animate-pulse">
            <Anchor className="w-5 h-5 stroke-[3]" />
            <span>⛵ Piloting Raft — Steer with [W/A/S/D] or [Q/E]. Press [Space] or [E] to Disembark.</span>
          </div>
        )}

        {/* Center Reticle */}
        {!isPilotingRaft && (
          <div className="w-6 h-6 rounded-full border-2 border-white/80 bg-white/20 flex items-center justify-center shadow-md">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2D3436] border border-white" />
          </div>
        )}

        {/* Contextual Interaction Prompt */}
        {promptText && (
          <div className="bg-white text-[#2D3436] px-5 py-2.5 rounded-2xl border-4 border-[#2D3436] shadow-[5px_5px_0px_0px_#2D3436] text-xs font-black uppercase tracking-wider animate-pulse">
            {promptText}
          </div>
        )}

        {/* Special Tool Context Helper */}
        {equippedTool === 'stone_pickaxe' && (
          <div className="bg-white/95 text-[#2D3436] px-4 py-2 rounded-2xl border-3 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] text-xs font-black uppercase tracking-tight flex items-center gap-2">
            <span>⛏️ Left-Click: Mine Boulders & Rocky Outcrops into Stone</span>
          </div>
        )}

        {equippedTool === 'spear' && (
          <div className="bg-white/95 text-[#2D3436] px-4 py-2 rounded-2xl border-3 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] text-xs font-black uppercase tracking-tight flex items-center gap-2">
            <span>🔱 Right-Click / [R]: Throw Spear</span>
            <span className="text-[#636E72]">|</span>
            <span>Left-Click: Spear Shallows</span>
          </div>
        )}

        {equippedTool === 'palm_shell' && (
          <div className="bg-white/95 text-[#2D3436] px-4 py-2 rounded-2xl border-3 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] text-xs font-black uppercase tracking-tight flex items-center gap-2">
            <span>🥥 Left-Click: Scoop & Catch Live Small Fish in Shell</span>
          </div>
        )}

        {equippedTool === 'wood_structure' && (
          <div className="bg-white/95 text-[#2D3436] px-4 py-2 rounded-2xl border-3 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] text-xs font-black uppercase tracking-tight flex items-center gap-3">
            <span>🛖 Piece: <strong className="text-[#FF7675]">{selectedStructureType.toUpperCase()}</strong></span>
            <button
              onClick={onCycleStructureType}
              className="pointer-events-auto bg-[#FFEAA7] hover:bg-[#FDCB6E] text-[#2D3436] px-2.5 py-1 rounded-xl border-2 border-[#2D3436] text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#2D3436] cursor-pointer"
            >
              [R] Cycle Piece
            </button>
            <span className="text-[#636E72]">Left-Click to Place</span>
          </div>
        )}

        {/* Rod Reel Minigame Widget */}
        {rodState.state === 'hooked' && (
          <div className="bg-white text-[#2D3436] border-4 border-[#2D3436] p-5 rounded-3xl shadow-[8px_8px_0px_0px_#2D3436] text-center space-y-2.5 w-72 animate-in zoom-in-95 pointer-events-auto">
            <div className="text-sm font-black text-[#FF7675] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>🎣 FISH HOOKED! REEL IN!</span>
            </div>
            <p className="text-[11px] font-bold text-[#636E72]">Click / Tap rapidly to keep tension inside the green!</p>

            {/* Tension Bar */}
            <div className="w-full h-6 bg-[#DFE6E9] rounded-full border-3 border-[#2D3436] relative overflow-hidden">
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
      <div className="flex flex-col items-center gap-2.5">
        {/* Oxygen / Air Gauge while Diving */}
        {(inWater || isDiving || airPercent < 98) && (
          <div className="bg-white/95 border-3 border-[#2D3436] rounded-2xl px-4 py-2 shadow-[4px_4px_0px_0px_#2D3436] flex items-center gap-3 text-xs font-black pointer-events-auto">
            <span className="text-[11px] uppercase tracking-wider text-[#00B894] flex items-center gap-1">
              🫁 Oxygen:
            </span>
            <div className="w-32 h-4 bg-[#DFE6E9] rounded-full border-2 border-[#2D3436] overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  airPercent > 40 ? 'bg-[#00CEC9]' : airPercent > 20 ? 'bg-[#FDCB6E]' : 'bg-[#FF7675] animate-pulse'
                }`}
                style={{ width: `${airPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-[#2D3436]">{Math.round(airPercent)}%</span>
          </div>
        )}

        {/* Supplies Mini Bar */}
        <div className="bg-white/95 border-3 border-[#2D3436] rounded-2xl px-4 py-1.5 shadow-[4px_4px_0px_0px_#2D3436] flex items-center gap-3 text-xs font-black pointer-events-auto flex-wrap">
          <span className="text-[10px] uppercase text-[#636E72] tracking-wider">Supplies:</span>
          <span className="text-[#854d0e]">🪵 {inventory.wood || 0}</span>
          <span className="text-[#576574]">🪨 {(inventory.stone || 0) + (inventory.rock || 0)}</span>
          <span className="text-[#16a34a]">🌿 {inventory.fiber || 0}</span>
          <span className="text-[#d97706]">🪢 {inventory.rope || 0}</span>
          {inventory.crab ? <span className="text-[#ea580c]">🦀 Crab: {inventory.crab}</span> : null}
          {inventory.fruit ? <span className="text-[#8b5cf6]">🫐 Fruit: {inventory.fruit}</span> : null}
          {inventory.palm_shell ? <span className="text-[#a16207]">🥥 Shell: {inventory.palm_shell}</span> : null}
          {inventory.seed ? <span className="text-[#a16207]">🥥 Seed: {inventory.seed}</span> : null}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2.5">
          {inWater && (
            <div className="bg-[#4DD0E1] text-[#2D3436] border-3 border-[#2D3436] px-3.5 py-1 rounded-2xl text-xs font-black shadow-[3px_3px_0px_0px_#2D3436] flex items-center gap-1.5 uppercase">
              <Waves className="w-4 h-4 stroke-[3]" />
              {isDiving ? 'Lagoon Diving' : isSwimming ? 'Lagoon Swimming' : `Lagoon Wading (${waterDepth.toFixed(1)}m)`}
            </div>
          )}
          {isSneaking && (
            <div className="bg-[#FFEAA7] text-[#2D3436] border-3 border-[#2D3436] px-3.5 py-1 rounded-2xl text-xs font-black shadow-[3px_3px_0px_0px_#2D3436] flex items-center gap-1.5 uppercase">
              <Footprints className="w-4 h-4 stroke-[3]" />
              {isSwimming ? 'Diving Underwater [C]' : 'Sneaking Stealth [C]'}
            </div>
          )}
        </div>

        {/* Hotbar - 6 Quick-Access Grid Slots */}
        <div className="bg-white/95 border-4 border-[#2D3436] rounded-3xl p-2 md:p-2.5 shadow-[8px_8px_0px_0px_#2D3436] flex items-center gap-2 md:gap-2.5 pointer-events-auto overflow-x-auto max-w-full">
          {hotbarSlots.map((itemKey, index) => {
            const meta = itemKey ? ITEM_DATABASE[itemKey] : null;
            const count = itemKey ? (inventory[itemKey] ?? 0) : 0;
            const isEquipped = meta?.toolType && equippedTool === meta.toolType;
            const keyLabel = (index + 1).toString();

            return (
              <button
                key={`hud_hb_${index}`}
                onClick={() => {
                  if (meta?.toolType) {
                    onSelectTool(meta.toolType);
                  } else if (!itemKey) {
                    onSelectTool('hands');
                  }
                }}
                className={`relative rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer select-none ${
                  itemKey
                    ? isEquipped
                      ? 'w-14 h-16 md:w-16 md:h-18 bg-[#FF7675] text-white border-4 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] -translate-y-1.5 scale-105'
                      : 'w-13 h-15 md:w-15 md:h-17 bg-white text-[#2D3436] hover:bg-[#FFEAA7] border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436]'
                    : 'w-13 h-15 md:w-15 md:h-17 bg-[#DFE6E9]/40 border-2 border-dashed border-[#B2BEC3] text-[#B2BEC3]'
                }`}
              >
                {itemKey && meta ? (
                  <>
                    <span className="text-xl md:text-2xl leading-none">{meta.icon}</span>
                    <span className={`text-[8px] md:text-[9px] font-black uppercase truncate max-w-[52px] mt-0.5 ${isEquipped ? 'text-white' : 'text-[#2D3436]'}`}>
                      {meta.name}
                    </span>
                    <span className={`absolute top-1 right-1.5 text-[8px] font-black font-mono ${isEquipped ? 'text-white' : 'text-[#636E72]'}`}>
                      {keyLabel}
                    </span>

                    {count > 0 && itemKey !== 'hands' && (
                      <span className="absolute -bottom-1 -right-1 bg-[#FDCB6E] text-[#2D3436] border-2 border-[#2D3436] text-[8px] font-black px-1.5 py-0.1 rounded-full shadow-[1px_1px_0px_0px_#2D3436]">
                        {count}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] font-mono font-bold">[{keyLabel}]</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
