import { ComplianceBalance } from '../../domain/ComplianceBalance';
import { IApiClient } from '../../ports/IApiClient';

/**
 * Compliance Service
 * Handles compliance balance-related business logic and API calls
 */

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export class ComplianceService {
  constructor(private readonly apiClient: IApiClient) {}

  /**
   * Get compliance balance for a ship
   */
  async getCB(shipId: string, year: number): Promise<ComplianceBalance> {
    const queryParams = new URLSearchParams({
      shipId,
      year: year.toString(),
    });

    const response = await this.apiClient.get<ApiResponse<ComplianceBalance>>(`/compliance/cb?${queryParams.toString()}`);

    return response.data;
  }

  /**
   * Get adjusted compliance balance (after bank applications)
   */
  async getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance> {
    const queryParams = new URLSearchParams({
      shipId,
      year: year.toString(),
    });

    const response = await this.apiClient.get<ApiResponse<ComplianceBalance>>(`/compliance/adjusted-cb?${queryParams.toString()}`);

    return response.data;
  }
}

