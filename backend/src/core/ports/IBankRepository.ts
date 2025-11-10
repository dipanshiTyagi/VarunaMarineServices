import { BankEntry } from '../domain/BankEntry';

/**
 * Port: Bank Repository Interface
 * Defines the contract for banking data access
 */
export interface IBankRepository {
  /**
   * Get total banked amount for a ship in a given year
   */
  getBanked(shipId: string, year: number): Promise<number>;

  /**
   * Get total banked amount (alias for getBanked)
   */
  getTotalBanked(shipId: string, year: number): Promise<number>;

  /**
   * Get total applied amount for a ship in a given year
   */
  getTotalApplied(shipId: string, year: number): Promise<number>;

  /**
   * Save a bank entry
   */
  saveBankEntry(entry: BankEntry): Promise<BankEntry>;

  /**
   * Get all bank records for a ship in a given year
   */
  getBankRecords(shipId: string, year: number): Promise<BankEntry[]>;

  /**
   * Record an application of banked amount
   */
  recordApplication(shipId: string, year: number, amount: number): Promise<void>;
}

