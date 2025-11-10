import { IRouteRepository } from '../ports/IRouteRepository';

/**
 * Use case: Set a route as baseline
 * Sets isBaseline=true for the specified route and false for all others
 */
export class SetBaselineUseCase {
  constructor(private readonly routeRepository: IRouteRepository) {}

  async execute(routeId: string): Promise<void> {
    // Check if route exists
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new Error(`Route with ID ${routeId} not found`);
    }

    // Clear all baselines first
    await this.routeRepository.clearAllBaselines();

    // Set the specified route as baseline
    await this.routeRepository.setBaseline(routeId);
  }
}

