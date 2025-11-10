import { Route } from '../../../core/domain/Route';
import { IRouteRepository, RouteFilters } from '../../../core/ports/IRouteRepository';
import { prisma } from '../../../infrastructure/db/prismaClient';

/**
 * Prisma implementation of IRouteRepository
 * Maps Prisma models to domain Route entities
 */
export class PrismaRouteRepository implements IRouteRepository {
  /**
   * Map Prisma route model to domain Route entity
   */
  private toDomain(prismaRoute: any): Route {
    return new Route(
      prismaRoute.routeId,
      prismaRoute.vesselType,
      prismaRoute.fuelType,
      prismaRoute.year,
      prismaRoute.ghgIntensity,
      prismaRoute.fuelConsumption,
      prismaRoute.distance,
      prismaRoute.totalEmissions,
      prismaRoute.isBaseline,
      prismaRoute.id,
      prismaRoute.createdAt,
      prismaRoute.updatedAt
    );
  }

  /**
   * Map domain Route entity to Prisma route data
   */
  private toPrisma(route: Route): any {
    return {
      routeId: route.routeId,
      vesselType: route.vesselType,
      fuelType: route.fuelType,
      year: route.year,
      ghgIntensity: route.ghgIntensity,
      fuelConsumption: route.fuelConsumption,
      distance: route.distance,
      totalEmissions: route.totalEmissions,
      isBaseline: route.isBaseline,
    };
  }

  async findAll(filters?: RouteFilters): Promise<Route[]> {
    try {
      const where: any = {};

      if (filters?.vesselType) {
        where.vesselType = filters.vesselType;
      }

      if (filters?.fuelType) {
        where.fuelType = filters.fuelType;
      }

      if (filters?.year) {
        where.year = filters.year;
      }

      const routes = await prisma.route.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return routes.map((route) => this.toDomain(route));
    } catch (error) {
      throw new Error(`Failed to find routes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(routeId: string): Promise<Route | null> {
    try {
      const route = await prisma.route.findUnique({
        where: { routeId },
      });

      return route ? this.toDomain(route) : null;
    } catch (error) {
      throw new Error(`Failed to find route by ID ${routeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByBaseline(): Promise<Route | null> {
    try {
      const route = await prisma.route.findFirst({
        where: { isBaseline: true },
      });

      return route ? this.toDomain(route) : null;
    } catch (error) {
      throw new Error(`Failed to find baseline route: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setBaseline(routeId: string): Promise<void> {
    try {
      await prisma.route.update({
        where: { routeId },
        data: { isBaseline: true },
      });
    } catch (error) {
      throw new Error(`Failed to set baseline for route ${routeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearAllBaselines(): Promise<void> {
    try {
      await prisma.route.updateMany({
        where: { isBaseline: true },
        data: { isBaseline: false },
      });
    } catch (error) {
      throw new Error(`Failed to clear baselines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async save(route: Route): Promise<Route> {
    try {
      const data = this.toPrisma(route);

      // Check if route exists
      const existing = await prisma.route.findUnique({
        where: { routeId: route.routeId },
      });

      if (existing) {
        // Update existing route
        const updated = await prisma.route.update({
          where: { routeId: route.routeId },
          data,
        });
        return this.toDomain(updated);
      } else {
        // Create new route
        const created = await prisma.route.create({
          data,
        });
        return this.toDomain(created);
      }
    } catch (error) {
      throw new Error(`Failed to save route: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

