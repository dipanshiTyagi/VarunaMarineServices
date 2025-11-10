// // import axios, { AxiosInstance, AxiosError } from 'axios';
// // import { IApiClient } from '../../core/ports/IApiClient';
// // import { Route, RouteFilters } from '../../core/application/services/RouteService';
// // import { ComplianceBalance } from '../../core/domain/ComplianceBalance';
// // import { BankRecordsResponse } from '../../core/application/services/BankingService';
// // import { BankEntry } from '../../core/domain/BankEntry';
// // import { Pool } from '../../core/domain/Pool';
// // import { ComparisonResult } from '../../core/application/services/RouteService';

// // /**
// //  * API Client implementation using Axios
// //  * Implements IApiClient interface for HTTP communication with backend
// //  */
// // export class ApiClient implements IApiClient {
// //   private axiosInstance: AxiosInstance;

// //   constructor(baseURL: string = 'http://localhost:3001') {
// //     this.axiosInstance = axios.create({
// //       baseURL,
// //       timeout: 10000,
// //       headers: {
// //         'Content-Type': 'application/json',
// //       },
// //     });

// //     // Request interceptor
// //     this.axiosInstance.interceptors.request.use(
// //       (config) => {
// //         // Add any auth tokens or headers here if needed
// //         return config;
// //       },
// //       (error) => {
// //         return Promise.reject(error);
// //       }
// //     );

// //     // Response interceptor for error handling
// //     this.axiosInstance.interceptors.response.use(
// //       (response) => response.data,
// //       (error: AxiosError) => {
// //         // Handle different error types
// //         if (error.response) {
// //           // Server responded with error status
// //           const errorMessage =
// //             (error.response.data as any)?.error ||
// //             error.response.statusText ||
// //             'An error occurred';
// //           throw new Error(errorMessage);
// //         } else if (error.request) {
// //           // Request was made but no response received
// //           throw new Error('Network error: No response from server');
// //         } else {
// //           // Something else happened
// //           throw new Error(error.message || 'An unexpected error occurred');
// //         }
// //       }
// //     );
// //   }

// //   /**
// //    * Perform a GET request
// //    */
// //   async get<T>(url: string): Promise<T> {
// //     const response = await this.axiosInstance.get<T>(url);
// //     return response.data;
// //   }

// //   /**
// //    * Perform a POST request
// //    */
// //   async post<T>(url: string, data: any): Promise<T> {
// //     const response = await this.axiosInstance.post<T>(url, data);
// //    return response.data;
// //   }

// //   /**
// //    * Perform a PUT request
// //    */
// //   async put<T>(url: string, data: any): Promise<T> {
// //     const response = await this.axiosInstance.put<T>(url, data);
// //     return response.data;
// //   }

// //   /**
// //    * Perform a DELETE request
// //    */
// //   async delete<T>(url: string): Promise<T> {
// //     const response = await this.axiosInstance.delete<T>(url);
// //     return response.data;
// //   }

// //   // ========== Route Endpoints ==========

// //   /**
// //    * Get all routes with optional filters
// //    */
// //   async getRoutes(filters?: RouteFilters): Promise<Route[]> {
// //     const queryParams = new URLSearchParams();
// //     if (filters?.vesselType) queryParams.append('vesselType', filters.vesselType);
// //     if (filters?.fuelType) queryParams.append('fuelType', filters.fuelType);
// //     if (filters?.year) queryParams.append('year', filters.year.toString());

// //     const queryString = queryParams.toString();
// //     const url = `/routes${queryString ? `?${queryString}` : ''}`;

// //     const response = await this.get<{ success: boolean; data: Route[]; count: number }>(url);
// //     return response.data;
// //   }

// //   /**
// //    * Set a route as baseline
// //    */
// //   async setBaseline(routeId: string): Promise<void> {
// //     await this.post<{ success: boolean; message: string }>(`/routes/${routeId}/baseline`, {});
// //   }

// //   /**
// //    * Get baseline route and comparison routes
// //    */
// //   async getComparison(): Promise<ComparisonResult> {
// //     const response = await this.get<{ success: boolean; data: ComparisonResult }>(
// //       '/routes/comparison'
// //     );
// //     return response.data;
// //   }

// //   // ========== Compliance Endpoints ==========

// //   /**
// //    * Get compliance balance for a ship
// //    */
// //   async getCB(shipId: string, year: number): Promise<ComplianceBalance> {
// //     const queryParams = new URLSearchParams({
// //       shipId,
// //       year: year.toString(),
// //     });

