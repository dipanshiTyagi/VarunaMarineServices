import { Route } from '../domain/Route';
import { IRouteRepository, RouteFilters } from '../ports/IRouteRepository';

/**
 * Use case: Get all routes with optional filters
 */
export class GetRoutesUseCase {
  constructor(private readonly routeRepository: IRouteRepository) {}

  async execute(filters?: RouteFilters): Promise<Route[]> {
    return await this.routeRepository.findAll(filters);
  }
}

