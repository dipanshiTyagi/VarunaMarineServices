/**
 * BankEntry domain entity
 * Represents a banked compliance balance surplus
 * Used for Fuel EU Article 20 - Banking
 */
export class BankEntry {
  constructor(
    public readonly shipId: string,
    public readonly year: number,
    public readonly amountGco2eq: number, // Banked amount in gCO₂e (must be positive)
    public readonly id?: number,
    public readonly createdAt?: Date
  ) {
    if (amountGco2eq <= 0) {
      throw new Error('Banked amount must be positive');
    }
  }

  /**
   * Validate that the bank entry is valid
   * @returns true if valid
   */
  isValid(): boolean {
    return (
      this.shipId.length > 0 &&
      this.year > 0 &&
      this.amountGco2eq > 0
    );
  }

  /**
   * Check if this bank entry can be applied to a deficit
   * @param deficitAmount - The deficit amount to cover
   * @returns true if this entry can cover the deficit
   */
  canCover(deficitAmount: number): boolean {
    return this.amountGco2eq >= Math.abs(deficitAmount);
  }

  /**
   * Get the remaining amount after applying to a deficit
   * @param appliedAmount - Amount already applied
   * @returns Remaining amount
   */
  getRemaining(appliedAmount: number): number {
    const remaining = this.amountGco2eq - appliedAmount;
    return Math.max(0, remaining);
  }
}

