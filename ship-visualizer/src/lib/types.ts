export interface Ship {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  path: [number, number][];
}

export type VesselFilter =
  | "All"
  | "Cargo"
  | "Tanker"
  | "Passenger"
  | "Fishing"
  | "Military"
  | "Other";
