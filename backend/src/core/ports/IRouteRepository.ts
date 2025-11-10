import { Route } from '../domain/Route';

export interface RouteFilters {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}

/**
 * Port: Route Repository Interface
 * Defines the contract for route data access
 */
export interface IRouteRepository {
  /**
   * Find all routes with optional filters
   */
  findAll(filters?: RouteFilters): Promise<Route[]>;

  /**
   * Find a route by its routeId
   */
  findById(routeId: string): Promise<Route | null>;

  /**
   * Find the baseline route
   */
  findByBaseline(): Promise<Route | null>;

  /**
   * Set a route as baseline (sets isBaseline=true for this route)
   */
  setBaseline(routeId: string): Promise<void>;

  /**
   * Clear all baseline flags (set isBaseline=false for all routes)
   */
  clearAllBaselines(): Promise<void>;

  /**
   * Save a route (create or update)
   */
  save(route: Route): Promise<Route>;
}

