// export type { Route } from '../../domain/Route';
// import { Route } from '../../domain/Route';
// import { IApiClient } from '../../ports/IApiClient';

// export interface RouteFilters {
//   vesselType?: string;
//   fuelType?: string;
//   year?: number;
// }

// export interface ComparisonResult {
//   baseline: Route;
//   comparisons: Array<{
//     route: Route;
//     percentDiff: number;
//     compliant: boolean;
//   }>;
// }

// /**
//  * Route Service
//  * Handles route-related business logic and API calls
//  */
// export class RouteService {
//   constructor(private readonly apiClient: IApiClient) {}

//   /**
//    * Get all routes with optional filters
//    */
//   async getRoutes(filters?: RouteFilters): Promise<Route[]> {
//     const queryParams = new URLSearchParams();
//     if (filters?.vesselType) queryParams.append('vesselType', filters.vesselType);
//     if (filters?.fuelType) queryParams.append('fuelType', filters.fuelType);
//     if (filters?.year) queryParams.append('year', filters.year.toString());

//     const queryString = queryParams.toString();
//     const url = `/routes${queryString ? `?${queryString}` : ''}`;

//     const response = await this.apiClient.get<{ success: boolean; data: Route[] }>(url);
//     return response.data;
//   }

//   /**
//    * Set a route as baseline
//    */
//   async setBaseline(routeId: string): Promise<void> {
//     await this.apiClient.post(`/routes/${routeId}/baseline`, {});
//   }

//   /**
//    * Get baseline route and comparison routes
//    */
//   async getComparison(): Promise<ComparisonResult> {
//     const response = await this.apiClient.get<{ success: boolean; data: ComparisonResult }>(
//       '/routes/comparison'
//     );
//     return response.data;
//   }
// }



import { Route } from '../../domain/Route';
import { IApiClient } from '../../ports/IApiClient';

export type { Route };

export interface RouteFilters {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}

export interface ComparisonResult {
  baseline: Route;
  comparisons: Array<{
    route: Route;
    percentDiff: number;
    compliant: boolean;
  }>;
}

/**
 * Route Service
 * Handles route-related business logic and API calls
 */
export class RouteService {
  constructor(private readonly apiClient: IApiClient) {}

  /**
   * Get all routes with optional filters
   */
  async getRoutes(filters?: RouteFilters): Promise<Route[]> {
    const queryParams = new URLSearchParams();
    if (filters?.vesselType) queryParams.append('vesselType', filters.vesselType);
    if (filters?.fuelType) queryParams.append('fuelType', filters.fuelType);
    if (filters?.year) queryParams.append('year', filters.year.toString());

    const queryString = queryParams.toString();
    const url = `/routes${queryString ? `?${queryString}` : ''}`;

    const response = await this.apiClient.get<{ success: boolean; data: Route[] }>(url);
    return response.data;
  }

  /**
   * Set a route as baseline
   */
  async setBaseline(routeId: string): Promise<void> {
    await this.apiClient.post(`/routes/${routeId}/baseline`, {});
  }

  /**
   * Get baseline route and comparison routes
   */
  async getComparison(): Promise<ComparisonResult> {
    const response = await this.apiClient.get<{ success: boolean; data: ComparisonResult }>(
      '/routes/comparison'
    );
    return response.data;
  }
}
