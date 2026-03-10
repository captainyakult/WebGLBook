"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Ship, VesselFilter } from "@/lib/types";
import { fetchShips } from "@/lib/api";
import { shipPopupHTML } from "./ShipPopup";
import FilterPanel from "./FilterPanel";

const TYPE_COLORS: Record<string, string> = {
  Cargo: "#3b82f6",
  Tanker: "#ef4444",
  Passenger: "#22c55e",
  Fishing: "#eab308",
  Military: "#a855f7",
  Other: "#6b7280",
};

const DEFAULT_CENTER: [number, number] = [24.94, 60.17]; // Helsinki — good for Finnish AIS data
const DEFAULT_ZOOM = 10;

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const trailSourceAdded = useRef(false);

  const [ships, setShips] = useState<Ship[]>([]);
  const [filter, setFilter] = useState<VesselFilter>("All");
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>("Requesting location...");

  const filteredShips = filter === "All" ? ships : ships.filter((s) => s.type === filter);

  const counts: Record<string, number> = {};
  for (const s of ships) {
    counts[s.type] = (counts[s.type] || 0) + 1;
  }

  const loadShips = useCallback(async (map: maplibregl.Map) => {
    const bounds = map.getBounds();
    setLoading(true);
    try {
      const data = await fetchShips({
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      });
      setShips(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    mapRef.current = map;

    // Request geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserLocation(loc);
          setGeoStatus("");
          map.flyTo({ center: loc, zoom: 11 });

          new maplibregl.Marker({ color: "#2563eb" })
            .setLngLat(loc)
            .setPopup(new maplibregl.Popup().setHTML("<b>Your Location</b>"))
            .addTo(map);
        },
        () => {
          setGeoStatus("Location unavailable — showing Helsinki area (Finnish AIS data)");
        },
        { timeout: 8000 }
      );
    } else {
      setGeoStatus("Geolocation not supported — showing default area");
    }

    map.on("load", () => {
      // Add trail source/layer
      map.addSource("trails", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "trail-lines",
        type: "line",
        source: "trails",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.5,
        },
      });
      trailSourceAdded.current = true;
      loadShips(map);
    });

    // Reload ships when map stops moving
    let debounce: ReturnType<typeof setTimeout>;
    map.on("moveend", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => loadShips(map), 500);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loadShips]);

  // Update markers and trails when ships or filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add ship markers
    for (const ship of filteredShips) {
      const color = TYPE_COLORS[ship.type] || TYPE_COLORS.Other;

      // Create ship arrow SVG marker
      const el = document.createElement("div");
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.cursor = "pointer";
      el.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" style="transform: rotate(${ship.heading}deg);">
        <path d="M12 2 L18 20 L12 16 L6 20 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
      </svg>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([ship.lon, ship.lat])
        .addTo(map);

      el.addEventListener("click", () => {
        if (popupRef.current) popupRef.current.remove();
        const popup = new maplibregl.Popup({ offset: 15 })
          .setLngLat([ship.lon, ship.lat])
          .setHTML(shipPopupHTML(ship))
          .addTo(map);
        popupRef.current = popup;
      });

      markersRef.current.push(marker);
    }

    // Update trails
    if (trailSourceAdded.current && map.getSource("trails")) {
      const features = filteredShips
        .filter((s) => s.path.length > 0)
        .map((ship) => ({
          type: "Feature" as const,
          properties: { color: TYPE_COLORS[ship.type] || TYPE_COLORS.Other },
          geometry: {
            type: "LineString" as const,
            coordinates: [[ship.lon, ship.lat], ...ship.path.map((p) => [p[1], p[0]])],
          },
        }));

      (map.getSource("trails") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features,
      });
    }
  }, [filteredShips]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      <FilterPanel active={filter} onChange={setFilter} counts={counts} />

      {/* Status bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {loading && (
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-sm text-gray-600 flex items-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading ships...
          </div>
        )}
        {!loading && ships.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-sm text-gray-600">
            {filteredShips.length} of {ships.length} vessels visible
          </div>
        )}
      </div>

      {/* Geo status */}
      {geoStatus && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-yellow-50/90 backdrop-blur-sm border border-yellow-200 rounded-lg px-4 py-2 shadow text-sm text-yellow-800 max-w-md text-center">
          {geoStatus}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Legend</div>
        <div className="flex flex-col gap-0.5">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-gray-600">
              <svg viewBox="0 0 24 24" width="12" height="12">
                <path d="M12 2 L18 20 L12 16 L6 20 Z" fill={color} />
              </svg>
              {type}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