// //     const response = await this.get<{
// //       success: boolean;
// //       data: ComplianceBalance & { isSurplus: boolean; isDeficit: boolean };
// //     }>(`/compliance/cb?${queryParams.toString()}`);

// //     // Remove isSurplus and isDeficit as they're not part of the domain model
// //     const { isSurplus, isDeficit, ...cb } = response.data;
// //     return cb;
// //   }

// //   /**
// //    * Get adjusted compliance balance (after bank applications)
// //    */
// //   async getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance> {
// //     const queryParams = new URLSearchParams({
// //       shipId,
// //       year: year.toString(),
// //     });

// //     const response = await this.get<{
// //       success: boolean;
// //       data: ComplianceBalance & { isSurplus: boolean; isDeficit: boolean };
// //     }>(`/compliance/adjusted-cb?${queryParams.toString()}`);

// //     // Remove isSurplus and isDeficit as they're not part of the domain model
// //     const { isSurplus, isDeficit, ...cb } = response.data;
// //     return cb;
// //   }

// //   // ========== Banking Endpoints ==========

// //   /**
// //    * Get bank records for a ship
// //    */
// //   async getBankRecords(shipId: string, year: number): Promise<BankRecordsResponse> {
// //     const queryParams = new URLSearchParams({
// //       shipId,
// //       year: year.toString(),
// //     });

// //     const response = await this.get<{
// //       success: boolean;
// //       data: BankRecordsResponse;
// //     }>(`/banking/records?${queryParams.toString()}`);

// //     return response.data;
// //   }

// //   /**
// //    * Bank surplus compliance balance
// //    */
// //   async bankSurplus(data: { shipId: string; year: number; amount: number }): Promise<BankEntry> {
// //     const response = await this.post<{
// //       success: boolean;
// //       message: string;
// //       data: BankEntry;
// //     }>('/banking/bank', data);

// //     return response.data;
// //   }

// //   /**
// //    * Apply banked surplus to cover a deficit
// //    */
// //   async applyBanked(data: {
// //     shipId: string;
// //     year: number;
// //     amount: number;
// //   }): Promise<{ cbBefore: number; applied: number; cbAfter: number }> {
// //     const response = await this.post<{
// //       success: boolean;
// //       message: string;
// //       data: { cbBefore: number; applied: number; cbAfter: number };
// //     }>('/banking/apply', data);

// //     return response.data;
// //   }

// //   // ========== Pooling Endpoints ==========

// //   /**
// //    * Create a pool with multiple ships
// //    */
// //   async createPool(data: { year: number; members: string[] }): Promise<Pool> {
// //     const response = await this.post<{
// //       success: boolean;
// //       message: string;
// //       data: Pool;
// //     }>('/pools', data);

// //     return response.data;
// //   }
// // }

// // /**
// //  * Create and export a singleton instance
// //  */
// // export const apiClient = new ApiClient(
// //   process.env.REACT_APP_API_URL || 'http://localhost:3001'
// // );


// import axios, { AxiosInstance, AxiosError } from 'axios';
// import { IApiClient } from '../../core/ports/IApiClient';
// import { Route, RouteFilters } from '../../core/application/services/RouteService';
// import { ComplianceBalance } from '../../core/domain/ComplianceBalance';
// import { BankRecordsResponse } from '../../core/application/services/BankingService';
// import { BankEntry } from '../../core/domain/BankEntry';
// import { Pool } from '../../core/domain/Pool';
// import { ComparisonResult } from '../../core/application/services/RouteService';

// export class ApiClient implements IApiClient {
//   private axiosInstance: AxiosInstance;

//   constructor(baseURL: string = 'http://localhost:3001') {
//     this.axiosInstance = axios.create({
//       baseURL,
//       timeout: 10000,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     // Request interceptor
//     this.axiosInstance.interceptors.request.use(
//       (config) => {
//         return config;
//       },
//       (error) => {
//         return Promise.reject(error);
//       }
//     );

//     // Response interceptor - FIXED to not double-extract data
//     this.axiosInstance.interceptors.response.use(
//       (response) => response, // Return full response, not response.data
//       (error: AxiosError) => {
//         if (error.response) {
//           const errorMessage =
//             (error.response.data as any)?.error ||
//             error.response.statusText ||
//             'An error occurred';
//           throw new Error(errorMessage);
//         } else if (error.request) {
//           throw new Error('Network error: No response from server');
//         } else {
//           throw new Error(error.message || 'An unexpected error occurred');
//         }
//       }
//     );
//   }

