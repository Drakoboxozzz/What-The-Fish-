/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CaughtEvent } from '../types';
import { Sparkles, Trophy, Check } from 'lucide-react';

interface CatchCelebrationProps {
  event: CaughtEvent | null;
  onDismiss: () => void;
}

export const CatchCelebration: React.FC<CatchCelebrationProps> = ({ event, onDismiss }) => {
  useEffect(() => {
    if (event) {
      // Fire celebratory mini confetti
      confetti({
        particleCount: event.method === 'bucket' ? 60 : 35,
        spread: 60,
        origin: { y: 0.35 },
        colors: ['#FF7675', '#55EFC4', '#FDCB6E', '#74B9FF', '#FFEAA7'],
      });

      // Non-blocking auto dismiss after 2.6s
      const timer = setTimeout(() => {
        onDismiss();
      }, 2600);

      return () => clearTimeout(timer);
    }
  }, [event, onDismiss]);

  if (!event) return null;

  const methodIcons: Record<string, string> = {
    rod: '🎣 Rod',
    net: '🕸️ Net',
    spear: '🔱 Spear',
    hands: '🖐️ Bare Hands',
    bucket: '🪣 Bucket',
    trap: '🧺 Trap',
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer animate-in fade-in slide-in-from-top-4 duration-200 font-sans select-none"
    >
      <div className="bg-white border-4 border-[#2D3436] rounded-3xl p-4 md:px-6 md:py-4 shadow-[8px_8px_0px_0px_#2D3436] flex items-center gap-4 text-[#2D3436] hover:scale-[1.02] transition-transform">
        {/* Fish Color Badge */}
        <div
          className="w-13 h-13 rounded-2xl flex items-center justify-center text-3xl border-3 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]"
          style={{ backgroundColor: `${event.species.primaryColor}33` }}
        >
          🐟
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF7675] text-white text-[10px] font-black uppercase tracking-wider border-2 border-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]">
              <Sparkles className="w-3 h-3 stroke-[3]" />
              Fish Caught!
            </span>
            {event.firstTimeForSpecies && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#55EFC4] text-[#2D3436] text-[10px] font-black uppercase tracking-wider border-2 border-[#2D3436] shadow-[1px_1px_0px_0px_#2D3436]">
                <Trophy className="w-3 h-3 stroke-[3]" />
                New!
              </span>
            )}
          </div>

          <h2 className="text-lg md:text-xl font-black uppercase text-[#2D3436] tracking-tight mt-0.5">
            {event.species.name} <span className="text-[#00B894] font-black">({event.sizeCm} cm)</span>
          </h2>
          <div className="flex items-center gap-3 text-xs font-bold text-[#636E72]">
            <span>Method: <strong className="text-[#2D3436]">{methodIcons[event.method] || event.method}</strong></span>
            <span className="italic text-[10px] text-[#FF7675]">{event.species.scientificName}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="ml-2 w-8 h-8 rounded-xl bg-[#DFE6E9] hover:bg-[#55EFC4] text-[#2D3436] border-2 border-[#2D3436] flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_0px_#2D3436] cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[4]" />
        </button>
      </div>
    </div>
  );
};
