export type Coord = readonly [number, number];

export type Bbox = readonly [number, number, number, number];

export type RoutePoint = {
  name: string;
  displayName: string;
  coord: Coord;
};

export type RouteResult = {
  from: RoutePoint;
  to: RoutePoint;
  coordinates: Coord[];
  distanceMeters: number;
  durationSeconds: number;
  bbox: Bbox;
};

export type RouteRequest = {
  from: string;
  to: string;
};

export type ApiErrorBody = {
  error: string;
  detail?: string;
};
