/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FISH_SPECIES } from '../data/fishData';
import { FishRecord, CatchMethod } from '../types';
import { X, CheckCircle2, Circle, Sparkles, Compass, Ruler } from 'lucide-react';

interface FishodexModalProps {
  records: Record<string, FishRecord>;
  onClose: () => void;
}

const METHODS: { key: CatchMethod; label: string; icon: string }[] = [
  { key: 'hands', label: 'Hands', icon: '🖐️' },
  { key: 'spear', label: 'Spear', icon: '🔱' },
  { key: 'palm_shell', label: 'Shell', icon: '🥥' },
  { key: 'trap', label: 'Trap', icon: '🧺' },
  { key: 'rod', label: 'Rod', icon: '🎣' },
];

export const FishodexModal: React.FC<FishodexModalProps> = ({ records, onClose }) => {
  const [selectedFishId, setSelectedFishId] = useState<string>(FISH_SPECIES[0].id);

  const selectedSpecies = FISH_SPECIES.find((f) => f.id === selectedFishId) || FISH_SPECIES[0];
  const currentRecord = records[selectedSpecies.id] || {
    speciesId: selectedSpecies.id,
    caught: false,
    count: 0,
    maxSizeCm: 0,
    caughtMethods: { rod: false, spear: false, hands: false, trap: false, palm_shell: false },
  };

  // Total discovery stats
  const recordList = Object.values(records) as FishRecord[];
  const caughtSpeciesCount = recordList.filter((r) => r.caught).length;
  let totalMethodsCompleted = 0;
  recordList.forEach((r) => {
    Object.values(r.caughtMethods).forEach((val) => {
      if (val) totalMethodsCompleted++;
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D3436]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white border-4 border-[#2D3436] rounded-[36px] max-w-4xl w-full h-[85vh] max-h-[680px] text-[#2D3436] shadow-[10px_10px_0px_0px_#2D3436] flex flex-col overflow-hidden">
        {/* Header - Vibrant Sunny Banner */}
        <div className="px-6 py-4 border-b-4 border-[#2D3436] flex items-center justify-between bg-[#FFEAA7]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FF7675] border-3 border-[#2D3436] flex items-center justify-center text-white text-xl font-black shadow-[2px_2px_0px_0px_#2D3436]">
              📖
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-[#2D3436] flex items-center gap-2 uppercase">
                Fishodex — Lagoon Species
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#55EFC4] text-[#00B894] border-2 border-[#2D3436] font-black uppercase shadow-[1px_1px_0px_0px_#2D3436]">
                  Ecosystem Update
                </span>
              </h2>
              <p className="text-xs font-bold text-[#636E72]">
                Species Discovered: <strong className="text-[#00B894]">{caughtSpeciesCount}/{FISH_SPECIES.length}</strong> • Methods Mastered: <strong className="text-[#FF7675]">{totalMethodsCompleted}/{FISH_SPECIES.length * METHODS.length}</strong>
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

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-[#F8F9FA]">
          {/* Left Species List */}
          <div className="md:col-span-5 border-r-4 border-[#2D3436] overflow-y-auto p-4 space-y-2 bg-[#DFE6E9]/40">
            {FISH_SPECIES.map((fish) => {
              const rec = records[fish.id];
              const isCaught = rec?.caught;
              const isSelected = fish.id === selectedFishId;
              const methodsCount = rec ? Object.values(rec.caughtMethods).filter(Boolean).length : 0;

              return (
                <button
                  key={fish.id}
                  onClick={() => setSelectedFishId(fish.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 cursor-pointer border-3 border-[#2D3436] ${
                    isSelected
                      ? 'bg-[#74B9FF] text-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] -translate-y-0.5'
                      : 'bg-white text-[#2D3436] hover:bg-[#FFEAA7] shadow-[2px_2px_0px_0px_#2D3436]'
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 border-2 border-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]"
                    style={{
                      backgroundColor: isCaught ? `${fish.primaryColor}33` : '#DFE6E9',
                    }}
                  >
                    {isCaught ? '🐟' : '❓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black truncate text-[#2D3436]">
                        {isCaught ? fish.name : 'Unknown Fish'}
                      </p>
                      {methodsCount === METHODS.length && (
                        <span className="text-[9px] bg-[#FDCB6E] text-[#2D3436] px-1.5 py-0.5 rounded-lg border-2 border-[#2D3436] font-black">
                          MASTERED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-[#636E72] truncate">
                      {isCaught ? fish.habitat : 'Explore lagoon to discover'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Species Detail */}
          <div className="md:col-span-7 p-6 overflow-y-auto bg-white flex flex-col justify-between">
            {currentRecord.caught ? (
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0097A7] bg-[#4DD0E1]/20 border border-[#0097A7] px-2 py-0.5 rounded-md">
                      Species Entry
                    </span>
                    <h3 className="text-2xl font-black text-[#2D3436] tracking-tight mt-1">{selectedSpecies.name}</h3>
                    <p className="text-xs italic text-[#FF7675] font-bold">
                      {selectedSpecies.scientificName}
                    </p>
                  </div>
                  <div className="text-right bg-[#55EFC4]/30 border-3 border-[#2D3436] px-3.5 py-2 rounded-2xl shadow-[3px_3px_0px_0px_#2D3436]">
                    <span className="text-[10px] uppercase text-[#2D3436] block font-black">Record Catch</span>
                    <span className="text-base font-black text-[#00B894] flex items-center justify-end gap-1">
                      <Ruler className="w-4 h-4 stroke-[3]" />
                      {currentRecord.maxSizeCm} cm
                    </span>
                  </div>
                </div>

                {/* Habitat & Behavior Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#DFE6E9]/40 p-3 rounded-2xl border-3 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]">
                    <span className="text-[#0097A7] flex items-center gap-1.5 font-black uppercase text-[10px] mb-1">
                      <Compass className="w-3.5 h-3.5 stroke-[3]" /> Habitat
                    </span>
                    <span className="text-[#2D3436] font-bold">{selectedSpecies.habitat}</span>
                  </div>
                  <div className="bg-[#DFE6E9]/40 p-3 rounded-2xl border-3 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]">
                    <span className="text-[#FDCB6E] flex items-center gap-1.5 font-black uppercase text-[10px] mb-1">
                      <Sparkles className="w-3.5 h-3.5 stroke-[3] text-[#2D3436]" /> Typical Size
                    </span>
                    <span className="text-[#2D3436] font-bold">
                      {selectedSpecies.minSizeCm} – {selectedSpecies.maxSizeCm} cm
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#2D3436] font-medium leading-relaxed bg-[#F8F9FA] p-3.5 rounded-2xl border-3 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]">
                  {selectedSpecies.description}
                </p>

                {/* Field Note */}
                <div className="bg-[#FFEAA7] border-3 border-[#2D3436] p-3.5 rounded-2xl text-xs text-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436]">
                  <strong className="text-[#D63031] block mb-0.5 uppercase tracking-wider font-black text-[11px]">
                    Field Note:
                  </strong>
                  <p className="font-semibold">{selectedSpecies.funFact}</p>
                </div>

                {/* Caught With Matrix */}
                <div>
                  <h4 className="text-xs font-black text-[#2D3436] uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Caught With Methods:</span>
                    <span className="text-[#00B894] font-black">
                      {Object.values(currentRecord.caughtMethods).filter(Boolean).length}/{METHODS.length} Unlocked
                    </span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map((m) => {
                      const isCompleted = currentRecord.caughtMethods[m.key];
                      return (
                        <div
                          key={m.key}
                          className={`p-2.5 rounded-2xl border-3 border-[#2D3436] flex items-center gap-2 text-xs transition-colors shadow-[2px_2px_0px_0px_#2D3436] ${
                            isCompleted
                              ? 'bg-[#55EFC4] text-[#2D3436] font-black'
                              : 'bg-[#DFE6E9] text-[#636E72] font-bold opacity-60'
                          }`}
                        >
                          <span className="text-lg">{m.icon}</span>
                          <span className="truncate flex-1">{m.label}</span>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-[#00B894] stroke-[3] shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#B2BEC3] stroke-[2] shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-20 h-20 rounded-3xl bg-[#DFE6E9] border-4 border-[#2D3436] flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_#2D3436]">
                  ❓
                </div>
                <h3 className="text-lg font-black uppercase text-[#2D3436]">Undiscovered Species</h3>
                <p className="text-xs font-bold text-[#636E72] max-w-xs leading-relaxed">
                  This species has not been caught yet. Explore the desert island lagoon with different tools or rafts to catch and catalogue it!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
