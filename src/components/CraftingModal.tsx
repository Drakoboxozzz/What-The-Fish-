/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CRAFTING_RECIPES } from '../data/fishData';
import { CraftingRecipe } from '../types';
import { sound } from '../audio/soundEngine';
import { X, Hammer, Compass, Wrench } from 'lucide-react';

interface CraftingModalProps {
  resources: {
    wood: number;
    rock: number;
    stone?: number;
    fiber: number;
    rope: number;
    seed: number;
    palm_shell?: number;
    fish?: number;
    sea_grass?: number;
    kelp?: number;
  };
  isNearCraftingTable?: boolean;
  onCraft: (recipe: CraftingRecipe) => void;
  onClose: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  resources,
  isNearCraftingTable = true,
  onCraft,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pocket' | 'crafting_table'>('all');

  const canCraft = (recipe: CraftingRecipe) => {
    // Station check
    if (recipe.station === 'crafting_table' && !isNearCraftingTable) {
      return false;
    }

    const req = recipe.requirements;
    if (req.wood && (resources.wood || 0) < req.wood) return false;
    if (req.rock && (resources.rock || 0) < req.rock) return false;
    if (req.stone && ((resources.stone || 0) + (resources.rock || 0)) < req.stone) return false;
    if (req.fiber && (resources.fiber || 0) < req.fiber) return false;
    if (req.rope && (resources.rope || 0) < req.rope) return false;
    if (req.seed && (resources.seed || 0) < req.seed) return false;
    if (req.palm_shell && (resources.palm_shell || 0) < req.palm_shell) return false;
    if (req.fish && (resources.fish || 0) < req.fish) return false;
    if (req.sea_grass && (resources.sea_grass || 0) < req.sea_grass) return false;
    if (req.kelp && (resources.kelp || 0) < req.kelp) return false;
    return true;
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    if (canCraft(recipe)) {
      sound.playInstantCatchChime();
      onCraft(recipe);
    }
  };

