import { ComplianceBalance } from '../domain/ComplianceBalance';

/**
 * Port: Compliance Repository Interface
 * Defines the contract for compliance balance data access
 */
export interface IComplianceRepository {
  /**
   * Get compliance balance for a ship in a given year
   */
  getCB(shipId: string, year: number): Promise<ComplianceBalance | null>;

  /**
   * Save or update compliance balance
   */
  saveCB(cb: ComplianceBalance): Promise<ComplianceBalance>;

  /**
   * Get adjusted compliance balance (after bank applications)
   * This is a convenience method that combines getCB with bank adjustments
   */
  getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance>;
}

