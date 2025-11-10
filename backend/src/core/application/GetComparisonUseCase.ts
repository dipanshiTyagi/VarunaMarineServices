import { Route } from '../domain/Route';
import { IRouteRepository } from '../ports/IRouteRepository';

export interface ComparisonResult {
  baseline: Route;
  comparisons: Array<{
    route: Route;
    percentDiff: number;
    compliant: boolean;
  }>;
}

/**
 * Use case: Get baseline route and comparison routes
 * Calculates percentage difference and compliance status for each comparison route
 */
export class GetComparisonUseCase {
  constructor(private readonly routeRepository: IRouteRepository) {}

  async execute(): Promise<ComparisonResult> {
    // Get baseline route
    const baseline = await this.routeRepository.findByBaseline();
    if (!baseline) {
      throw new Error('No baseline route found. Please set a baseline route first.');
    }

    // Get all routes (excluding baseline or including it, depending on requirements)
    // For comparison, we typically want all routes including baseline for context
    const allRoutes = await this.routeRepository.findAll();

    // Filter out baseline from comparisons
    const comparisonRoutes = allRoutes.filter((route) => route.routeId !== baseline.routeId);

    // Calculate percentDiff and compliant for each comparison
    const comparisons = comparisonRoutes.map((route) => {
      const percentDiff = route.calculatePercentDiff(baseline);
      const compliant = route.isCompliant();

      return {
        route,
        percentDiff,
        compliant,
      };
    });

    return {
      baseline,
      comparisons,
    };
  }
}

