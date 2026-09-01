/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Package, X, Check, Hand, Sparkles, AlertCircle, ArrowDown, Trash2, Utensils, Move } from 'lucide-react';
import { ToolType } from '../types';

export interface ItemMeta {
  name: string;
  category: 'resource' | 'tool' | 'structure' | 'bait' | 'equipment';
  icon: string;
  description: string;
  isEquippable: boolean;
  isConsumable?: boolean;
  maxStack?: number;
  toolType?: ToolType;
}

export const ITEM_DATABASE: Record<string, ItemMeta> = {
  wood: {
    name: 'Palm Wood',
    category: 'resource',
    icon: '🪵',
    description: 'Sturdy logs chopped from island palm trees. Used for crafting tools, rafts, and structures.',
    isEquippable: false,
    maxStack: 64,
  },
  fiber: {
    name: 'Palm Fiber',
    category: 'resource',
    icon: '🌿',
    description: 'Flexible strands peeled from palm foliage and bushes. Braided into rope and woven into fish traps.',
    isEquippable: false,
    maxStack: 64,
  },
  stone: {
    name: 'Stone Chunk',
    category: 'resource',
    icon: '🪨',
    description: 'Hard mineral chunks mined from rocky outcrop ridges. Used for sturdy tool heads.',
    isEquippable: true,
    toolType: 'stone',
    maxStack: 64,
  },
  rock: {
    name: 'Loose Rock',
    category: 'resource',
    icon: '🪨',
    description: 'Smooth rocks gathered from the beach. Can be thrown or used as blunt hammer.',
    isEquippable: true,
    toolType: 'rock',
    maxStack: 64,
  },
  rope: {
    name: 'Fiber Rope',
    category: 'resource',
    icon: '🪢',
    description: 'Tightly wound tropical cordage essential for bindings, spears, rafts, and fish traps.',
    isEquippable: false,
    maxStack: 64,
  },
  seed: {
    name: 'Palm Seed',
    category: 'resource',
    icon: '🥥',
    description: 'Germinating palm coconut seed. Plant on dry sand to grow a new palm tree in ~30 seconds!',
    isEquippable: true,
    toolType: 'seed',
    maxStack: 32,
  },
  palm_shell: {
    name: 'Palm Shell Bowl',
    category: 'equipment',
    icon: '🥥',
    description: 'Hollowed half-shell that holds seawater. Used to scoop and transport small live fish.',
    isEquippable: true,
    toolType: 'palm_shell',
    maxStack: 8,
  },
  crab: {
    name: 'Shore Crab',
    category: 'bait',
    icon: '🦀',
    description: 'Active crustacean caught on the beach. Excellent bait for fish traps and prized by predatory fish.',
    isEquippable: true,
    toolType: 'crab',
    maxStack: 16,
  },
  fruit: {
    name: 'Lagoon Fruit',
    category: 'bait',
    icon: '🫐',
    description: 'Sweet berry harvested from tropical bushes. Eat for quick energy or use as bait for reef fish.',
    isEquippable: true,
    isConsumable: true,
    toolType: 'fruit',
    maxStack: 32,
  },
  stone_axe: {
    name: 'Stone Axe',
    category: 'tool',
    icon: '🪓',
    description: 'Sharp stone wedge lashed with rope. Chops down standing palm trees into wood and seeds.',
    isEquippable: true,
    toolType: 'stone_axe',
    maxStack: 1,
  },
  stone_pickaxe: {
    name: 'Stone Pickaxe',
    category: 'tool',
    icon: '⛏️',
    description: 'Heavy pointed pick. Breaks large rocky boulders into usable stone chunks.',
    isEquippable: true,
    toolType: 'stone_pickaxe',
    maxStack: 1,
  },
  spear: {
    name: 'Stone Spear',
    category: 'tool',
    icon: '🔱',
    description: 'Lethal thrusting and throwing spear. Right-click to aim, release to throw with underwater trajectory.',
    isEquippable: true,
    toolType: 'spear',
    maxStack: 1,
  },
  fish_trap: {
    name: 'Basic Fish Trap',
    category: 'equipment',
    icon: '🧺',
    description: 'Woven wicker trap. Place in lagoon shallows, add Crab or Fruit bait, and harvest up to 5 trapped fish.',
    isEquippable: true,
    toolType: 'fish_trap',
    maxStack: 4,
  },
  crafting_table: {
    name: 'Workbench Table',
    category: 'structure',
    icon: '🔨',
    description: 'Portable carpentry bench. Place on the ground to unlock advanced recipes.',
    isEquippable: true,
    toolType: 'crafting_table',
    maxStack: 4,
  },
  simple_raft: {
    name: 'Palm Raft',
    category: 'equipment',
    icon: '⛵',
    description: 'Bouyant log raft. Place in water and press E to pilot across the deep lagoon.',
    isEquippable: true,
    toolType: 'simple_raft',
    maxStack: 1,
  },
  raft_sail: {
    name: 'Raft Sail',
    category: 'equipment',
    icon: '⛵',
    description: 'Woven palm-fiber sail. Attach to an existing raft to boost forward sailing speed.',
    isEquippable: true,
    toolType: 'raft_sail',
    maxStack: 2,
  },
  raft_expansion: {
    name: 'Raft Decking',
    category: 'equipment',
    icon: '🪜',
    description: 'Side hull extension that increases your raft platform surface area.',
    isEquippable: true,
    toolType: 'raft_expansion',
    maxStack: 4,
  },
  wood_structure: {
    name: 'Wood Structure',
    category: 'structure',
    icon: '🛖',
    description: 'Modular timber building piece (Floor, Wall, Pillar, Roof). Press R to cycle pieces.',
    isEquippable: true,
    toolType: 'wood_structure',
    maxStack: 64,
  },
  fish: {
    name: 'Fresh Fish',
    category: 'resource',
    icon: '🐟',
    description: 'Freshly caught ocean fish. Process into Fish Meat, craft into Chum, or use as trap bait.',
    isEquippable: true,
    isConsumable: true,
    toolType: 'fish',
    maxStack: 32,
  },
  fish_meat: {
    name: 'Fish Meat',
    category: 'resource',
    icon: '🥩',
    description: 'Fresh, cleaned fish fillets harvested from lagoon catches. Consume for stamina/energy or craft into high-potency Fish Chum.',
    isEquippable: true,
    isConsumable: true,
    toolType: 'fish_meat',
    maxStack: 64,
  },
  live_fish_shell: {
    name: 'Palm Shell (Live Fish)',
    category: 'equipment',
    icon: '🐠',
    description: 'Seawater-filled palm shell carrying a live captured fish. Aim at open water and use Primary Action to release the swimming fish safely!',
    isEquippable: true,
    toolType: 'live_fish_shell',
    maxStack: 1,
  },
  chum: {
    name: 'Fish Chum',
    category: 'bait',
    icon: '🧪',
    description: 'Mashed fish and aromatic sea grass. Toss or release into the ocean to create an attraction scent cloud that draws nearby fish.',
    isEquippable: true,
    toolType: 'chum',
    maxStack: 32,
  },
  sea_grass: {
    name: 'Sea Grass',
    category: 'resource',
    icon: '🌿',
    description: 'Tender aquatic ribbon grass harvested from shallow sandy seabeds and lagoon nurseries. Used in traps and chum.',
    isEquippable: true,
    toolType: 'sea_grass',
    maxStack: 64,
  },
  kelp: {
    name: 'Deep Sea Kelp',
    category: 'resource',
    icon: '🎋',
    description: 'Long golden-amber kelp harvested from deep underwater forests. Used for crafting and attracting herbivore fish.',
    isEquippable: true,
    toolType: 'kelp',
    maxStack: 64,
  },
  scallop: {
    name: 'Live Scallop',
    category: 'bait',
    icon: '🦪',
    description: 'Plump bivalve shellfish gathered from rocky reef shallows. Irresistible bait for reef dwellers and invertebrate feeders.',
    isEquippable: true,
    toolType: 'scallop',
    maxStack: 32,
  },
  barnacle: {
    name: 'Sharp Barnacles',
    category: 'bait',
    icon: '🐚',
    description: 'Crustaceans harvested from submerged rock faces. High-protein bait favored by triggerfish and parrotfish.',
    isEquippable: true,
    toolType: 'barnacle',
    maxStack: 32,
  },
};