  const filteredRecipes = CRAFTING_RECIPES.filter((r) => {
    if (activeTab === 'all') return true;
    return r.station === activeTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D3436]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white border-4 border-[#2D3436] rounded-[36px] max-w-2xl w-full max-h-[90vh] text-[#2D3436] shadow-[10px_10px_0px_0px_#2D3436] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b-4 border-[#2D3436] flex items-center justify-between bg-[#FFEAA7]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#55EFC4] border-3 border-[#2D3436] flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_0px_#2D3436]">
              🛠️
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-[#2D3436] uppercase flex items-center gap-2">
                Survival Crafting Blueprint
              </h2>
              <p className="text-xs font-bold text-[#636E72]">
                Craft primitive tools, palm rafts, sails, and workbench stations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white hover:bg-[#FF7675] hover:text-white text-[#2D3436] border-3 border-[#2D3436] flex items-center justify-center transition-all cursor-pointer shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#2D3436]"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-2.5 bg-[#FFF9E6] border-b-3 border-[#2D3436] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black border-2 border-[#2D3436] transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#55EFC4] text-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]'
                  : 'bg-white text-[#636E72]'
              }`}
            >
              All Blueprints
            </button>
            <button
              onClick={() => setActiveTab('pocket')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black border-2 border-[#2D3436] transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pocket'
                  ? 'bg-[#FDCB6E] text-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]'
                  : 'bg-white text-[#636E72]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Pocket Crafts
            </button>
            <button
              onClick={() => setActiveTab('crafting_table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black border-2 border-[#2D3436] transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'crafting_table'
                  ? 'bg-[#74B9FF] text-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]'
                  : 'bg-white text-[#636E72]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Crafting Table Station
            </button>
          </div>

          <div className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-white border-2 border-[#2D3436]">
            {isNearCraftingTable ? '🔨 Crafting Table: Active' : '📍 Workbench: Out of range'}
          </div>
        </div>

        {/* Supplies Resource Bar */}
        <div className="px-6 py-3 bg-[#DFE6E9]/40 border-b-3 border-[#2D3436] flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <span className="text-[#2D3436] font-black uppercase text-[10px] tracking-wider shrink-0">
            Supplies:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#FDCB6E] border-2 border-[#2D3436] px-2.5 py-0.5 rounded-xl flex items-center gap-1 font-black text-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]">
              🪵 Wood: <strong>{resources.wood || 0}</strong>
            </span>
            <span className="bg-white border-2 border-[#2D3436] px-2.5 py-0.5 rounded-xl flex items-center gap-1 font-black text-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]">
              🪨 Stone: <strong>{(resources.stone || 0) + (resources.rock || 0)}</strong>
            </span>
            <span className="bg-[#55EFC4] border-2 border-[#2D3436] px-2.5 py-0.5 rounded-xl flex items-center gap-1 font-black text-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]">
              🌿 Fiber: <strong>{resources.fiber || 0}</strong>
            </span>
            <span className="bg-[#FAB1A0] border-2 border-[#2D3436] px-2.5 py-0.5 rounded-xl flex items-center gap-1 font-black text-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]">
              🪢 Rope: <strong>{resources.rope || 0}</strong>
            </span>
            <span className="bg-[#FFEAA7] border-2 border-[#2D3436] px-2.5 py-0.5 rounded-xl flex items-center gap-1 font-black text-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]">
              🥥 Shell: <strong>{resources.palm_shell || 0}</strong>
            </span>
            {(resources.fish || 0) > 0 && (
              <span className="bg-[#74B9FF] border-2 border-[#2D3436] px-2.5 py-0.5 rounded-xl flex items-center gap-1 font-black text-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]">
                🐟 Fish: <strong>{resources.fish || 0}</strong>
              </span>
            )}
            {(resources.sea_grass || 0) > 0 && (
              <span className="bg-[#A8E6CF] border-2 border-[#2D3436] px-2.5 py-0.5 rounded-xl flex items-center gap-1 font-black text-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]">
                🌿 Grass: <strong>{resources.sea_grass || 0}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Recipes List */}
        <div className="p-6 overflow-y-auto space-y-3 bg-[#F8F9FA] max-h-[58vh]">
          {filteredRecipes.map((recipe) => {
            const affordable = canCraft(recipe);
            const isWorkbench = recipe.station === 'crafting_table';

            return (
              <div
                key={recipe.id}
                className={`p-4 rounded-3xl border-3 border-[#2D3436] transition-all flex items-center justify-between gap-4 ${
                  affordable
                    ? 'bg-white shadow-[4px_4px_0px_0px_#2D3436] hover:-translate-y-0.5'
                    : 'bg-[#DFE6E9]/40 border-dashed border-[#B2BEC3] opacity-60 shadow-none'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#FFEAA7] border-3 border-[#2D3436] flex items-center justify-center text-2xl shrink-0 shadow-[2px_2px_0px_0px_#2D3436]">
                    {recipe.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-[#2D3436] uppercase tracking-tight">
                        {recipe.resultName}
                      </h4>
                      {isWorkbench && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#74B9FF] text-white border border-[#2D3436]">
                          Workbench
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#636E72] font-semibold mt-0.5 max-w-sm leading-relaxed">
                      {recipe.description}
                    </p>
                    
                    {/* Material Cost Pills */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {recipe.requirements.wood && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black border-2 border-[#2D3436] ${
                          (resources.wood || 0) >= recipe.requirements.wood ? 'bg-[#FDCB6E] text-[#2D3436]' : 'bg-[#FF7675] text-white'
                        }`}>
                          🪵 {recipe.requirements.wood} Wood
                        </span>
                      )}
                      {recipe.requirements.rock && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black border-2 border-[#2D3436] ${
                          (resources.rock || 0) >= recipe.requirements.rock ? 'bg-white text-[#2D3436]' : 'bg-[#FF7675] text-white'
                        }`}>
                          🪨 {recipe.requirements.rock} Rock
                        </span>
                      )}
                      {recipe.requirements.stone && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black border-2 border-[#2D3436] ${
                          ((resources.stone || 0) + (resources.rock || 0)) >= recipe.requirements.stone ? 'bg-white text-[#2D3436]' : 'bg-[#FF7675] text-white'
                        }`}>
                          🪨 {recipe.requirements.stone} Stone
                        </span>
                      )}
                      {recipe.requirements.fiber && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black border-2 border-[#2D3436] ${
                          (resources.fiber || 0) >= recipe.requirements.fiber ? 'bg-[#55EFC4] text-[#2D3436]' : 'bg-[#FF7675] text-white'
                        }`}>
                          🌿 {recipe.requirements.fiber} Fiber
                        </span>
                      )}
                      {recipe.requirements.rope && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black border-2 border-[#2D3436] ${
                          (resources.rope || 0) >= recipe.requirements.rope ? 'bg-[#FAB1A0] text-[#2D3436]' : 'bg-[#FF7675] text-white'
                        }`}>
                          🪢 {recipe.requirements.rope} Rope
                        </span>
                      )}
                      {recipe.requirements.palm_shell && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black border-2 border-[#2D3436] ${
                          (resources.palm_shell || 0) >= recipe.requirements.palm_shell ? 'bg-[#FFEAA7] text-[#2D3436]' : 'bg-[#FF7675] text-white'
                        }`}>
                          🥥 {recipe.requirements.palm_shell} Shell
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  disabled={!affordable}
                  onClick={() => handleCraft(recipe)}
                  className={`px-4.5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 uppercase tracking-wider ${
                    affordable
                      ? 'bg-[#55EFC4] hover:bg-[#00B894] text-[#2D3436] border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#2D3436] cursor-pointer'
                      : 'bg-[#DFE6E9] text-[#B2BEC3] border-2 border-[#B2BEC3] cursor-not-allowed'
                  }`}
                >
                  <Hammer className="w-4 h-4 stroke-[3]" />
                  Craft
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
