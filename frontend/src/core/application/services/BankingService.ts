import { BankEntry } from '../../domain/BankEntry';
import { IApiClient } from '../../ports/IApiClient';

export interface BankRecordsResponse {
  records: BankEntry[];
  summary: {
    totalBanked: number;
    totalApplied: number;
    available: number;
  };
}

export interface ApplyBankedResponse {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

/**
 * Banking Service
 * Handles banking-related business logic and API calls
 */
export class BankingService {
  constructor(private readonly apiClient: IApiClient) {}

  /**
   * Get bank records for a ship
   */
  async getRecords(shipId: string, year: number): Promise<BankRecordsResponse> {
    const queryParams = new URLSearchParams({
      shipId,
      year: year.toString(),
    });

    const response = await this.apiClient.get<{
      success: boolean;
      data: BankRecordsResponse;
    }>(`/banking/records?${queryParams.toString()}`);

    return response.data;
  }

  /**
   * Bank surplus compliance balance
   */
  async bank(shipId: string, year: number, amount: number): Promise<BankEntry> {
    const response = await this.apiClient.post<{
      success: boolean;
      data: BankEntry;
    }>('/banking/bank', {
      shipId,
      year,
      amount,
    });

    return response.data;
  }

  /**
   * Apply banked surplus to cover a deficit
   */
  async apply(shipId: string, year: number, amount: number): Promise<ApplyBankedResponse> {
    const response = await this.apiClient.post<{
      success: boolean;
      data: ApplyBankedResponse;
    }>('/banking/apply', {
      shipId,
      year,
      amount,
    });

    return response.data;
  }
}


export type {BankEntry};