//   async get<T>(url: string): Promise<T> {
//     const response = await this.axiosInstance.get<T>(url);
//     return response.data;
//   }

//   async post<T>(url: string, data: any): Promise<T> {
//     const response = await this.axiosInstance.post<T>(url, data);
//     return response.data;
//   }

//   async put<T>(url: string, data: any): Promise<T> {
//     const response = await this.axiosInstance.put<T>(url, data);
//     return response.data;
//   }

//   async delete<T>(url: string): Promise<T> {
//     const response = await this.axiosInstance.delete<T>(url);
//     return response.data;
//   }

//   // Route Endpoints
//   async getRoutes(filters?: RouteFilters): Promise<Route[]> {
//     const queryParams = new URLSearchParams();
//     if (filters?.vesselType) queryParams.append('vesselType', filters.vesselType);
//     if (filters?.fuelType) queryParams.append('fuelType', filters.fuelType);
//     if (filters?.year) queryParams.append('year', filters.year.toString());

//     const queryString = queryParams.toString();
//     const url = `/routes${queryString ? `?${queryString}` : ''}`;

//     const response = await this.get<{ success: boolean; data: Route[]; count: number }>(url);
//     return response.data;
//   }

//   async setBaseline(routeId: string): Promise<void> {
//     await this.post<{ success: boolean; message: string }>(`/routes/${routeId}/baseline`, {});
//   }

//   async getComparison(): Promise<ComparisonResult> {
//     const response = await this.get<{ success: boolean; data: ComparisonResult }>('/routes/comparison');
//     return response.data;
//   }

//   // Compliance Endpoints
//   async getCB(shipId: string, year: number): Promise<ComplianceBalance> {
//     const queryParams = new URLSearchParams({ shipId, year: year.toString() });
//     const response = await this.get<{
//       success: boolean;
//       data: ComplianceBalance & { isSurplus: boolean; isDeficit: boolean };
//     }>(`/compliance/cb?${queryParams.toString()}`);

//     const { isSurplus, isDeficit, ...cb } = response.data;
//     return cb;
//   }

//   async getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance> {
//     const queryParams = new URLSearchParams({ shipId, year: year.toString() });
//     const response = await this.get<{
//       success: boolean;
//       data: ComplianceBalance & { isSurplus: boolean; isDeficit: boolean };
//     }>(`/compliance/adjusted-cb?${queryParams.toString()}`);

//     const { isSurplus, isDeficit, ...cb } = response.data;
//     return cb;
//   }

//   // Banking Endpoints
//   async getBankRecords(shipId: string, year: number): Promise<BankRecordsResponse> {
//     const queryParams = new URLSearchParams({ shipId, year: year.toString() });
//     const response = await this.get<{ success: boolean; data: BankRecordsResponse }>(
//       `/banking/records?${queryParams.toString()}`
//     );
//     return response.data;
//   }

//   async bankSurplus(data: { shipId: string; year: number; amount: number }): Promise<BankEntry> {
//     const response = await this.post<{ success: boolean; message: string; data: BankEntry }>(
//       '/banking/bank',
//       data
//     );
//     return response.data;
//   }

//   async applyBanked(data: {
//     shipId: string;
//     year: number;
//     amount: number;
//   }): Promise<{ cbBefore: number; applied: number; cbAfter: number }> {
//     const response = await this.post<{
//       success: boolean;
//       message: string;
//       data: { cbBefore: number; applied: number; cbAfter: number };
//     }>('/banking/apply', data);
//     return response.data;
//   }

//   // Pooling Endpoints
//   async createPool(data: { year: number; members: string[] }): Promise<Pool> {
//     const response = await this.post<{ success: boolean; message: string; data: Pool }>(
//       '/pools',
//       data
//     );
//     return response.data;
//   }
// }

// export const apiClient = new ApiClient(process.env.REACT_APP_API_URL || 'http://localhost:3001');



import axios, { AxiosInstance, AxiosError } from 'axios';
import { IApiClient } from '../../core/ports/IApiClient';
import { Route, RouteFilters } from '../../core/application/services/RouteService';
import { ComplianceBalance } from '../../core/domain/ComplianceBalance';
import { BankRecordsResponse } from '../../core/application/services/BankingService';
import { BankEntry } from '../../core/domain/BankEntry';
import { Pool } from '../../core/domain/Pool';
import { ComparisonResult } from '../../core/application/services/RouteService';

