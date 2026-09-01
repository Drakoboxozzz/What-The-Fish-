/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, MousePointer, Waves, Sparkles, Hammer, Anchor } from 'lucide-react';

interface ControlsGuideProps {
  onClose: () => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D3436]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white border-4 border-[#2D3436] rounded-[36px] max-w-xl w-full text-[#2D3436] shadow-[10px_10px_0px_0px_#2D3436] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b-4 border-[#2D3436] flex items-center justify-between bg-[#FFEAA7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#74B9FF] border-3 border-[#2D3436] flex items-center justify-center text-xl font-black shadow-[2px_2px_0px_0px_#2D3436]">
              🎮
            </div>
            <h2 className="text-base font-black tracking-tight text-[#2D3436] uppercase">
              Island Controls & Survival Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white hover:bg-[#FF7675] hover:text-white text-[#2D3436] border-3 border-[#2D3436] flex items-center justify-center transition-all cursor-pointer shadow-[3px_3px_0px_0px_#2D3436] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#2D3436]"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[72vh] bg-[#F8F9FA]">
          {/* Movement */}
          <div className="bg-white p-4 rounded-2xl border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436]">
            <h3 className="font-black text-[#0097A7] mb-2.5 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 stroke-[3]" /> Island Exploration & Movement
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[#2D3436] font-semibold">
              <div><kbd className="px-2 py-0.5 bg-[#DFE6E9] rounded-lg border-2 border-[#2D3436] text-[#2D3436] font-mono font-black">W A S D</kbd> : Move / Steer Raft</div>
              <div><kbd className="px-2 py-0.5 bg-[#DFE6E9] rounded-lg border-2 border-[#2D3436] text-[#2D3436] font-mono font-black">Mouse</kbd> : Look Around</div>
              <div><kbd className="px-2 py-0.5 bg-[#DFE6E9] rounded-lg border-2 border-[#2D3436] text-[#2D3436] font-mono font-black">Left Click</kbd> : Action / Use Tool</div>
              <div><kbd className="px-2 py-0.5 bg-[#DFE6E9] rounded-lg border-2 border-[#2D3436] text-[#2D3436] font-mono font-black">Right Click / R</kbd> : Throw Spear / Rock</div>
              <div><kbd className="px-2 py-0.5 bg-[#DFE6E9] rounded-lg border-2 border-[#2D3436] text-[#2D3436] font-mono font-black">E</kbd> : Board / Disembark Raft</div>
              <div><kbd className="px-2 py-0.5 bg-[#DFE6E9] rounded-lg border-2 border-[#2D3436] text-[#2D3436] font-mono font-black">Shift</kbd> : Sprint</div>
              <div><kbd className="px-2 py-0.5 bg-[#DFE6E9] rounded-lg border-2 border-[#2D3436] text-[#2D3436] font-mono font-black">C</kbd> : Sneak (Crouch / Stealth)</div>
              <div><kbd className="px-2 py-0.5 bg-[#DFE6E9] rounded-lg border-2 border-[#2D3436] text-[#2D3436] font-mono font-black">V</kbd> : Toggle 1st / 3rd Person View</div>
              <div><kbd className="px-2 py-0.5 bg-[#DFE6E9] rounded-lg border-2 border-[#2D3436] text-[#2D3436] font-mono font-black">1 - 0</kbd> : Select Tool</div>
            </div>
          </div>

          {/* Gathering & Mining */}
          <div className="bg-white p-4 rounded-2xl border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] space-y-2">
            <h3 className="font-black text-[#00B894] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 stroke-[3]" /> Gathering & Stone Mining
            </h3>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              ⚠️ <strong className="font-black text-[#FF7675]">No Punching Trees:</strong> Bare hands cannot fell trees! Use 🪨 <strong>Rocks</strong> or craft a 🪓 <strong>Stone Axe</strong> to chop down palm trees into physical logs and seeds.
            </p>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              ⛏️ <strong>Stone Mining:</strong> Craft a <strong>Stone Pickaxe</strong> or Axe to smash large boulders on the rocky outcrop ridge into usable Stone chunks!
            </p>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              🦀 <strong>Shore Crabs:</strong> Catch along sandy shores to use as fishing bait for traps and rods or as valuable island resources.
            </p>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              🧺 <strong>Fish Traps:</strong> Place in lagoon shallows and insert 🦀 Crab or 🫐 Fruit as bait. Attracted fish swim inside and stay trapped (up to 5 fish capacity) until harvested.
            </p>
          </div>

          {/* Rafting & Navigation */}
          <div className="bg-white p-4 rounded-2xl border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] space-y-2">
            <h3 className="font-black text-[#00CEC9] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 stroke-[3]" /> Palm Raft & Lagoon Navigation
            </h3>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              ⛵ <strong>Simple Raft:</strong> Place in lagoon water to explore deeper outer reefs. Press <kbd className="px-1.5 py-0.2 bg-[#DFE6E9] rounded border border-[#2D3436] font-mono font-bold">E</kbd> to board and WASD to sail.
            </p>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              ⛵ <strong>Upgrades:</strong> Attach a <strong>Woven Palm Sail</strong> for high speed or a <strong>Raft Expansion</strong> platform for stable multi-angle fishing.
            </p>
          </div>

          {/* Fishing methods */}
          <div className="bg-white p-4 rounded-2xl border-3 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436] space-y-2">
            <h3 className="font-black text-[#FF7675] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 stroke-[3]" /> Fair & Forgiving Fishing
            </h3>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              <strong className="font-black">🖐️ Bare Hands:</strong> Catch radius is fair and responsive! When you get close, click to grab fish effortlessly. Slow fish like Trunkfish and Flounder are easily caught by hand.
            </p>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              <strong className="font-black">🥥 Palm Shell:</strong> Scoop small live fish into empty coconut shells for safe transport and release.
            </p>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              <strong className="font-black">🔱 Stone Spear:</strong> Right-Click / [R] to launch ballistic throws at distance, or Left-Click for precision shallow jabs.
            </p>
            <p className="text-[#2D3436] font-medium leading-relaxed">
              <strong className="font-black">🎣 Fishing Rod:</strong> Cast bobber into lagoon and tap rapidly when hooked to keep tension in the green sweet spot!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
