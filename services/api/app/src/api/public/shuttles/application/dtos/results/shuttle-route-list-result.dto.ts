export interface ShuttleRouteResult {
  routeName: string;
  updatedAt: Date;
}

export interface ShuttleRouteListResult {
  routes: ShuttleRouteResult[];
}
