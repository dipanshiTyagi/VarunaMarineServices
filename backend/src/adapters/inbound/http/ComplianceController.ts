import { Request, Response } from 'express';
import { ComputeCBUseCase, GetAdjustedCBUseCase } from '../../../core/application';

/**
 * Compliance Controller
 * Handles HTTP requests for compliance balance operations
 */
export class ComplianceController {
  constructor(
    private readonly computeCBUseCase: ComputeCBUseCase,
    private readonly getAdjustedCBUseCase: GetAdjustedCBUseCase
  ) {}

  /**
   * GET /compliance/cb?shipId&year
   * Compute and get compliance balance for a ship
   */
  async getCB(req: Request, res: Response): Promise<void> {
    try {
      const shipId = req.query.shipId as string;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

      if (!shipId || !year) {
        res.status(400).json({
          success: false,
          error: 'shipId and year query parameters are required',
        });
        return;
      }

      const cb = await this.computeCBUseCase.execute(shipId, year);

      res.status(200).json({
        success: true,
        data: {
          shipId: cb.shipId,
          year: cb.year,
          cbGco2eq: cb.cbGco2eq,
          isSurplus: cb.isSurplus(),
          isDeficit: cb.isDeficit(),
        },
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compute compliance balance',
      });
    }
  }

  /**
   * GET /compliance/adjusted-cb?shipId&year
   * Get adjusted compliance balance (after bank applications)
   */
  async getAdjustedCB(req: Request, res: Response): Promise<void> {
    try {
      const shipId = req.query.shipId as string;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

      if (!shipId || !year) {
        res.status(400).json({
          success: false,
          error: 'shipId and year query parameters are required',
        });
        return;
      }

      const adjustedCB = await this.getAdjustedCBUseCase.execute(shipId, year);

      res.status(200).json({
        success: true,
        data: {
          shipId: adjustedCB.shipId,
          year: adjustedCB.year,
          cbGco2eq: adjustedCB.cbGco2eq,
          isSurplus: adjustedCB.isSurplus(),
          isDeficit: adjustedCB.isDeficit(),
        },
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get adjusted compliance balance',
      });
    }
  }
}