export interface GridSlotItem {
  key: string;
  count: number;
}

interface InventoryModalProps {
  inventory: Record<string, number>;
  equippedTool: ToolType;
  hotbarSlots: (string | null)[];
  onUpdateHotbarSlots: (slots: (string | null)[]) => void;
  onSelectTool: (tool: ToolType) => void;
  onDropItem?: (key: string, count: number) => void;
  onConsumeItem?: (key: string) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  equippedTool,
  hotbarSlots,
  onUpdateHotbarSlots,
  onSelectTool,
  onDropItem,
  onConsumeItem,
  onClose,
}) => {
  // Main Backpack slots: 24 slots (4 rows x 6 cols)
  // Hotbar slots: 6 slots (1 row x 6 cols)
  const [backpackSlots, setBackpackSlots] = useState<(string | null)[]>(() => {
    // Collect all owned items
    const ownedKeys = Object.keys(inventory).filter((k) => (inventory[k] || 0) > 0);
    // Keys that are not already in hotbar
    const hotbarSet = new Set(hotbarSlots.filter(Boolean));
    const remaining = ownedKeys.filter((k) => !hotbarSet.has(k));
    
    const slots: (string | null)[] = new Array(24).fill(null);
    remaining.forEach((k, idx) => {
      if (idx < 24) slots[idx] = k;
    });
    return slots;
  });

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<{ type: 'backpack' | 'hotbar'; index: number } | null>(() => {
    // Default select first available item
    const firstHotbar = hotbarSlots.findIndex((k) => k && (inventory[k] || 0) > 0);
    if (firstHotbar !== -1) return { type: 'hotbar', index: firstHotbar };
    const firstBp = backpackSlots.findIndex((k) => k && (inventory[k] || 0) > 0);
    if (firstBp !== -1) return { type: 'backpack', index: firstBp };
    return null;
  });

  const [draggedSlot, setDraggedSlot] = useState<{ type: 'backpack' | 'hotbar'; index: number } | null>(null);

  // Sync backpack slots if inventory changes (remove 0 count items, add newly gathered items)
  useEffect(() => {
    const ownedKeys = Object.keys(inventory).filter((k) => (inventory[k] || 0) > 0);
    const hotbarSet = new Set(hotbarSlots.filter(Boolean) as string[]);

    // Clean hotbar of depleted items
    const updatedHotbar = hotbarSlots.map((k) => (k && (inventory[k] || 0) > 0 ? k : null));
    if (JSON.stringify(updatedHotbar) !== JSON.stringify(hotbarSlots)) {
      onUpdateHotbarSlots(updatedHotbar);
    }

    // Clean and update backpack
    setBackpackSlots((prev) => {
      const next = [...prev];
      // Remove depleted
      for (let i = 0; i < next.length; i++) {
        if (next[i] && (inventory[next[i]!] || 0) <= 0) {
          next[i] = null;
        }
      }
      // Add newly acquired keys not in hotbar or backpack
      const inGrid = new Set([...next.filter(Boolean) as string[], ...updatedHotbar.filter(Boolean) as string[]]);
      const unplaced = ownedKeys.filter((k) => !inGrid.has(k));
      unplaced.forEach((k) => {
        const emptyIdx = next.findIndex((slot) => slot === null);
        if (emptyIdx !== -1) next[emptyIdx] = k;
      });
      return next;
    });
  }, [inventory]);

  // Selected item key and meta
  const selectedKey = selectedSlotIndex
    ? selectedSlotIndex.type === 'hotbar'
      ? hotbarSlots[selectedSlotIndex.index]
      : backpackSlots[selectedSlotIndex.index]
    : null;

  const currentItem: ItemMeta | null = selectedKey
    ? ITEM_DATABASE[selectedKey] || {
        name: selectedKey.replace('_', ' ').toUpperCase(),
        category: 'resource' as const,
        icon: '📦',
        description: 'An item in your pack.',
        isEquippable: false,
        isConsumable: false,
      }
    : null;

  const currentCount = selectedKey ? inventory[selectedKey] || 0 : 0;

  // Move / Swap slot logic
  const handleSlotClick = (targetType: 'backpack' | 'hotbar', targetIdx: number) => {
    if (!selectedSlotIndex) {
      const itemAtTarget = targetType === 'hotbar' ? hotbarSlots[targetIdx] : backpackSlots[targetIdx];
      if (itemAtTarget) {
        setSelectedSlotIndex({ type: targetType, index: targetIdx });
      }
      return;
    }

    // If clicking same slot, keep selected
    if (selectedSlotIndex.type === targetType && selectedSlotIndex.index === targetIdx) {
      return;
    }

    // Move or swap items between selectedSlotIndex and target
    const sourceKey = selectedSlotIndex.type === 'hotbar' 
      ? hotbarSlots[selectedSlotIndex.index] 
      : backpackSlots[selectedSlotIndex.index];

    const targetKey = targetType === 'hotbar' 
      ? hotbarSlots[targetIdx] 
      : backpackSlots[targetIdx];

    if (!sourceKey && !targetKey) {
      setSelectedSlotIndex(null);
      return;
    }

    const nextHotbar = [...hotbarSlots];
    const nextBackpack = [...backpackSlots];

    // Assign source to target and target to source
    if (selectedSlotIndex.type === 'hotbar') {
      nextHotbar[selectedSlotIndex.index] = targetKey;
    } else {
      nextBackpack[selectedSlotIndex.index] = targetKey;
    }

    if (targetType === 'hotbar') {
      nextHotbar[targetIdx] = sourceKey;
    } else {
      nextBackpack[targetIdx] = sourceKey;
    }

    onUpdateHotbarSlots(nextHotbar);
    setBackpackSlots(nextBackpack);
    setSelectedSlotIndex({ type: targetType, index: targetIdx });
  };

  // Drag & Drop handlers
  const handleDragStart = (type: 'backpack' | 'hotbar', index: number) => {
    setDraggedSlot({ type, index });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetType: 'backpack' | 'hotbar', targetIdx: number) => {
    if (!draggedSlot) return;
    if (draggedSlot.type === targetType && draggedSlot.index === targetIdx) {
      setDraggedSlot(null);
      return;
    }

    const sourceKey = draggedSlot.type === 'hotbar' ? hotbarSlots[draggedSlot.index] : backpackSlots[draggedSlot.index];
    const targetKey = targetType === 'hotbar' ? hotbarSlots[targetIdx] : backpackSlots[targetIdx];

    const nextHotbar = [...hotbarSlots];
    const nextBackpack = [...backpackSlots];

    if (draggedSlot.type === 'hotbar') {
      nextHotbar[draggedSlot.index] = targetKey;
    } else {
      nextBackpack[draggedSlot.index] = targetKey;
    }

    if (targetType === 'hotbar') {
      nextHotbar[targetIdx] = sourceKey;
    } else {
      nextBackpack[targetIdx] = sourceKey;
    }

    onUpdateHotbarSlots(nextHotbar);
    setBackpackSlots(nextBackpack);
    setSelectedSlotIndex({ type: targetType, index: targetIdx });
    setDraggedSlot(null);
  };

  const totalOwnedCount = Object.values(inventory).reduce((sum: number, v) => {
    const num = typeof v === 'number' ? v : 0;
    return sum + (num > 0 ? num : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-4xl bg-[#FFEAA7] border-4 border-[#2D3436] rounded-[32px] p-5 md:p-6 shadow-[10px_10px_0px_0px_#2D3436] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header - Minecraft/ARK Clean Brown-Gold Style */}
        <div className="flex items-center justify-between pb-4 border-b-4 border-[#2D3436]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-[#00B894] border-4 border-[#2D3436] flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#2D3436]">
              🎒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-[#2D3436] tracking-tight uppercase">
                  Survival Inventory
                </h2>
                <span className="bg-[#55EFC4] text-[#00B894] border-2 border-[#2D3436] px-2 py-0.5 rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#2D3436]">
                  Grid System
                </span>
              </div>
              <p className="text-xs font-bold text-[#636E72] uppercase tracking-wider mt-0.5">
                {totalOwnedCount} Total Items • Drag, Tap, or Swap Slots
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-[#FF7675] hover:bg-[#D63031] text-white border-4 border-[#2D3436] flex items-center justify-center shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            title="Close Inventory (Esc or E)"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Content Body: Left = Grids (Backpack + Hotbar), Right = Item Detail Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 overflow-y-auto flex-1">
          {/* LEFT: Grids (8 cols on desktop) */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            {/* Section A: Main Backpack Grid (4 x 6 = 24 slots) */}
            <div className="bg-[#F8F9FA] border-4 border-[#2D3436] rounded-2xl p-3.5 shadow-[4px_4px_0px_0px_#2D3436]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-black text-[#2D3436] uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#00B894] stroke-[3]" /> Backpack Slots (24)
                </span>
                <span className="text-[10px] font-bold text-[#636E72]">
                  {backpackSlots.filter(Boolean).length}/24 Filled
                </span>
              </div>

              {/* 4 Rows x 6 Columns */}
              <div className="grid grid-cols-6 gap-2">
                {backpackSlots.map((itemKey, idx) => {
                  const isSelected = selectedSlotIndex?.type === 'backpack' && selectedSlotIndex.index === idx;
                  const meta = itemKey ? ITEM_DATABASE[itemKey] : null;
                  const count = itemKey ? inventory[itemKey] || 0 : 0;
                  const isEquipped = meta?.toolType && equippedTool === meta.toolType;

                  return (
                    <div
                      key={`bp_${idx}`}
                      draggable={!!itemKey}
                      onDragStart={() => handleDragStart('backpack', idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop('backpack', idx)}
                      onClick={() => handleSlotClick('backpack', idx)}
                      className={`relative aspect-square rounded-xl border-3 transition-all select-none cursor-pointer flex flex-col items-center justify-center p-1 ${
                        itemKey
                          ? isSelected
                            ? 'bg-[#74B9FF] border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] scale-105 z-10'
                            : 'bg-white hover:bg-[#FFEAA7] border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]'
                          : 'bg-[#DFE6E9]/50 hover:bg-[#DFE6E9]/90 border-dashed border-[#B2BEC3]'
                      }`}
                    >
                      {itemKey && meta ? (
                        <>
                          <span className="text-2xl md:text-3xl leading-none drop-shadow-sm pointer-events-none">
                            {meta.icon}
                          </span>

                          {/* Stack Count Badge */}
                          <span className="absolute bottom-0.5 right-1 text-[10px] md:text-[11px] font-black text-[#2D3436] bg-[#FDCB6E] px-1 py-0 rounded border border-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436] pointer-events-none leading-none">
                            {count}
                          </span>

                          {/* Equipped Hand Indicator */}
                          {isEquipped && (
                            <div className="absolute top-0.5 left-0.5 bg-[#00B894] text-white p-0.5 rounded border border-[#2D3436] shadow-sm pointer-events-none">
                              <Check className="w-2.5 h-2.5 stroke-[4]" />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#B2BEC3]/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section B: Quick-Access Hotbar (1 x 6 = 6 slots) */}
            <div className="bg-[#FFEAA7]/90 border-4 border-[#2D3436] rounded-2xl p-3.5 shadow-[4px_4px_0px_0px_#2D3436]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-black text-[#2D3436] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E17055] stroke-[3]" /> Hotbar Quick-Access (Slots 1-6)
                </span>
                <span className="text-[10px] font-bold text-[#636E72]">
                  Equip with keys [1 - 6]
                </span>
              </div>

              {/* 1 Row x 6 Columns */}
              <div className="grid grid-cols-6 gap-2">
                {hotbarSlots.map((itemKey, idx) => {
                  const isSelected = selectedSlotIndex?.type === 'hotbar' && selectedSlotIndex.index === idx;
                  const meta = itemKey ? ITEM_DATABASE[itemKey] : null;
                  const count = itemKey ? inventory[itemKey] || 0 : 0;
                  const isEquipped = meta?.toolType && equippedTool === meta.toolType;

                  return (
                    <div
                      key={`hb_${idx}`}
                      draggable={!!itemKey}
                      onDragStart={() => handleDragStart('hotbar', idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop('hotbar', idx)}
                      onClick={() => handleSlotClick('hotbar', idx)}
                      className={`relative aspect-square rounded-xl border-3 transition-all select-none cursor-pointer flex flex-col items-center justify-center p-1 ${
                        itemKey
                          ? isSelected
                            ? 'bg-[#55EFC4] border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] scale-105 z-10'
                            : 'bg-white hover:bg-[#FFF] border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]'
                          : 'bg-[#DFE6E9]/40 hover:bg-[#DFE6E9]/80 border-dashed border-[#B2BEC3]'
                      }`}
                    >
                      {/* Hotkey Number Badge in Corner */}
                      <span className="absolute top-0.5 right-1 text-[9px] font-black font-mono text-[#636E72] pointer-events-none">
                        {idx + 1}
                      </span>

                      {itemKey && meta ? (
                        <>
                          <span className="text-2xl md:text-3xl leading-none drop-shadow-sm pointer-events-none">
                            {meta.icon}
                          </span>

                          {/* Stack Count Badge */}
                          <span className="absolute bottom-0.5 right-1 text-[10px] md:text-[11px] font-black text-[#2D3436] bg-[#FDCB6E] px-1 py-0 rounded border border-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436] pointer-events-none leading-none">
                            {count}
                          </span>

                          {/* Equipped Hand Indicator */}
                          {isEquipped && (
                            <div className="absolute top-0.5 left-0.5 bg-[#00B894] text-white p-0.5 rounded border border-[#2D3436] shadow-sm pointer-events-none">
                              <Check className="w-2.5 h-2.5 stroke-[4]" />
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] font-mono text-[#B2BEC3] font-bold">[{idx + 1}]</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Selected Item Detail Card (5 cols on desktop) */}
          <div className="md:col-span-5 bg-white rounded-2xl border-4 border-[#2D3436] p-4 md:p-5 flex flex-col justify-between shadow-[5px_5px_0px_0px_#2D3436] min-h-[300px]">
            {currentItem && selectedKey ? (
              <div className="flex flex-col h-full justify-between space-y-4">
                {/* Header Information */}
                <div>
                  <div className="flex items-center gap-3.5 pb-3 border-b-3 border-[#DFE6E9]">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#FFEAA7] border-3 border-[#2D3436] flex items-center justify-center text-3xl md:text-4xl shadow-[3px_3px_0px_0px_#2D3436] flex-shrink-0">
                      {currentItem.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg md:text-xl font-black text-[#2D3436] leading-tight truncate">
                        {currentItem.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#DFE6E9] text-[#2D3436] border border-[#2D3436]">
                          {currentItem.category}
                        </span>
                        {currentItem.isEquippable && (
                          <span className="text-[10px] font-black uppercase text-[#00B894]">
                            • Equippable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Stack info */}
                  <div className="mt-3 space-y-2.5">
                    <div className="flex justify-between items-center py-2 px-3 bg-[#F8F9FA] rounded-xl border-2 border-[#DFE6E9] text-xs font-black text-[#2D3436]">
                      <span>Amount in Possession:</span>
                      <span className="text-[#00B894] font-black text-sm bg-[#55EFC4]/30 px-2 py-0.5 rounded-lg border border-[#00B894]">
                        × {currentCount}
                      </span>
                    </div>

                    <p className="text-xs text-[#636E72] font-semibold leading-relaxed p-1 bg-[#F8F9FA] rounded-xl border border-[#DFE6E9]/60">
                      {currentItem.description}
                    </p>
                  </div>
                </div>

                {/* Action Buttons Area */}
                <div className="pt-3 border-t-3 border-[#DFE6E9] space-y-2">
                  {/* Action 1: Equip in hand if tool or equippable */}
                  {currentItem.isEquippable && currentItem.toolType && (
                    <button
                      onClick={() => {
                        if (currentItem.toolType) {
                          onSelectTool(currentItem.toolType);
                        }
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl border-3 border-[#2D3436] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer ${
                        equippedTool === currentItem.toolType
                          ? 'bg-[#55EFC4] text-[#2D3436]'
                          : 'bg-[#00B894] hover:bg-[#55EFC4] text-white hover:text-[#2D3436]'
                      }`}
                    >
                      {equippedTool === currentItem.toolType ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          Currently In Hand
                        </>
                      ) : (
                        <>
                          <Hand className="w-4 h-4 text-white" />
                          Hold In Hand
                        </>
                      )}
                    </button>
                  )}

                  {/* Action 2: Eat / Consume if food */}
                  {currentItem.isConsumable && (
                    <button
                      onClick={() => {
                        if (onConsumeItem && selectedKey) {
                          onConsumeItem(selectedKey);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border-3 border-[#2D3436] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-[#FDCB6E] hover:bg-[#FFEAA7] text-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                    >
                      <Utensils className="w-4 h-4 stroke-[3]" />
                      Eat / Consume 1
                    </button>
                  )}

                  {/* Action 3: Drop / Toss to Ground */}
                  {onDropItem && currentCount > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (selectedKey) onDropItem(selectedKey, 1);
                        }}
                        className="py-2 px-2.5 rounded-xl border-2 border-[#2D3436] text-[11px] font-black uppercase tracking-tight flex items-center justify-center gap-1.5 bg-[#DFE6E9] hover:bg-[#FF7675] hover:text-white text-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                        Drop 1
                      </button>

                      <button
                        onClick={() => {
                          if (selectedKey) onDropItem(selectedKey, currentCount);
                        }}
                        className="py-2 px-2.5 rounded-xl border-2 border-[#2D3436] text-[11px] font-black uppercase tracking-tight flex items-center justify-center gap-1.5 bg-[#DFE6E9] hover:bg-[#FF7675] hover:text-white text-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[3]" />
                        Drop All ({currentCount})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Package className="w-10 h-10 text-[#B2BEC3] stroke-[2]" />
                <p className="text-xs font-black uppercase text-[#636E72]">No Slot Selected</p>
                <p className="text-[11px] font-semibold text-[#B2BEC3] max-w-xs leading-relaxed">
                  Click or tap any filled slot on the left to inspect, equip in hand, or drop items.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="mt-4 pt-3 border-t-3 border-[#2D3436]/20 flex items-center justify-between text-[11px] font-black text-[#636E72] flex-wrap gap-2">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-[#2D3436] rounded font-mono text-[#2D3436]">E</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-[#2D3436] rounded font-mono text-[#2D3436]">I</kbd> to toggle inventory</span>
          <span>Hold hands empty: <button onClick={() => onSelectTool('hands')} className="underline font-black text-[#2D3436] cursor-pointer">Bare Hands</button></span>
        </div>
      </div>
    </div>
  );
};
