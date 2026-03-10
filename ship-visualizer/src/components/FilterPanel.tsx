"use client";

import { VesselFilter } from "@/lib/types";

const FILTERS: VesselFilter[] = [
  "All",
  "Cargo",
  "Tanker",
  "Passenger",
  "Fishing",
  "Military",
  "Other",
];

const FILTER_COLORS: Record<VesselFilter, string> = {
  All: "bg-gray-600",
  Cargo: "bg-blue-600",
  Tanker: "bg-red-600",
  Passenger: "bg-green-600",
  Fishing: "bg-yellow-600",
  Military: "bg-purple-600",
  Other: "bg-gray-500",
};

export default function FilterPanel({
  active,
  onChange,
  counts,
}: {
  active: VesselFilter;
  onChange: (f: VesselFilter) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-[200px]">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
        Vessel Type
      </h3>
      <div className="flex flex-col gap-1">
        {FILTERS.map((f) => {
          const count = f === "All"
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : counts[f] ?? 0;
          return (
            <button
              key={f}
              onClick={() => onChange(f)}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all ${
                active === f
                  ? "bg-gray-900 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${FILTER_COLORS[f]}`}
                />
                {f}
              </span>
              <span
                className={`text-xs ml-2 ${
                  active === f ? "text-gray-300" : "text-gray-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
