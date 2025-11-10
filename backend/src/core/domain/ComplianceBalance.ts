/**
 * ComplianceBalance value object
 * Represents the compliance balance for a ship in a given year
 * Positive CB = Surplus, Negative CB = Deficit
 */
export class ComplianceBalance {
  public static readonly TARGET_2025 = 89.3368; // gCO₂e/MJ
  public static readonly ENERGY_PER_TONNE = 41000; // MJ/t

  constructor(
    public readonly shipId: string,
    public readonly year: number,
    public readonly cbGco2eq: number, // Can be positive (surplus) or negative (deficit)
    public readonly id?: number,
    public readonly createdAt?: Date
  ) {}

  /**
   * Calculate Compliance Balance from GHG intensity and fuel consumption
   * CB = (Target - Actual GHG Intensity) × Energy in Scope
   * Energy in Scope = Fuel Consumption (t) × 41,000 MJ/t
   *
   * @param ghgIntensity - Actual GHG intensity in gCO₂e/MJ
   * @param fuelConsumption - Fuel consumption in tonnes
   * @returns Compliance Balance in gCO₂e
   */
  static calculate(ghgIntensity: number, fuelConsumption: number): number {
    const energyInScope = fuelConsumption * ComplianceBalance.ENERGY_PER_TONNE;
    const cb = (ComplianceBalance.TARGET_2025 - ghgIntensity) * energyInScope;
    return cb;
  }

  /**
   * Check if this is a surplus (positive CB)
   */
  isSurplus(): boolean {
    return this.cbGco2eq > 0;
  }

  /**
   * Check if this is a deficit (negative CB)
   */
  isDeficit(): boolean {
    return this.cbGco2eq < 0;
  }

  /**
   * Check if this is balanced (zero CB)
   */
  isBalanced(): boolean {
    return this.cbGco2eq === 0;
  }

  /**
   * Create a new ComplianceBalance with adjusted amount
   * @param adjustment - Amount to adjust (positive or negative)
   * @returns New ComplianceBalance instance
   */
  adjust(adjustment: number): ComplianceBalance {
    return new ComplianceBalance(
      this.shipId,
      this.year,
      this.cbGco2eq + adjustment,
      this.id,
      this.createdAt
    );
  }

  /**
   * Get absolute value of CB
   */
  getAbsoluteValue(): number {
    return Math.abs(this.cbGco2eq);
  }
}

