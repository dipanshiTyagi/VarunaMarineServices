/**
 * BankEntry domain interface
 * Matches backend BankEntry entity
 */
export interface BankEntry {
  id?: number;
  shipId: string;
  year: number;
  amountGco2eq: number; // Banked amount in gCO₂e
  createdAt?: Date;
}

