import { Request, Response } from 'express';
import { GetRoutesUseCase, SetBaselineUseCase, GetComparisonUseCase } from '../../../core/application';
import { RouteFilters } from '../../../core/ports/IRouteRepository';

/**
 * Routes Controller
 * Handles HTTP requests for route-related operations
 */
export class RoutesController {
  constructor(
    private readonly getRoutesUseCase: GetRoutesUseCase,
    private readonly setBaselineUseCase: SetBaselineUseCase,
    private readonly getComparisonUseCase: GetComparisonUseCase
  ) {}

  /**
   * GET /routes
   * Get all routes with optional filters
   */
  async getAllRoutes(req: Request, res: Response): Promise<void> {
    try {
      const filters: RouteFilters = {
        vesselType: req.query.vesselType as string | undefined,
        fuelType: req.query.fuelType as string | undefined,
        year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
      };

      // Remove undefined values
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof RouteFilters] === undefined) {
          delete filters[key as keyof RouteFilters];
        }
      });

      const routes = await this.getRoutesUseCase.execute(filters);

      res.status(200).json({
        success: true,
        data: routes,
        count: routes.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get routes',
      });
    }
  }

  /**
   * POST /routes/:routeId/baseline
   * Set a route as baseline
   */
  async setBaseline(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;

      if (!routeId) {
        res.status(400).json({
          success: false,
          error: 'Route ID is required',
        });
        return;
      }

      await this.setBaselineUseCase.execute(routeId);

      res.status(200).json({
        success: true,
        message: `Route ${routeId} set as baseline`,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set baseline',
      });
    }
  }

  /**
   * GET /routes/comparison
   * Get baseline route and comparison routes with percentDiff and compliant flags
   */
  async getComparison(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getComparisonUseCase.execute();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('No baseline') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get comparison',
      });
    }
  }
}

