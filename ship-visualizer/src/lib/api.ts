import { Ship } from "./types";

// Ship type codes from AIS data mapped to human-readable types
function classifyShipType(shipType: number): string {
  if (shipType >= 70 && shipType <= 79) return "Cargo";
  if (shipType >= 80 && shipType <= 89) return "Tanker";
  if (shipType >= 60 && shipType <= 69) return "Passenger";
  if (shipType === 30) return "Fishing";
  if (shipType >= 35 && shipType <= 36) return "Military";
  return "Other";
}

// Generate a realistic ship trail based on heading and speed
function generateTrail(
  lat: number,
  lon: number,
  heading: number,
  speed: number
): [number, number][] {
  const trail: [number, number][] = [];
  const headingRad = ((heading + 180) * Math.PI) / 180; // reverse direction for trail
  const stepSize = Math.max(0.002, speed * 0.001);

  for (let i = 1; i <= 5; i++) {
    const wobble = (Math.random() - 0.5) * 0.002;
    trail.push([
      lat - Math.cos(headingRad) * stepSize * i + wobble,
      lon - Math.sin(headingRad) * stepSize * i + wobble,
    ]);
  }
  return trail;
}

export async function fetchShips(bounds: {
  west: number;
  south: number;
  east: number;
  north: number;
}): Promise<Ship[]> {
  // Use the AISHub or similar public AIS API
  // For demo purposes, we use a publicly available proxy or generate realistic mock data
  // since most free AIS APIs require registration

  try {
    // Try fetching from the public MarineTraffic-style endpoint
    const url = `https://meri.digitraffic.fi/api/ais/v1/locations?from=${bounds.south}&to=${bounds.north}&lonFrom=${bounds.west}&lonTo=${bounds.east}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.features && data.features.length > 0) {
        return data.features
          .filter(
            (f: {
              geometry?: { coordinates?: number[] };
              properties?: { sog?: number; cog?: number; shipType?: number };
            }) =>
              f.geometry?.coordinates &&
              f.properties?.sog !== undefined
          )
          .slice(0, 200)
          .map(
            (f: {
              properties: {
                mmsi: number;
                name?: string;
                shipType?: number;
                sog?: number;
                cog?: number;
              };
              geometry: { coordinates: number[] };
            }) => {
              const props = f.properties;
              const coords = f.geometry.coordinates;
              const lat = coords[1];
              const lon = coords[0];
              const heading = props.cog ?? 0;
              const speed = props.sog ?? 0;
              return {
                id: String(props.mmsi),
                name: props.name || `Vessel ${props.mmsi}`,
                type: classifyShipType(props.shipType ?? 0),
                lat,
                lon,
                speed,
                heading,
                path: generateTrail(lat, lon, heading, speed),
              };
            }
          );
      }
    }
  } catch {
    // Fall through to mock data
  }

  // Fallback: generate realistic mock ships within the bounds
  return generateMockShips(bounds);
}

function generateMockShips(bounds: {
  west: number;
  south: number;
  east: number;
  north: number;
}): Ship[] {
  const types = ["Cargo", "Tanker", "Passenger", "Fishing", "Military", "Other"];
  const names = [
    "Ever Given", "MSC Oscar", "OOCL Hong Kong", "Maersk Triple-E",
    "Blue Marlin", "Knock Nevis", "Emma Maersk", "CMA CGM Marco Polo",
    "Pacific Explorer", "Northern Star", "Ocean Pride", "Sea Diamond",
    "Atlantic Voyager", "Gulf Trader", "Baltic Queen", "Arctic Fox",
    "Coral Princess", "Jade Fortune", "Ruby Spirit", "Pearl Harbor",
    "Silver Dawn", "Golden Eagle", "Iron Maiden", "Steel Wave",
    "Neptune's Grace", "Poseidon", "Triton", "Oceanus",
    "Calypso", "Endeavour",
  ];

  const latRange = bounds.north - bounds.south;
  const lonRange = bounds.east - bounds.west;
  const count = Math.min(30, Math.max(8, Math.floor(latRange * lonRange * 500)));

  const ships: Ship[] = [];
  for (let i = 0; i < count; i++) {
    const lat = bounds.south + Math.random() * latRange;
    const lon = bounds.west + Math.random() * lonRange;
    const heading = Math.random() * 360;
    const speed = Math.random() * 20;
    const type = types[Math.floor(Math.random() * types.length)];

    ships.push({
      id: `mock-${i}-${Date.now()}`,
      name: names[i % names.length],
      type,
      lat,
      lon,
      speed: Math.round(speed * 10) / 10,
      heading: Math.round(heading),
      path: generateTrail(lat, lon, heading, speed),
    });
  }

  return ships;
}
