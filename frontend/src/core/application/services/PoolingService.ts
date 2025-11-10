import { Pool } from '../../domain/Pool';
import { IApiClient } from '../../ports/IApiClient';

/**
 * Pooling Service
 * Handles pooling-related business logic and API calls
 */
export class PoolingService {
  constructor(private readonly apiClient: IApiClient) {}

  /**
   * Create a pool with multiple ships
   */
  async createPool(year: number, members: string[]): Promise<Pool> {
    const response = await this.apiClient.post<{
      success: boolean;
      data: Pool;
    }>('/pools', {
      year,
      members,
    });

    return response.data;
  }
}

