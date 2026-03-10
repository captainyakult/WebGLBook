"use client";

import { Ship } from "@/lib/types";

const TYPE_EMOJI: Record<string, string> = {
  Cargo: "\u{1F4E6}",
  Tanker: "\u{1F6E2}\uFE0F",
  Passenger: "\u{1F6F3}\uFE0F",
  Fishing: "\u{1F3A3}",
  Military: "\u2693",
  Other: "\u{1F6A2}",
};

export function shipPopupHTML(ship: Ship): string {
  const emoji = TYPE_EMOJI[ship.type] || "\u{1F6A2}";
  return `
    <div style="font-family: system-ui, sans-serif; min-width: 180px;">
      <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px; color: #1a1a2e;">
        ${emoji} ${ship.name}
      </div>
      <div style="display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; font-size: 12px; color: #444;">
        <span style="color: #888;">MMSI</span><span>${ship.id}</span>
        <span style="color: #888;">Type</span><span>${ship.type}</span>
        <span style="color: #888;">Speed</span><span>${ship.speed} kn</span>
        <span style="color: #888;">Heading</span><span>${ship.heading}°</span>
        <span style="color: #888;">Position</span><span>${ship.lat.toFixed(4)}, ${ship.lon.toFixed(4)}</span>
      </div>
    </div>
  `;
}
