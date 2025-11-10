/**
 * Route domain entity
 * Represents a vessel route with GHG intensity and fuel consumption data
 */
export class Route {
  constructor(
    public readonly routeId: string,
    public readonly vesselType: string,
    public readonly fuelType: string,
    public readonly year: number,
    public readonly ghgIntensity: number, // gCO₂e/MJ
    public readonly fuelConsumption: number, // tonnes
    public readonly distance: number, // km
    public readonly totalEmissions: number, // tonnes
    public readonly isBaseline: boolean = false,
    public readonly id?: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  /**
   * Calculate Compliance Balance (CB) for this route
   * CB = (Target - Actual GHG Intensity) × Energy in Scope
   * Energy in Scope = Fuel Consumption (t) × 41,000 MJ/t
   * @returns Compliance Balance in gCO₂e (positive = surplus, negative = deficit)
   */
  calculateCB(): number {
    const TARGET_2025 = 89.3368; // gCO₂e/MJ
    const ENERGY_PER_TONNE = 41000; // MJ/t

    const energyInScope = this.fuelConsumption * ENERGY_PER_TONNE;
    const cb = (TARGET_2025 - this.ghgIntensity) * energyInScope;

    return cb;
  }

  /**
   * Check if this route is compliant with the target
   * @returns true if ghgIntensity <= target
   */
  isCompliant(): boolean {
    const TARGET_2025 = 89.3368;
    return this.ghgIntensity <= TARGET_2025;
  }

  /**
   * Calculate percentage difference from baseline
   * @param baseline - The baseline route to compare against
   * @returns Percentage difference
   */
  calculatePercentDiff(baseline: Route): number {
    if (baseline.ghgIntensity === 0) {
      throw new Error('Baseline GHG intensity cannot be zero');
    }
    return ((this.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
  }
}

