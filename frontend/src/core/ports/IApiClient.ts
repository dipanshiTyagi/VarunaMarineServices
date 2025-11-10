/**
 * API Client Port Interface
 * Defines the contract for API communication
 */
export interface IApiClient {
  /**
   * Perform a GET request
   */
  get<T>(url: string): Promise<T>;

  /**
   * Perform a POST request
   */
  post<T>(url: string, data: any): Promise<T>;

  /**
   * Perform a PUT request
   */
  put<T>(url: string, data: any): Promise<T>;

  /**
   * Perform a DELETE request
   */
  delete<T>(url: string): Promise<T>;
}