/**
 * API Client implementation using Axios
 * Implements IApiClient interface for HTTP communication with backend
 */
export class ApiClient implements IApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3001') {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const errorMessage =
            (error.response.data as any)?.error ||
            error.response.statusText ||
            'An error occurred';
          throw new Error(errorMessage);
        } else if (error.request) {
          throw new Error('Network error: No response from server');
        } else {
          throw new Error(error.message || 'An unexpected error occurred');
        }
      }
    );
  }

  /**
   * Perform a GET request
   */
  async get<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(url);
    return response.data;
  }

  /**
   * Perform a POST request
   */
  async post<T>(url: string, data: any): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }

  /**
   * Perform a PUT request
   */
  async put<T>(url: string, data: any): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data);
    return response.data;
  }

  /**
   * Perform a DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url);
    return response.data;
  }

  // ========== Route Endpoints ==========

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

    const response = await this.get<{ success: boolean; data: Route[]; count: number }>(url);
    return response.data;
  }

  /**
   * Set a route as baseline
   */
  async setBaseline(routeId: string): Promise<void> {
    await this.post<{ success: boolean; message: string }>(`/routes/${routeId}/baseline`, {});
  }

  /**
   * Get baseline route and comparison routes
   */
  async getComparison(): Promise<ComparisonResult> {
    const response = await this.get<{ success: boolean; data: ComparisonResult }>(
      '/routes/comparison'
    );
    return response.data;
  }

  // ========== Compliance Endpoints ==========

  /**
   * Get compliance balance for a ship
   */
  async getCB(shipId: string, year: number): Promise<ComplianceBalance> {
    const queryParams = new URLSearchParams({
      shipId,
      year: year.toString(),
    });

    const response = await this.get<{
      success: boolean;
      data: ComplianceBalance & { isSurplus: boolean; isDeficit: boolean };
    }>(`/compliance/cb?${queryParams.toString()}`);

    // Destructure and remove the extra fields that aren't part of the domain model
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isSurplus, isDeficit, ...cb } = response.data;
    return cb;
  }

  /**
   * Get adjusted compliance balance (after bank applications)
   */
  async getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance> {
    const queryParams = new URLSearchParams({
      shipId,
      year: year.toString(),
    });

    const response = await this.get<{
      success: boolean;
      data: ComplianceBalance & { isSurplus: boolean; isDeficit: boolean };
    }>(`/compliance/adjusted-cb?${queryParams.toString()}`);

    // Destructure and remove the extra fields that aren't part of the domain model
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isSurplus, isDeficit, ...cb } = response.data;
    return cb;
  }

  // ========== Banking Endpoints ==========

  /**
   * Get bank records for a ship
   */
  async getBankRecords(shipId: string, year: number): Promise<BankRecordsResponse> {
    const queryParams = new URLSearchParams({
      shipId,
      year: year.toString(),
    });

    const response = await this.get<{
      success: boolean;
      data: BankRecordsResponse;
    }>(`/banking/records?${queryParams.toString()}`);

    return response.data;
  }

  /**
   * Bank surplus compliance balance
   */
  async bankSurplus(data: { shipId: string; year: number; amount: number }): Promise<BankEntry> {
    const response = await this.post<{
      success: boolean;
      message: string;
      data: BankEntry;
    }>('/banking/bank', data);

    return response.data;
  }

  /**
   * Apply banked surplus to cover a deficit
   */
  async applyBanked(data: {
    shipId: string;
    year: number;
    amount: number;
  }): Promise<{ cbBefore: number; applied: number; cbAfter: number }> {
    const response = await this.post<{
      success: boolean;
      message: string;
      data: { cbBefore: number; applied: number; cbAfter: number };
    }>('/banking/apply', data);

    return response.data;
  }

  // ========== Pooling Endpoints ==========

  /**
   * Create a pool with multiple ships
   */
  async createPool(data: { year: number; members: string[] }): Promise<Pool> {
    const response = await this.post<{
      success: boolean;
      message: string;
      data: Pool;
    }>('/pools', data);

    return response.data;
  }
}

/**
 * Create and export a singleton instance
 */
export const apiClient = new ApiClient(
  process.env.REACT_APP_API_URL || 'http://localhost:3001'
);